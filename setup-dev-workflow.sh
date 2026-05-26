#!/usr/bin/env bash
# =============================================================================
# setup-dev-workflow.sh
# Senior-grade pre-commit / linting / formatting / testing workflow
# for React / Next.js projects
#
# Usage:
#   chmod +x setup-dev-workflow.sh
#   ./setup-dev-workflow.sh
#
# Assumes: Node.js >= 18, npm/yarn/pnpm, existing package.json, git repo init'd
# =============================================================================

set -euo pipefail

# ─── Colour helpers ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }

# ─── Detect package manager ──────────────────────────────────────────────────
detect_pm() {
  if [ -f "pnpm-lock.yaml" ]; then echo "pnpm"
  elif [ -f "yarn.lock" ];    then echo "yarn"
  else                             echo "npm"
  fi
}
PM=$(detect_pm)
info "Detected package manager: $PM"

run_install() {
  case $PM in
    pnpm) pnpm add -D "$@" ;;
    yarn) yarn add -D "$@" ;;
    *)    npm install -D "$@" ;;
  esac
}

# ─── 1. ESLint ───────────────────────────────────────────────────────────────
info "Installing ESLint + plugins..."
run_install \
  eslint \
  eslint-config-next \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-plugin-import \
  eslint-plugin-unused-imports \
  eslint-config-prettier   # must be last — disables rules that conflict with Prettier

cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": "./tsconfig.json" },
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "unused-imports"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "settings": {
    "react": { "version": "detect" },
    "import/resolver": { "typescript": {} }
  }
}
EOF
success "ESLint configured → .eslintrc.json"

# ─── 2. Prettier ─────────────────────────────────────────────────────────────
info "Installing Prettier..."
run_install prettier

cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

cat > .prettierignore << 'EOF'
.next
node_modules
dist
out
coverage
*.min.js
public
EOF
success "Prettier configured → .prettierrc.json"

# ─── 3. Husky (git hooks) ────────────────────────────────────────────────────
info "Installing & initialising Husky..."
run_install husky

# init creates .husky/ and adds prepare script
case $PM in
  pnpm) pnpm exec husky init ;;
  yarn) yarn husky init ;;
  *)    npx husky init ;;
esac

success "Husky initialised → .husky/"

# ─── 4. lint-staged ──────────────────────────────────────────────────────────
info "Installing lint-staged..."
run_install lint-staged

cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=10",
    "prettier --write"
  ],
  "*.{js,jsx,mjs,cjs}": [
    "eslint --fix --max-warnings=10",
    "prettier --write"
  ],
  "*.{json,md,mdx,css,scss,yaml,yml}": [
    "prettier --write"
  ]
}
EOF
success "lint-staged configured → .lintstagedrc.json"

# ─── 5. Commitlint ───────────────────────────────────────────────────────────
info "Installing Commitlint..."
run_install \
  @commitlint/cli \
  @commitlint/config-conventional

cat > commitlint.config.js << 'EOF'
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type must be one of the following
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'ci', 'build']
    ],
    'type-case':    [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty':[2, 'never'],
    'body-max-line-length': [1, 'always', 100]
  }
};
EOF
success "Commitlint configured → commitlint.config.js"

# ─── 6. Wire up Husky hooks ──────────────────────────────────────────────────
info "Writing Husky git hooks..."

# pre-commit → lint-staged + tsc
cat > .husky/pre-commit << 'HOOK'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running lint-staged..."
npx lint-staged

echo "🔷 Type-checking..."
npx tsc --noEmit
HOOK
chmod +x .husky/pre-commit

# commit-msg → commitlint
cat > .husky/commit-msg << 'HOOK'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
HOOK
chmod +x .husky/commit-msg

# pre-push → full test suite
cat > .husky/pre-push << 'HOOK'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running tests before push..."
npm test -- --passWithNoTests --watchAll=false
HOOK
chmod +x .husky/pre-push

success "Git hooks written → .husky/pre-commit | commit-msg | pre-push"

# ─── 7. Testing (Jest + React Testing Library) ───────────────────────────────
info "Installing Jest + React Testing Library..."
run_install \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/jest \
  ts-jest \
  babel-jest \
  @babel/preset-env \
  @babel/preset-react \
  @babel/preset-typescript

# Only write jest.config if one doesn't exist
if [ ! -f jest.config.ts ] && [ ! -f jest.config.js ]; then
cat > jest.config.ts << 'EOF'
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testPathPattern: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThresholds: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  }
};

export default config;
EOF

cat > jest.setup.ts << 'EOF'
import '@testing-library/jest-dom';
EOF

  success "Jest configured → jest.config.ts + jest.setup.ts"
else
  warn "jest.config already exists — skipping (add setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'] manually)"
fi

run_install identity-obj-proxy

# ─── 8. package.json scripts ─────────────────────────────────────────────────
info "Patching package.json scripts..."

# Use node to safely merge scripts without overwriting existing ones
node << 'JS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  "lint":         "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings=10",
  "lint:fix":     "eslint . --ext .ts,.tsx,.js,.jsx --fix",
  "format":       "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck":    "tsc --noEmit",
  "test":         "jest",
  "test:watch":   "jest --watch",
  "test:coverage":"jest --coverage",
  "validate":     "npm run typecheck && npm run lint && npm run format:check && npm run test -- --passWithNoTests --watchAll=false",
  "prepare":      "husky"
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
JS

success "package.json scripts updated"

# ─── 9. .editorconfig ────────────────────────────────────────────────────────
if [ ! -f .editorconfig ]; then
cat > .editorconfig << 'EOF'
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
EOF
  success ".editorconfig created"
fi

# ─── 10. VS Code settings ────────────────────────────────────────────────────
mkdir -p .vscode
if [ ! -f .vscode/settings.json ]; then
cat > .vscode/settings.json << 'EOF'
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
EOF
  success ".vscode/settings.json created"
fi

if [ ! -f .vscode/extensions.json ]; then
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "streetsidesoftware.code-spell-checker"
  ]
}
EOF
  success ".vscode/extensions.json created"
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  ✅  Dev workflow setup complete!${RESET}"
echo -e "${GREEN}════════════════════════════════════════════════${RESET}"
echo ""
echo "  Hooks active:"
echo "    pre-commit  → lint-staged (ESLint + Prettier on staged files) + tsc"
echo "    commit-msg  → Commitlint (Conventional Commits enforced)"
echo "    pre-push    → Jest test suite"
echo ""
echo "  Key scripts:"
echo "    npm run validate     ← full CI-equivalent local check"
echo "    npm run lint:fix     ← auto-fix lint errors"
echo "    npm run format       ← format entire project"
echo "    npm run test:coverage"
echo ""
echo "  Commit format required:"
echo "    feat: add user auth"
echo "    fix: resolve hydration mismatch"
echo "    chore: update deps"
echo "    docs: update README"
echo ""