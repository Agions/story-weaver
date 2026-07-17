import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import importFlatRecommended from 'eslint-plugin-import/config/flat/recommended.js';
import unicornPlugin from 'eslint-plugin-unicorn';
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
      'vite.config.ts',
      'tailwind.config.ts',
      'jest.config.js',
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
      react: { version: '19.0' },
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

  // ===== 命名规范规则（C1/C3） =====
  // unicorn/filename-case: .ts → kebab-case, .tsx → PascalCase（index.ts 豁免）
  {
    plugins: { unicorn: unicornPlugin },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: [{ extensions: ['tsx'], pattern: '^index$' }],
        },
      ],
    },
  },

  // @typescript-eslint/naming-convention: 通用规则（所有文件）
  // - 类/接口/类型别名/枚举 → PascalCase
  // - 枚举成员 → UPPER_CASE
  // - 类私有成员 → camelCase（允许 _ 前缀）
  // - 函数 → camelCase（允许 _ 前缀，用于测试辅助函数）
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
    ignores: ['src/__tests__/**', 'src/**/__tests__/**'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        { selector: 'memberLike', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
    },
  },

  // .ts 文件：变量 → camelCase 或 UPPER_CASE（模块级常量）；静态只读属性 → UPPER_CASE
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    ignores: ['src/__tests__/**', 'src/**/__tests__/**'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'property', modifiers: ['static', 'readonly'], format: ['UPPER_CASE'] },
      ],
    },
  },

  // .tsx 文件：变量允许 PascalCase（React 组件）、camelCase、UPPER_CASE（模块常量）
  {
    files: ['src/**/*.tsx', 'scripts/**/*.tsx'],
    ignores: ['src/__tests__/**', 'src/**/__tests__/**'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['PascalCase', 'camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
      ],
    },
  },
  // ===== 命名规范规则结束 =====

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

  // ===== 架构分层强制：依赖方向规则 =====
  // shared 业务组件：允许依赖 core 数据（MODEL_PROVIDERS, services 等），但禁止 app/pages
  {
    files: ['src/shared/components/business/**/*.ts', 'src/shared/components/business/**/*.tsx'],
    ignores: ['src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/app/*', '@/pages/*'],
              message: 'shared 业务组件不允许导入 app/pages 模块。',
            },
          ],
        },
      ],
    },
  },

  // shared stores / utils：不允许导入 core/features/app/pages（business 组件除外）
  {
    files: ['src/shared/**/*.ts', 'src/shared/**/*.tsx'],
    ignores: ['src/__tests__/**', 'src/shared/components/business/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/core/*', '@/features/*', '@/app/*', '@/pages/*', '@/infrastructure/*'],
              message: 'shared 层不允许导入 core/features/app/pages/infrastructure 模块。shared 应仅依赖外部库和自身内部模块。',
            },
          ],
        },
      ],
    },
  },

  // core 层：不允许导入 features / app / pages（可导入 shared）
  {
    files: ['src/core/**/*.ts', 'src/core/**/*.tsx'],
    ignores: ['src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*', '@/pages/*'],
              message: 'core 层不允许导入 features/app/pages 模块。方向：features → core，不可反向。',
            },
          ],
        },
      ],
    },
  },

  // features 层：不允许导入 app / pages（可导入 core 和 shared）
  {
    files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
    ignores: ['src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/app/*', '@/pages/*'],
              message: 'features 层不允许导入 app/pages 模块。方向：pages → features，不可反向。',
            },
          ],
        },
      ],
    },
  },

  // ===== 架构分层强制结束 =====

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
