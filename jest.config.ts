/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '<rootDir>/e2e/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.{ts,tsx}'],
  coverageThreshold: {
    './src/lib/validation.ts': { branches: 85, functions: 90, lines: 90, statements: 90 },
    './src/lib/safe-redirect.ts': { branches: 90, functions: 100, lines: 100, statements: 90 },
    './src/lib/auth-config.ts': { branches: 70, functions: 80, lines: 80, statements: 80 },
    './src/lib/password.ts': { branches: 75, functions: 100, lines: 85, statements: 85 },
  },
};

module.exports = config;
