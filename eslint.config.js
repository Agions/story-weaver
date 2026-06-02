import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import importFlatRecommended from 'eslint-plugin-import/config/flat/recommended.js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'src-tauri/**',
      'docs/**',
      '.github/**',
      'scripts/**',
      'src/__tests__/__mocks__/**',
      'src/__mocks__/**',
      'packages/**',
    ],
  },

  // Base recommended rules from ESLint
  eslint.configs.recommended,

  // TypeScript ESLint base recommended (no type checking — used for test files)
  ...tseslint.configs['flat/recommended'],

  // React recommended (flat)
  { ...reactPlugin.configs.flat.recommended },

  // React Hooks recommended (flat)
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    ...reactHooksPlugin.configs.flat['recommended-latest'],
    rules: {
      ...reactHooksPlugin.configs.flat['recommended-latest'].rules,
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/void-use-memo': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/gating': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/unsupported-syntax': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },

  // JSX A11y recommended (flat format)
  { ...jsxA11y.flatConfigs.recommended },

  // Import plugin flat config with TypeScript resolver
  {
    plugins: { import: importPlugin },
    ...importFlatRecommended,
    settings: {
      react: { version: '18.2' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...importFlatRecommended.rules,
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Disable formatting rules that conflict with Prettier
  prettier,

  // Project-specific type-aware rules (requires tsconfig project)
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['src/__tests__/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    rules: {
      ...tseslint.configs['flat/recommended-type-checked'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-restricted-types': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'react/display-name': 'off',
      'prefer-const': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },

  // Test file overrides — no type checking (tsconfig excludes __tests__)
  {
    files: ['src/__tests__/**', 'e2e/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: null,
      },
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
        Mock: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
      'prefer-const': 'off',
      'no-undef': 'off',
    },
  },
];
