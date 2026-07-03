import 'server-only';
import { Resend } from 'resend';

/**
 * Central transactional email. One place owns the Resend client, the sender
 * address and the templates, so auth (and later booking/receipt mail) don't
 * duplicate send logic.
 *
 * Sender is env-driven (EMAIL_FROM) — never hardcode a domain in code. For real
 * delivery to customers, EMAIL_FROM must be an address on a domain you've
 * verified in Resend (with SPF/DKIM/DMARC DNS records); the resend.dev sandbox
 * sender only delivers to your own Resend account address.
 */
const FROM = process.env.EMAIL_FROM ?? 'Alora <onboarding@resend.dev>';

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Returns true if dispatched, false if it couldn't be (no API
 * key configured, or Resend rejected it) — callers use the false path to log a
 * fallback link in development instead of failing the request.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not configured — email not sent');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error('[email] send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw:', err);
    return false;
  }
}

// ── Templates ──────────────────────────────────────────────
// Shared shell keeps every Alora email visually consistent (#d4c5b0 accent).

function shell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4c5b0;">${heading}</h2>
      ${bodyHtml}
    </div>
  `;
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}" style="background: #d4c5b0; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${label}</a>`;
}

export function verificationEmail(url: string): string {
  return shell(
    'Welcome to Alora!',
    `<p>Please verify your email address to start using your account.</p>
     ${ctaButton(url, 'Verify Email')}
     <p>Or copy this link: ${url}</p>
     <p>This link expires in 24 hours.</p>
     <p>If you didn't create an account, ignore this email.</p>`,
  );
}

export function resetPasswordEmail(url: string): string {
  return shell(
    'Reset Your Password',
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
     ${ctaButton(url, 'Reset Password')}
     <p>Or copy this link: ${url}</p>
     <p>If you didn't request this, ignore this email.</p>`,
  );
}
