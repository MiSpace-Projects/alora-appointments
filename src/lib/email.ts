import 'server-only';
import { Resend } from 'resend';
import { authRuntimeConfig } from './auth-config';
import { recordSecurityEvent } from './security-events';

/**
 * Transactional email via Resend (direct send).
 *
 * Sender is env-driven (EMAIL_FROM) — never hardcode a domain. For real delivery
 * to customers, EMAIL_FROM must be an address on a domain verified in Resend
 * (SPF/DKIM). When no key is configured the send is skipped rather than failing
 * the auth flow, and the action link (in the text body) is logged so local dev
 * isn't blocked.
 */

export type AuthEmailKind =
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'NEW_DEVICE'
  | 'DELETE_ACCOUNT';

interface SendAuthEmailInput {
  kind: AuthEmailKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
}

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<boolean> {
  const { apiKey, from } = authRuntimeConfig.email;

  if (!apiKey || !from) {
    console.warn(`[email] Resend not configured — ${input.kind} not sent. ${input.text}`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error('[email] send failed:', error);
      await recordSecurityEvent({
        event: 'EMAIL_DISPATCHED',
        outcome: 'FAILURE',
        metadata: { kind: input.kind },
      });
      return false;
    }

    await recordSecurityEvent({
      event: 'EMAIL_DISPATCHED',
      outcome: 'SUCCESS',
      metadata: { kind: input.kind },
    });
    return true;
  } catch (error) {
    console.error('[email] send threw:', error);
    await recordSecurityEvent({
      event: 'EMAIL_DISPATCHED',
      outcome: 'FAILURE',
      metadata: { kind: input.kind },
    });
    return false;
  }
}

// ── Templates ──────────────────────────────────────────────
// Shared shell keeps every Alora email visually consistent (#d4c5b0 accent).

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

export function deleteAccountEmail(url: string): { html: string; text: string } {
  return {
    html: shell(
      'Confirm Account Deletion',
      `<p>You asked us to delete your Alora account. Click below to confirm. Your sign-in details, loyalty points and personal information will be removed; booking and payment records are kept without your name for five years as tax law requires.</p>
       ${ctaButton(url, 'Delete My Account')}
       <p>Or copy this link: ${escapeHtml(url)}</p>
       <p>This link expires in 24 hours. If you did not request this, ignore this email and consider changing your password.</p>`,
    ),
    text: `Confirm deletion of your Alora account: ${url}\n\nThis link expires in 24 hours. If you did not request this, ignore this email.`,
  };
}
