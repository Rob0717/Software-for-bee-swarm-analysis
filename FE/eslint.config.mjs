import globals from 'globals';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import jsdoc from 'eslint-plugin-jsdoc';
import importPlugin from 'eslint-plugin-import';
import angularTemplateParser from '@angular-eslint/template-parser';

export default [
  // Files and directories to exclude from linting
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'karma.conf.js',
      'src/api-types.ts'
    ]
  },

  // Apply TypeScript ESLint recommended rules to all TS files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['src/**/*.ts']
  })),

  // Apply TypeScript ESLint stylistic rules (consistent code style)
  ...tseslint.configs.stylistic.map(config => ({
    ...config,
    files: ['src/**/*.ts']
  })),

  // TypeScript-specific rules
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      jsdoc,
      import: importPlugin,
    },
    rules: {
      // Enforce single quotes for strings
      'quotes': ['error', 'single', {'avoidEscape': true}],

      // Disallow spaces inside curly braces: {x} instead of { x }
      'object-curly-spacing': ['error', 'never'],

      // Require const instead of let when variable is never reassigned
      'prefer-const': 'error',

      // Warn when console.log/warn/error calls are left in code
      'no-console': 'warn',

      // Disallow debugger statements in production code
      'no-debugger': 'error',

      // Error on variables that are declared but never used
      '@typescript-eslint/no-unused-vars': ['error'],

      // Warn when explicit `any` type is used — prefer proper typing
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow explicit type annotations like `x: string = 'hello'` (too strict otherwise)
      '@typescript-eslint/no-inferrable-types': 'off',

      // Enforce `type` keyword for type definitions instead of `interface`
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Enforce consistent import order: builtin → external → internal (@app, @shared)
      // Note: import/no-unresolved is disabled because path aliases (@app, @shared)
      // require eslint-import-resolver-typescript for correct resolution
      'import/no-unresolved': 'off',
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [
          {pattern: '@app/**', group: 'internal'},
          {pattern: '@shared/**', group: 'internal'}
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {order: 'asc', caseInsensitive: true}
      }],

      // Enforce explicit return types on all functions and methods
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],

      // Warn on invalid JSDoc tag names (e.g. @param, @returns)
      'jsdoc/check-tag-names': 'warn',

      // JSDoc is encouraged but not enforced — warn only if present but malformed
      'jsdoc/require-jsdoc': ['warn', {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: false
        }
      }],
    }
  },

  // Angular-specific TypeScript rules
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@angular-eslint': angular
    },
    rules: {
      // Enforce directive selectors to use camelCase attribute style with 'app' prefix
      '@angular-eslint/directive-selector': [
        'error',
        {type: 'attribute', prefix: 'app', style: 'camelCase'}
      ],

      // Enforce component selectors to use kebab-case element style with 'app' prefix
      '@angular-eslint/component-selector': [
        'error',
        {type: 'element', prefix: 'app', style: 'kebab-case'}
      ],

      // Disallow empty lifecycle methods (e.g. ngOnInit() {})
      '@angular-eslint/no-empty-lifecycle-method': 'error',

      // Enforce that lifecycle interfaces are explicitly implemented (implements OnInit, etc.)
      '@angular-eslint/use-lifecycle-interface': 'error',

      // Enforce that pipes implement the PipeTransform interface
      '@angular-eslint/use-pipe-transform-interface': 'error'
    }
  },

  // Angular HTML template rules
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
      parserOptions: {
        ecmaVersion: 2022
      }
    },
    plugins: {
      '@angular-eslint/template': angularTemplate
    },
    rules: {
      // Disallow incorrect banana-in-a-box syntax: [(x)] instead of ([x])
      '@angular-eslint/template/banana-in-box': 'error',

      // Disallow negated async pipe usage (e.g. *ngIf="!(obs$ | async)")
      '@angular-eslint/template/no-negated-async': 'error',

      // Limit complexity of conditional expressions in templates
      '@angular-eslint/template/conditional-complexity': ['error', {maxComplexity: 3}]
    }
  }
];
