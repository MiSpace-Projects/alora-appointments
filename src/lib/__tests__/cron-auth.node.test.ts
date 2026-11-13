import { isAuthorizedCronRequest } from '@/lib/cron-auth';

const secret = 'a-long-random-cron-secret-value';

describe('isAuthorizedCronRequest', () => {
  it('accepts the exact bearer secret', () => {
    expect(isAuthorizedCronRequest(`Bearer ${secret}`, secret)).toBe(true);
  });

  it('rejects a wrong or missing header', () => {
    expect(isAuthorizedCronRequest(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorizedCronRequest(secret, secret)).toBe(false);
    expect(isAuthorizedCronRequest(null, secret)).toBe(false);
    expect(isAuthorizedCronRequest('', secret)).toBe(false);
  });

  it('fails closed when the secret is unset or too short', () => {
    expect(isAuthorizedCronRequest('Bearer ', undefined)).toBe(false);
    expect(isAuthorizedCronRequest('Bearer ', '')).toBe(false);
    expect(isAuthorizedCronRequest('Bearer undefined', undefined)).toBe(false);
    expect(isAuthorizedCronRequest('Bearer short', 'short')).toBe(false);
  });
});
