import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { BrevoClient } from '@getbrevo/brevo';
import { authRuntimeConfig, getEmailOutboxKey } from './auth-config';
import { prisma } from './prisma';
import { fingerprint, recordSecurityEvent } from './security-events';

const MAX_ATTEMPTS = 8;
const LOCK_TIMEOUT_MS = 10 * 60 * 1_000;
const DEFAULT_BATCH_SIZE = 20;
const TERMINAL_DELIVERY_STATUSES = [
  'DELIVERED',
  'HARD_BOUNCE',
  'BLOCKED',
  'INVALID',
  'COMPLAINT',
  'ERROR',
];

export type AuthEmailKind =
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'NEW_DEVICE';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags: string[];
}

interface QueueEmailInput extends EmailPayload {
  kind: AuthEmailKind;
}

interface BrevoWebhookEvent {
  event?: string;
  email?: string;
  'message-id'?: string;
  reason?: string;
}

function encode(value: Buffer): string {
  return value.toString('base64url');
}

function encryptPayload(payload: EmailPayload): string {
  const key = getEmailOutboxKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return `v1.${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(encrypted)}`;
}

function decryptPayload(value: string): EmailPayload {
  const [version, ivValue, tagValue, encryptedValue] = value.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Unsupported email payload envelope');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEmailOutboxKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8')) as EmailPayload;
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { statusCode?: unknown; name?: unknown };
    if (typeof candidate.statusCode === 'number') return `HTTP_${candidate.statusCode}`;
    if (typeof candidate.name === 'string') return candidate.name.slice(0, 80);
  }
  return 'UNKNOWN_PROVIDER_ERROR';
}

function retryAt(attempt: number): Date {
  const delaySeconds = Math.min(30 * 2 ** Math.max(0, attempt - 1), 6 * 60 * 60);
  return new Date(Date.now() + delaySeconds * 1_000);
}

async function claimMessage(id: string): Promise<boolean> {
  const now = new Date();
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  const claimed = await prisma.emailOutbox.updateMany({
    where: {
      id,
      OR: [
        { status: 'PENDING', nextAttemptAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lt: staleLock } },
      ],
    },
    data: {
      status: 'PROCESSING',
      lockedAt: now,
      attempts: { increment: 1 },
    },
  });
  return claimed.count === 1;
}

async function deliverClaimedMessage(id: string): Promise<boolean> {
  const message = await prisma.emailOutbox.findUnique({ where: { id } });
  if (!message?.encryptedPayload) return false;

  try {
    if (!authRuntimeConfig.email.apiKey) throw new Error('BREVO_NOT_CONFIGURED');
    if (!authRuntimeConfig.email.senderEmail) throw new Error('BREVO_SENDER_NOT_CONFIGURED');

    const payload = decryptPayload(message.encryptedPayload);
    const client = new BrevoClient({
      apiKey: authRuntimeConfig.email.apiKey,
      maxRetries: 3,
    });
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: {
        email: authRuntimeConfig.email.senderEmail,
        name: authRuntimeConfig.email.senderName,
      },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
      tags: payload.tags,
      headers: {
        'Idempotency-Key': id,
        'X-Alora-Message-Id': id,
      },
    });

    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: 'SENT',
        encryptedPayload: null,
        providerMessageId: response.messageId ?? response.messageIds?.[0] ?? null,
        lastErrorCode: null,
        lockedAt: null,
        sentAt: new Date(),
      },
    });
    await recordSecurityEvent({
      event: 'EMAIL_DISPATCHED',
      outcome: 'SUCCESS',
      metadata: { kind: message.kind, outboxId: id },
    });
    return true;
  } catch (error) {
    const terminal = message.attempts >= MAX_ATTEMPTS;
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: terminal ? 'DEAD' : 'PENDING',
        nextAttemptAt: retryAt(message.attempts),
        lastErrorCode: errorCode(error),
        lockedAt: null,
      },
    });
    await recordSecurityEvent({
      event: 'EMAIL_DISPATCHED',
      outcome: terminal ? 'FAILURE' : 'INFO',
      metadata: {
        kind: message.kind,
        outboxId: id,
        attempt: message.attempts,
        errorCode: errorCode(error),
      },
    });
    return false;
  }
}

export async function queueAuthEmail(input: QueueEmailInput): Promise<string> {
  const id = randomUUID();
  await prisma.emailOutbox.create({
    data: {
      id,
      kind: input.kind,
      recipientHash: fingerprint(input.to),
      encryptedPayload: encryptPayload({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      }),
    },
  });

  if (await claimMessage(id)) await deliverClaimedMessage(id);
  return id;
}

export async function processEmailOutbox(limit = DEFAULT_BATCH_SIZE): Promise<{
  claimed: number;
  sent: number;
}> {
  const now = new Date();
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  const candidates = await prisma.emailOutbox.findMany({
    where: {
      OR: [
        { status: 'PENDING', nextAttemptAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lt: staleLock } },
      ],
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 100),
    select: { id: true },
  });

  let claimed = 0;
  let sent = 0;
  for (const candidate of candidates) {
    if (!(await claimMessage(candidate.id))) continue;
    claimed += 1;
    if (await deliverClaimedMessage(candidate.id)) sent += 1;
  }
  return { claimed, sent };
}

export async function applyBrevoWebhook(event: BrevoWebhookEvent): Promise<boolean> {
  const messageId = event['message-id'];
  if (!messageId || !event.event) return false;

  const statusByEvent: Record<string, string> = {
    request: 'SENT',
    delivered: 'DELIVERED',
    deferred: 'DEFERRED',
    soft_bounce: 'SOFT_BOUNCE',
    hard_bounce: 'HARD_BOUNCE',
    blocked: 'BLOCKED',
    invalid: 'INVALID',
    spam: 'COMPLAINT',
    error: 'ERROR',
  };
  const status = statusByEvent[event.event];
  if (!status) return true;

  const updated = await prisma.emailOutbox.updateMany({
    where: {
      providerMessageId: { in: [messageId, `<${messageId}>`, messageId.replace(/[<>]/g, '')] },
      status: { notIn: TERMINAL_DELIVERY_STATUSES },
    },
    data: {
      status,
      lastErrorCode: event.reason ? event.reason.slice(0, 120) : null,
    },
  });

  await recordSecurityEvent({
    event: 'EMAIL_DELIVERY_EVENT',
    outcome: ['HARD_BOUNCE', 'BLOCKED', 'INVALID', 'COMPLAINT', 'ERROR'].includes(status)
      ? 'FAILURE'
      : 'INFO',
    actor: event.email ?? null,
    metadata: { provider: 'brevo', status, matched: updated.count },
  });
  return true;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return replacements[character] ?? character;
  });
}

function shell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4c5b0;">${escapeHtml(heading)}</h2>
      ${bodyHtml}
    </div>
  `;
}

function ctaButton(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="background: #d4c5b0; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${escapeHtml(label)}</a>`;
}

export function verificationEmail(url: string): { html: string; text: string } {
  return {
    html: shell(
      'Welcome to Alora!',
      `<p>Please verify your email address when convenient to help secure your account.</p>
       ${ctaButton(url, 'Verify Email')}
       <p>Or copy this link: ${escapeHtml(url)}</p>
       <p>This link expires in 24 hours.</p>
       <p>If you did not create an account, you can ignore this email.</p>`,
    ),
    text: `Verify your Alora email: ${url}\n\nThis link expires in 24 hours.`,
  };
}

export function resetPasswordEmail(url: string): { html: string; text: string } {
  return {
    html: shell(
      'Reset Your Password',
      `<p>Use the link below to reset your password. This link expires in 1 hour.</p>
       ${ctaButton(url, 'Reset Password')}
       <p>Or copy this link: ${escapeHtml(url)}</p>
       <p>If you did not request this, you can ignore this email.</p>`,
    ),
    text: `Reset your Alora password: ${url}\n\nThis link expires in 1 hour.`,
  };
}

export function passwordChangedEmail(): { html: string; text: string } {
  return {
    html: shell(
      'Your Password Was Changed',
      '<p>Your Alora password was changed and all existing sessions were signed out.</p><p>If this was not you, reset your password immediately and contact support.</p>',
    ),
    text: 'Your Alora password was changed and all existing sessions were signed out. If this was not you, reset your password immediately and contact support.',
  };
}

export function newDeviceEmail(): { html: string; text: string } {
  return {
    html: shell(
      'New Sign-In Detected',
      '<p>Your Alora account was signed in from a device we have not seen before.</p><p>If this was not you, reset your password and revoke active sessions from your profile.</p>',
    ),
    text: 'Your Alora account was signed in from a new device. If this was not you, reset your password and revoke active sessions from your profile.',
  };
}
