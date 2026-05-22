import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: [
      '*.log',
      '*.tsbuildinfo',
      '.claude/**',
      '.clerk/**',
      '.husky/**',
      '.idea/**',
      '.next/**',
      '.vercel/',
      'build/**',
      'coverage/**',
      'dist/**',
      'next-env.d.ts',
      'next-env.d.ts',
      'node_modules/**',
      'notes/**',
      'notes/**',
      'out/**',
      'prisma/generated/**',
      'public/**',
      'test-results/**',
    ],
  },
  ...nextCoreWebVitals,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      'prefer-template': 'error',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-redeclare': 'off',
      // Next 16's flat config enables React Compiler rollout checks. Keep this upgrade
      // focused on framework/caching behavior; enable these after fixing existing violations.
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  }, // Import plugin
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'type'],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: '~/**', group: 'internal', position: 'before' },
            { pattern: './**.module.css', group: 'sibling', position: 'after' },
            { pattern: './**.css', group: 'sibling', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          distinctGroup: false,
        },
      ],
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
    },
  }, // UI component import cycle override
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'import/no-cycle': 'off',
    },
  }, // Test file rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json', './tests/tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-cycle': 'off',
    },
  },
]

export default eslintConfig
