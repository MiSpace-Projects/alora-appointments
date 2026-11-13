jest.mock('@/lib/security-events', () => ({ recordSecurityEvent: jest.fn() }));

import { existingAccountSignUpEmail } from '@/lib/email';

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
