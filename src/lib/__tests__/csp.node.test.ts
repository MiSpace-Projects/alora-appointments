import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCsp, EMPTY_STYLE_HASH, SONNER_STYLE_HASH } from '@/lib/csp';

function sha256(value: string): string {
  return `sha256-${createHash('sha256').update(value).digest('base64')}`;
}

function sonnerInjectedCss(file: string): string {
  const source = readFileSync(join(process.cwd(), 'node_modules/sonner/dist', file), 'utf8');
  const match = source.match(/__insertCSS\(("(?:[^"\\]|\\.)*")\)/);
  if (!match) throw new Error(`sonner ${file} no longer injects CSS with __insertCSS`);
  return JSON.parse(match[1]) as string;
}

function directive(csp: string, name: string): string | undefined {
  return csp.split('; ').find((entry) => entry === name || entry.startsWith(`${name} `));
}

describe('buildCsp', () => {
  it.each(['index.mjs', 'index.js'])(
    'allows the exact stylesheet sonner %s injects at runtime',
    (file) => {
      expect(sha256(sonnerInjectedCss(file))).toBe(SONNER_STYLE_HASH);
    },
  );

  it('allows only an empty inline style besides the sonner stylesheet', () => {
    expect(sha256('')).toBe(EMPTY_STYLE_HASH);
  });

  it('keeps production styles locked to self, the nonce and the known hashes', () => {
    const csp = buildCsp('abc123', 'production');

    expect(directive(csp, 'style-src')).toBe(
      `style-src 'self' 'nonce-abc123' '${SONNER_STYLE_HASH}' '${EMPTY_STYLE_HASH}'`,
    );
    expect(csp).not.toContain("style-src 'self' 'unsafe-inline'");
    expect(directive(csp, 'script-src')).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('fonts.googleapis.com');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('relaxes inline styles only in development for the Next dev tools', () => {
    const csp = buildCsp('abc123', 'development');

    expect(directive(csp, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
    expect(directive(csp, 'script-src')).toBe(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic' 'unsafe-eval' ws: http:",
    );
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('does not relax inline styles in test or unknown environments', () => {
    for (const environment of ['test', undefined]) {
      expect(directive(buildCsp('n', environment), 'style-src')).toBe(
        `style-src 'self' 'nonce-n' '${SONNER_STYLE_HASH}' '${EMPTY_STYLE_HASH}'`,
      );
    }
  });
});
