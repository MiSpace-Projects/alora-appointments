jest.mock('@/lib/security-events', () => ({ recordSecurityEvent: jest.fn() }));

import { existingAccountSignUpEmail, operationsAlertEmail } from '@/lib/email';

describe('existingAccountSignUpEmail', () => {
  it('points the owner of the address at sign-in and password reset', () => {
    const content = existingAccountSignUpEmail({
      signIn: 'https://alora.example/login',
      resetPassword: 'https://alora.example/forgot-password?a=1&b=2',
    });
    expect(content.text).toContain('https://alora.example/login');
    expect(content.text).toContain('https://alora.example/forgot-password?a=1&b=2');
    expect(content.html).toContain('forgot-password?a=1&amp;b=2');
    expect(content.text).not.toContain(String.fromCharCode(0x2014));
  });
});

describe('operationsAlertEmail', () => {
  it('lists only non-zero counts and escapes values in HTML', () => {
    const content = operationsAlertEmail({
      windowStart: '2026-11-12T01:00:00.000Z',
      windowEnd: '<b>2026-11-13T01:00:00.000Z</b>',
      lines: [
        { label: 'Emails that failed to send', count: 3 },
        { label: 'Refunds that failed', count: 0 },
        { label: 'Payments <script>', count: 1 },
      ],
    });
    expect(content.text).toContain('Emails that failed to send: 3');
    expect(content.text).not.toContain('Refunds that failed');
    expect(content.html).toContain('Payments &lt;script&gt;');
    expect(content.html).toContain('&lt;b&gt;2026-11-13T01:00:00.000Z&lt;/b&gt;');
    expect(content.html).not.toContain('<script>');
  });
});
