export type AuthErrorCategory =
  | 'UNKNOWN_USER'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'SERVER'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_DISABLED'
  | 'UNKNOWN';

export interface ClassifiedAuthError {
  category: AuthErrorCategory;
  userMessage: string;
  raw?: string | number;
}

const ERROR_MAP: Record<string, ClassifiedAuthError> = {
  USER_NOT_FOUND: {
    category: 'UNKNOWN_USER',
    userMessage: 'No account found with that email address.',
  },
  user_not_found: {
    category: 'UNKNOWN_USER',
    userMessage: 'No account found with that email address.',
  },
  'No user found': {
    category: 'UNKNOWN_USER',
    userMessage: 'No account found with that email address.',
  },

  INVALID_PASSWORD: {
    category: 'INVALID_CREDENTIALS',
    userMessage: 'Incorrect password. Please try again.',
  },
  invalid_password: {
    category: 'INVALID_CREDENTIALS',
    userMessage: 'Incorrect password. Please try again.',
  },
  INVALID_CREDENTIALS: {
    category: 'INVALID_CREDENTIALS',
    userMessage: 'Invalid email or password.',
  },
  invalid_credentials: {
    category: 'INVALID_CREDENTIALS',
    userMessage: 'Invalid email or password.',
  },

  RATE_LIMIT_EXCEEDED: {
    category: 'RATE_LIMITED',
    userMessage: 'Too many attempts. Please wait a moment and try again.',
  },
  rate_limit_exceeded: {
    category: 'RATE_LIMITED',
    userMessage: 'Too many attempts. Please wait a moment and try again.',
  },
  TOO_MANY_REQUESTS: {
    category: 'RATE_LIMITED',
    userMessage: 'Too many attempts. Please wait a moment and try again.',
  },

  EMAIL_NOT_VERIFIED: {
    category: 'EMAIL_NOT_VERIFIED',
    userMessage: 'Please verify your email address before signing in.',
  },
  email_not_verified: {
    category: 'EMAIL_NOT_VERIFIED',
    userMessage: 'Please verify your email address before signing in.',
  },

  ACCOUNT_DISABLED: {
    category: 'ACCOUNT_DISABLED',
    userMessage: 'This account has been disabled. Please contact support.',
  },
};

const NETWORK_MESSAGES = [
  'fetch failed',
  'failed to fetch',
  'network error',
  'networkerror',
  'econnrefused',
  'enotfound',
  'timeout',
];

export function classifyAuthError(error: unknown, rawCode?: string | number): ClassifiedAuthError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (NETWORK_MESSAGES.some((kw) => msg.includes(kw))) {
      return {
        category: 'NETWORK',
        userMessage: 'Connection problem. Check your internet and try again.',
        raw: rawCode,
      };
    }
  }

  if (rawCode) {
    const key = String(rawCode);
    if (ERROR_MAP[key]) return { ...ERROR_MAP[key], raw: rawCode };
  }

  if (error instanceof Error) {
    for (const [key, value] of Object.entries(ERROR_MAP)) {
      if (error.message.toLowerCase().includes(key.toLowerCase())) {
        return { ...value, raw: rawCode };
      }
    }
  }

  if (typeof rawCode === 'number') {
    if (rawCode === 429) {
      return {
        category: 'RATE_LIMITED',
        userMessage: 'Too many attempts. Please wait a moment and try again.',
        raw: rawCode,
      };
    }
    if (rawCode >= 500) {
      return {
        category: 'SERVER',
        userMessage: 'Our server encountered an issue. Please try again shortly.',
        raw: rawCode,
      };
    }
  }

  return {
    category: 'UNKNOWN',
    userMessage: 'Something went wrong. Please try again.',
    raw: rawCode,
  };
}
