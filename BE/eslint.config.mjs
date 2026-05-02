import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Files and directories to exclude from linting
  {
    ignores: [
      'eslint.config.mjs',
      'src/migrations/**'
    ],
  },

  // ESLint core recommended rules (no-unused-vars, no-undef, etc.)
  eslint.configs.recommended,

  // TypeScript ESLint recommended rules with type-checking enabled
  ...tseslint.configs.recommendedTypeChecked,

  // Language and parser configuration
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom rules
  {
    rules: {
      // Disallow spaces inside curly braces: {x} instead of { x }
      'object-curly-spacing': ['error', 'never'],

      // Require const instead of let when variable is never reassigned
      'prefer-const': 'error',

      // Warn when console.log/warn/error calls are left in code
      'no-console': 'warn',

      // Disallow debugger statements in production code
      'no-debugger': 'error',

      // Enforce single quotes for strings
      'quotes': ['error', 'single'],

      // Disallow explicit `any` type — every value must be properly typed
      '@typescript-eslint/no-explicit-any': 'error',

      // Warn when a Promise is not awaited or handled — prevents silent failures
      '@typescript-eslint/no-floating-promises': 'warn',

      // Warn when a value of type `any` is passed as a function argument
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Allow calling values typed as `any` — too strict for NestJS decorator patterns
      '@typescript-eslint/no-unsafe-call': 'off',

      // Enforce explicit return types on all functions and methods
      // Helps catch missing return type annotations like in setNewPassword()
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
    },
  },
);
