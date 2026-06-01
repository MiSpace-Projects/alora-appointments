/**
 * auth-logger.ts
 * Enterprise-grade structured logger for auth events.
 * Outputs clean, parseable logs with only necessary context.
 * In production, swap `console.*` for your logging service (Datadog, Sentry, etc).
 */

type LogLevel = 'info' | 'warn' | 'error';

type AuthEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGIN_UNKNOWN_USER'
  | 'LOGIN_NETWORK_ERROR'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_RESET_FAILURE'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED'
  | 'SOCIAL_LOGIN_INITIATED'
  | 'SOCIAL_LOGIN_SUCCESS'
  | 'SOCIAL_LOGIN_FAILURE'
  | 'SESSION_REFRESH'
  | 'SESSION_EXPIRED';

interface AuthLogPayload {
  event: AuthEvent;

  userId?: string;

  emailDomain?: string;
  provider?: string;
  errorCode?: string | number;
  errorMessage?: string;
  meta?: Record<string, string | number | boolean>;
}

function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const masked = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
  return `${masked}@${domain}`;
}

function buildLogEntry(level: LogLevel, payload: AuthLogPayload) {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: 'auth',
    ...payload,
  };
}

function emit(level: LogLevel, payload: AuthLogPayload) {
  const entry = buildLogEntry(level, payload);
  const label = `[AUTH:${payload.event}]`;

  if (process.env.NODE_ENV === 'production') {
    // ── Production: emit structured JSON for log aggregators ──
    // Replace this with: datadogLogs.logger.info(label, entry)
    //                 or: Sentry.addBreadcrumb({ message: label, data: entry })
    if (level === 'error') console.error(JSON.stringify(entry));
    else if (level === 'warn') console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
  } else {
    const colors: Record<LogLevel, string> = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    };
    const reset = '\x1b[0m';
    const color = colors[level];
    const { event, errorCode, errorMessage, userId, emailDomain, provider, meta } = payload;

    const parts = [
      color + label + reset,
      userId ? `uid=${userId}` : null,
      emailDomain ? `domain=${emailDomain}` : null,
      provider ? `provider=${provider}` : null,
      errorCode ? `code=${errorCode}` : null,
      errorMessage ? `msg="${errorMessage}"` : null,
      meta ? `meta=${JSON.stringify(meta)}` : null,
    ].filter(Boolean);

    if (level === 'error') console.error(parts.join(' | '));
    else if (level === 'warn') console.warn(parts.join(' | '));
    else console.log(parts.join(' | '));
  }
}

export const authLogger = {
  loginSuccess(userId: string, provider = 'email') {
    emit('info', { event: 'LOGIN_SUCCESS', userId, provider });
  },

  loginFailure(email: string, errorCode?: string | number, errorMessage?: string) {
    emit('warn', {
      event: 'LOGIN_FAILURE',
      emailDomain: obfuscateEmail(email),
      errorCode,
      errorMessage,
    });
  },

  loginUnknownUser(email: string) {
    emit('warn', {
      event: 'LOGIN_UNKNOWN_USER',
      emailDomain: obfuscateEmail(email),
      meta: { hint: 'No account found for this email' },
    });
  },

  loginNetworkError(errorMessage?: string) {
    emit('error', { event: 'LOGIN_NETWORK_ERROR', errorMessage });
  },

  registerSuccess(userId: string) {
    emit('info', { event: 'REGISTER_SUCCESS', userId });
  },

  registerFailure(email: string, errorCode?: string | number, errorMessage?: string) {
    emit('error', {
      event: 'REGISTER_FAILURE',
      emailDomain: obfuscateEmail(email),
      errorCode,
      errorMessage,
    });
  },

  logout(userId: string) {
    emit('info', { event: 'LOGOUT', userId });
  },

  passwordResetRequested(email: string) {
    emit('info', { event: 'PASSWORD_RESET_REQUESTED', emailDomain: obfuscateEmail(email) });
  },

  passwordResetSuccess(userId?: string) {
    emit('info', { event: 'PASSWORD_RESET_SUCCESS', userId });
  },

  passwordResetFailure(email: string, errorMessage?: string) {
    emit('error', {
      event: 'PASSWORD_RESET_FAILURE',
      emailDomain: obfuscateEmail(email),
      errorMessage,
    });
  },

  emailVerificationSent(userId: string) {
    emit('info', { event: 'EMAIL_VERIFICATION_SENT', userId });
  },

  emailVerified(userId: string) {
    emit('info', { event: 'EMAIL_VERIFIED', userId });
  },

  socialLoginInitiated(provider: string) {
    emit('info', { event: 'SOCIAL_LOGIN_INITIATED', provider });
  },

  socialLoginSuccess(userId: string, provider: string) {
    emit('info', { event: 'SOCIAL_LOGIN_SUCCESS', userId, provider });
  },

  socialLoginFailure(provider: string, errorMessage?: string) {
    emit('error', { event: 'SOCIAL_LOGIN_FAILURE', provider, errorMessage });
  },

  sessionRefresh(userId: string) {
    emit('info', { event: 'SESSION_REFRESH', userId });
  },

  sessionExpired(userId?: string) {
    emit('warn', { event: 'SESSION_EXPIRED', userId });
  },
};
