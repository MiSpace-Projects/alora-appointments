#!/bin/bash

echo "🔧 Setting up Alora CI/Code Quality tools..."

# Step 1: Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install --save-dev \
  eslint prettier jest ts-jest @types/jest \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  husky lint-staged \
  @commitlint/cli @commitlint/config-conventional

# Step 2: Setup Prettier config
echo "⚙️ Creating .prettierrc..."
cat > .prettierrc <<EOL
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOL

# Step 3: Update ESLint (Flat config assumed)
echo "⚙️ Updating eslint.config.mjs..."
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

# Step 4: Setup Jest config
echo "🧪 Creating jest.config.js..."
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

# Step 5: Setup commitlint
echo "📜 Creating commitlint.config.js..."
cat > commitlint.config.js <<EOL
module.exports = { extends: ['@commitlint/config-conventional'] };
EOL

# Step 6: Setup Husky
echo "🐶 Setting up Husky hooks..."
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \$1"

# Step 7: Configure lint-staged in package.json
echo "📄 Updating package.json with lint-staged..."
npx json -I -f package.json -e '
  this["lint-staged"] = {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }'

# Step 8: Add scripts
echo "📜 Adding test & coverage scripts..."
npx json -I -f package.json -e '
  this.scripts = Object.assign(this.scripts || {}, {
    "test": "jest",
    "test:coverage": "jest --coverage"
  })'

# Step 9: (Optional) Create CI pipeline
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'EOL'
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

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
            echo "❌ Coverage is below 80%"
            exit 1
          else
            echo "✅ Coverage is $COVERAGE%"
          fi

  commit-msg-check:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Validate commit message
        uses: wagoid/commitlint-github-action@v5
EOL

echo "✅ Setup complete!"
