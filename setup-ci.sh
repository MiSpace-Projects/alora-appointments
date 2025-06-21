#!/bin/bash

echo "🔧 Setting up Alora CI/Code Quality tools..."

echo "Installing dev dependencies..."
npm install --save-dev \
  eslint prettier jest ts-jest @types/jest \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-next \
  husky lint-staged \
  @commitlint/cli @commitlint/config-conventional

echo "Creating .prettierrc..."
cat > .prettierrc <<EOL
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOL

echo "Updating eslint.config.mjs..."
cat > eslint.config.mjs <<'EOL'
import eslintPlugin from 'eslint-plugin-next';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ['**/node_modules/**', '**/.next/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  eslintPlugin.configs['recommended'],
];
EOL

echo "Creating jest.config.js..."
cat > jest.config.js <<EOL
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
EOL

echo "Creating commitlint.config.js..."
cat > commitlint.config.js <<EOL
module.exports = { extends: ['@commitlint/config-conventional'] };
EOL

echo "Setting up Husky hooks..."
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \$1"

echo "Updating package.json with lint-staged..."
npx json -I -f package.json -e '
  this["lint-staged"] = {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }'

echo "Adding test & coverage scripts..."
npx json -I -f package.json -e '
  this.scripts = Object.assign(this.scripts || {}, {
    "test": "jest",
    "test:coverage": "jest --coverage"
  })'

mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'EOL'
name: CI & Docker

on:
  push:
    branches: ['*']
  pull_request:
    branches: ['*']

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint || exit 1

      - name: Prettier Check
        run: npx prettier . --check || exit 1

      - name: Run Tests
        run: npm run test:coverage

      - name: Check Test Coverage
        run: |
          COVERAGE=$(npx jest --coverage --silent | grep -oP 'All files[^|]+\|\s+\K([0-9]+)(?=%)' | head -1)
          if [ "$COVERAGE" -lt 80 ]; then
            echo "Coverage is below 80%"
            exit 1
          else
            echo "Coverage is $COVERAGE%"
          fi

  commit-msg-check:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Validate commit message
        uses: wagoid/commitlint-github-action@v5

  docker:
    name: Docker Build & Push
    runs-on: ubuntu-latest
    needs: [check]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: your-dockerhub-username/alora-appointments:latest
EOL

echo "Setup complete!"
