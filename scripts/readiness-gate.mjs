#!/usr/bin/env node
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

check(
  'Edge auth gate at src root (proxy.ts / middleware.ts)',
  () => existsSync('src/proxy.ts') || existsSync('src/middleware.ts'),
);
check('No inert middleware under src/app/', () => !existsSync('src/app/middleware.ts'));

check('Protected route group has a server auth layout', () =>
  existsSync('src/app/(protected)/layout.tsx'),
);

check(
  'Security headers configured in next.config',
  () =>
    /headers\s*\(/.test(read('next.config.ts')) &&
    /Strict-Transport-Security/.test(read('next.config.ts')),
);

check('No .env* tracked in git (except .env.example)', () => {
  const tracked = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => /(^|\/)\.env/.test(f) && !f.endsWith('.env.example'));
  return tracked.length === 0 ? true : `tracked: ${tracked.join(', ')}`;
});

check('At least one test file exists', () => {
  const hasTest = (dir) =>
    readdirSync(dir, { withFileTypes: true }).some((e) =>
      e.isDirectory() ? hasTest(`${dir}/${e.name}`) : /\.(test|spec)\.[jt]sx?$/.test(e.name),
    );
  return hasTest('src');
});

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
