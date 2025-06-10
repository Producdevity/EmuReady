import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  {
    ignores: [
      // Next.js build output and cache
      '.next/',
      'out/',

      // Node modules
      'node_modules/',

      // Build and distribution directories
      'dist/',
      'build/',

      // Prisma generated client code
      'prisma/generated/**',

      // Test coverage reports

      // Test output/coverage directories
      'coverage/',
      'test-results/',
      'tests/.auth',
      'playwright-report/',
      'blob-report/',

      // IDE and editor directories
      '.claude/',
      '.cursor/',
      '.vscode/',
      '.idea/',

      // Vercel deployment files
      '.vercel/',

      // Log files
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.pnpm-debug.log*',

      // OS generated files
      '.DS_Store',
      '*.pem',

      // TypeScript build info
      '*.tsbuildinfo',
      'next-env.d.ts',
    ],
  },

  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      'prefer-template': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
    },
  }),

  // Test files specific configuration
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig
