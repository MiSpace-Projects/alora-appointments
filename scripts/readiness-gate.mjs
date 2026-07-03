#!/usr/bin/env node
/**
 * readiness-gate.mjs — automated subset of the production-readiness playbook.
 *
 * Runs on pre-push (hard block) so structural regressions can't leave the
 * machine. It only checks gates that are cheaply and deterministically
 * verifiable from the repo; the full tiered audit (auth flows, load, a11y DOM
 * sweep) still requires a human pass. A failure here means "do not push",
 * not "the whole audit passed".
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const checks = [];
const check = (name, fn) => {
  try {
    const res = fn();
    checks.push({ name, ok: res === true, detail: typeof res === 'string' ? res : '' });
  } catch (err) {
    checks.push({ name, ok: false, detail: err.message });
  }
};

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// 3.1 — middleware must live where Next actually executes it, never under app/.
check('Middleware at src/middleware.ts (executes)', () => existsSync('src/middleware.ts'));
check('No inert middleware under src/app/', () => !existsSync('src/app/middleware.ts'));

// 3.1 — server-side gate exists for protected routes.
check('Protected route group has a server auth layout', () =>
  existsSync('src/app/(protected)/layout.tsx'),
);

// 5.7 — security headers configured.
check(
  'Security headers configured in next.config',
  () =>
    /headers\s*\(/.test(read('next.config.ts')) &&
    /Strict-Transport-Security/.test(read('next.config.ts')),
);

// 1.1 — no real env file tracked by git.
check('No .env* tracked in git (except .env.example)', () => {
  const tracked = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => /(^|\/)\.env/.test(f) && !f.endsWith('.env.example'));
  return tracked.length === 0 ? true : `tracked: ${tracked.join(', ')}`;
});

// 11.1 — the test harness has actual tests.
check('At least one test file exists', () => {
  const hasTest = (dir) =>
    readdirSync(dir, { withFileTypes: true }).some((e) =>
      e.isDirectory() ? hasTest(`${dir}/${e.name}`) : /\.(test|spec)\.[jt]sx?$/.test(e.name),
    );
  return hasTest('src');
});

// 15.1 — CI is defined.
check('CI workflow present', () => existsSync('.github/workflows/ci.yml'));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\n✗ Readiness gate failed (${failed.length}). Push blocked.`);
  process.exit(1);
}
console.log('\n✓ Readiness gate passed.');
