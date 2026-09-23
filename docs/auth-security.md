# Authentication Security Operations

This runbook is the production contract for Alora authentication. The auth API fails closed with
HTTP 503 in production when a required control is missing or malformed.

## Required configuration

Copy the variable names from `.env.example` into the deployment secret manager. Do not commit
production values to a file. Generate each value below independently:

```bash
openssl rand -base64 32
```

Use a different generated value for each of:

- `BETTER_AUTH_SECRET`
- `AUTH_FINGERPRINT_SECRET`
- `EMAIL_OUTBOX_ENCRYPTION_KEY`
- `EMAIL_OUTBOX_WORKER_TOKEN`
- `BREVO_WEBHOOK_TOKEN`

Production validation rejects non-canonical base64 values, values that do not decode to exactly 32
bytes, and reuse across these controls. `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and an optional
`NEXT_PUBLIC_BETTER_AUTH_URL` must use HTTPS. When configured, the public auth URL must use the
same origin as `BETTER_AUTH_URL`.

## Edge and client addresses

`AUTH_IP_ADDRESS_HEADERS` must name exactly one header that the edge removes from inbound client
requests and overwrites before forwarding. `x-forwarded-for` is rejected because it is a chain that
can contain client-supplied values. Examples are `cf-connecting-ip` at Cloudflare or `x-real-ip` on
a controlled reverse proxy.

The origin must not be directly reachable around that edge. Restrict the origin firewall or private
network so clients cannot inject the trusted address header. Set `AUTH_TRUSTED_PROXIES` to exact
proxy addresses or narrow CIDRs when the selected deployment requires proxy validation.

## Cloudflare Turnstile

Create separate widgets for development, staging, and production. Set the public site key, secret
key, and every valid production hostname. Do not include localhost in the production hostname list.

Turnstile protects sign-in, sign-up, password-reset requests, and verification-email requests. The
server validates each token through Siteverify; tokens are single use and expire after five minutes.
Monitor the invalid-token ratio and alert on sustained changes.

## Brevo transactional email

1. Authenticate the sending domain in Brevo and publish its required DKIM records.
2. Publish an SPF policy that includes every legitimate sender for the domain.
3. Publish DMARC in monitoring mode, review reports, then advance to quarantine or reject.
4. Set `BREVO_SENDER_EMAIL` to a verified sender on that domain and set `BREVO_API_KEY` through the
   deployment secret manager.
5. Create a transactional webhook at `https://<production-origin>/api/webhooks/brevo` for request,
   delivered, deferred, soft bounce, hard bounce, blocked, invalid, spam, and error events.
6. Configure the webhook auth object as bearer auth with `BREVO_WEBHOOK_TOKEN`. Do not place this
   token in the URL.

The email outbox encrypts queued bodies with AES-256-GCM, hashes recipient addresses for lookup,
uses provider idempotency headers, retries with bounded exponential backoff, recovers stale claims,
and dead-letters after eight attempts. The encrypted body is erased after Brevo accepts delivery.

Schedule an internal worker at least once per minute:

```text
POST https://<production-origin>/api/internal/email-outbox
Authorization: Bearer <EMAIL_OUTBOX_WORKER_TOKEN>
```

The worker endpoint must only be called from the scheduler network. Alert on `DEAD` outbox rows,
messages pending beyond five minutes, repeated provider failures, hard bounces, blocks, complaints,
and webhook authentication failures.

## Database deployment

Apply migrations before deploying the application version that uses them:

```bash
npm run db:migrate
npx prisma migrate status
```

Migration `2_auth_hardening` adds database rate limits, two-factor data, security events, known
devices, encrypted email outbox records, and the provider-account uniqueness constraint. Its manual
rollback is `prisma/migrations/2_auth_hardening/rollback.sql`; it is destructive and must only be
used after the corresponding application features are disabled and data retention is approved.

## Monitoring and retention

Send structured auth logs and `security_event` records to the central observability platform. Alert
on bursts of blocked logins, identity throttles, MFA lockouts, password resets, duplicate sign-ups,
new-device notifications, configuration failures, and security-event persistence failures.

Set retention through an approved privacy policy before production. A baseline is 90 days for
security events and known-device records, 30 days for successful email metadata, and seven days for
dead-letter payload investigation. Purge encrypted payloads sooner when no longer operationally
required. Never export raw reset tokens, session tokens, MFA secrets, backup codes, or email bodies
to logs.

## Secret rotation

Rotate worker and webhook bearer tokens independently, updating the caller/provider and deployment
in a coordinated change. Rotating `BETTER_AUTH_SECRET` invalidates signed cookies. Rotating the
outbox encryption key makes existing encrypted queued messages unreadable, so drain or explicitly
discard pending rows first. Record every rotation in the change log and verify login, logout,
verification, password reset, MFA, and email delivery afterward.

## Verification commands

```bash
npm run typecheck
npm run lint
npm run test:coverage -- --runInBand
npm run test:e2e
npm run security:audit
npx prisma migrate status
```

The complete lifecycle test creates a unique account, verifies email from the encrypted outbox,
resets its password, confirms old-session revocation, exercises browser redirects and logout,
enrolls TOTP with encrypted backup codes, completes an MFA challenge, verifies rate limiting, and
removes its records afterward.
