import { classifyAuthError } from '@/lib/auth-errors';

describe('classifyAuthError', () => {
  it('classifies network failures from the message', () => {
    expect(classifyAuthError(new Error('fetch failed')).category).toBe('NETWORK');
    expect(classifyAuthError(new Error('NetworkError when attempting')).category).toBe('NETWORK');
  });

  it('maps known credential codes', () => {
    expect(classifyAuthError(null, 'INVALID_PASSWORD').category).toBe('INVALID_CREDENTIALS');
    expect(classifyAuthError(null, 'USER_NOT_FOUND').category).toBe('UNKNOWN_USER');
  });

  it('maps rate limiting from code and 429', () => {
    expect(classifyAuthError(null, 'RATE_LIMIT_EXCEEDED').category).toBe('RATE_LIMITED');
    expect(classifyAuthError(null, 429).category).toBe('RATE_LIMITED');
  });

  it('treats 5xx as server errors', () => {
    expect(classifyAuthError(null, 500).category).toBe('SERVER');
    expect(classifyAuthError(null, 503).category).toBe('SERVER');
  });

  it('falls back to UNKNOWN for unrecognised input', () => {
    const result = classifyAuthError(new Error('something odd'));
    expect(result.category).toBe('UNKNOWN');
    expect(result.userMessage).toMatch(/something went wrong/i);
  });

  it('prioritises network detection over a code match', () => {
    expect(classifyAuthError(new Error('fetch failed'), 'INVALID_PASSWORD').category).toBe(
      'NETWORK',
    );
  });
});
