import { auth } from '@/lib/auth';
import { getProductionAuthConfigurationErrors } from '@/lib/auth-config';
import {
  consumeIdentityThrottle,
  getIdentityPolicy,
  IdentityRateLimitError,
} from '@/lib/identity-throttle';
import { getConfiguredClientAddress, recordSecurityEvent } from '@/lib/security-events';
import { verifyPersistedSignUp } from '@/lib/sign-up-persistence';
import { toNextJsHandler } from 'better-auth/next-js';

const handlers = toNextJsHandler(auth.handler);
const AUTH_PREFIX = '/api/auth';

interface AuthRequestBody {
  email?: unknown;
  name?: unknown;
}

const EVENT_BY_PATH: Record<string, string> = {
  '/sign-in/email': 'LOGIN',
  '/sign-up/email': 'REGISTER',
  '/sign-out': 'LOGOUT',
  '/request-password-reset': 'PASSWORD_RESET_REQUEST',
  '/reset-password': 'PASSWORD_RESET',
  '/send-verification-email': 'EMAIL_VERIFICATION_REQUEST',
  '/verify-email': 'EMAIL_VERIFICATION',
  '/two-factor/enable': 'TWO_FACTOR_ENABLE',
  '/two-factor/disable': 'TWO_FACTOR_DISABLE',
  '/two-factor/verify-totp': 'TWO_FACTOR_VERIFY',
  '/two-factor/verify-backup-code': 'TWO_FACTOR_BACKUP_VERIFY',
  '/revoke-session': 'SESSION_REVOKE',
  '/revoke-sessions': 'SESSIONS_REVOKE_ALL',
  '/revoke-other-sessions': 'SESSIONS_REVOKE_OTHER',
};

function authPath(request: Request): string {
  const pathname = new URL(request.url).pathname;
  return pathname.startsWith(AUTH_PREFIX) ? pathname.slice(AUTH_PREFIX.length) || '/' : pathname;
}

async function requestBody(request: Request): Promise<AuthRequestBody> {
  try {
    return (await request.clone().json()) as AuthRequestBody;
  } catch {
    return {};
  }
}

function configurationFailure(errors: string[]): Response {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'auth',
      event: 'AUTH_CONFIGURATION_INVALID',
      missingControls: errors,
    }),
  );
  return Response.json(
    { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

function duplicateSignUpResponse(): Response {
  return Response.json(
    {
      code: 'USER_ALREADY_EXISTS',
      message: 'An account with this email already exists. Sign in instead.',
    },
    { status: 409, headers: { 'Cache-Control': 'no-store' } },
  );
}

function signUpPersistenceFailure(): Response {
  return Response.json(
    {
      code: 'ACCOUNT_PERSISTENCE_FAILED',
      message: 'The account could not be created. Please try again.',
    },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}

async function handlePost(request: Request): Promise<Response> {
  const configurationErrors = getProductionAuthConfigurationErrors();
  if (configurationErrors.length > 0) return configurationFailure(configurationErrors);

  const path = authPath(request);
  const body = await requestBody(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const policy = getIdentityPolicy(path);
  const sessionBefore = EVENT_BY_PATH[path]
    ? await auth.api.getSession({ headers: request.headers })
    : null;

  if (policy && email) {
    try {
      await consumeIdentityThrottle(policy, email);
    } catch (error) {
      if (!(error instanceof IdentityRateLimitError)) throw error;
      await recordSecurityEvent({
        event: EVENT_BY_PATH[path] ?? 'AUTH_REQUEST',
        outcome: 'BLOCKED',
        actor: email,
        ipAddress: getConfiguredClientAddress(request.headers),
        userAgent: request.headers.get('user-agent'),
        metadata: { reason: 'identity-rate-limit' },
      });
      return Response.json(
        { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(error.retryAfter),
            'X-Retry-After': String(error.retryAfter),
          },
        },
      );
    }
  }

  let response = await handlers.POST(request);

  if (path === '/sign-up/email' && response.ok && email && name) {
    try {
      const payload = (await response.clone().json()) as unknown;
      const persistence = await verifyPersistedSignUp(payload, { email, name });
      if (persistence === 'DUPLICATE') response = duplicateSignUpResponse();
      if (persistence === 'INVALID') response = signUpPersistenceFailure();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          service: 'auth',
          event: 'SIGN_UP_PERSISTENCE_CHECK_FAILED',
          error: error instanceof Error ? error.message : 'Unknown persistence check failure',
        }),
      );
      response = signUpPersistenceFailure();
    }
  }

  const event = EVENT_BY_PATH[path];
  if (event) {
    await recordSecurityEvent({
      event,
      outcome: response.ok
        ? 'SUCCESS'
        : [409, 429].includes(response.status)
          ? 'BLOCKED'
          : 'FAILURE',
      userId: sessionBefore?.user.id ?? null,
      actor: email,
      ipAddress: getConfiguredClientAddress(request.headers),
      userAgent: request.headers.get('user-agent'),
      metadata: { status: response.status, path },
    });
  }
  return response;
}

async function handleGet(request: Request): Promise<Response> {
  const configurationErrors = getProductionAuthConfigurationErrors();
  if (configurationErrors.length > 0) return configurationFailure(configurationErrors);
  const response = await handlers.GET(request);
  const path = authPath(request);
  const event = EVENT_BY_PATH[path];
  if (event) {
    await recordSecurityEvent({
      event,
      outcome: response.ok ? 'SUCCESS' : 'FAILURE',
      ipAddress: getConfiguredClientAddress(request.headers),
      userAgent: request.headers.get('user-agent'),
      metadata: { status: response.status, path },
    });
  }
  return response;
}

export const POST = handlePost;
export const GET = handleGet;
