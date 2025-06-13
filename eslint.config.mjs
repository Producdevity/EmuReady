import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import importPlugin from 'eslint-plugin-import'
import nextPlugin from '@next/eslint-plugin-next'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      // Config files
      'eslint.config.mjs',
      'next.config.ts',

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

  // JavaScript base configuration
  js.configs.recommended,

  // Legacy Next.js configuration for compatibility with detection
  ...compat.extends('next/core-web-vitals'),

  // Browser environment configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLLIElement: 'readonly',
        HTMLUListElement: 'readonly',
        SVGSVGElement: 'readonly',
        Node: 'readonly',
        EventSource: 'readonly',
        Notification: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        TextEncoder: 'readonly',
        ReadableStream: 'readonly',
        ReadableStreamDefaultController: 'readonly',
        Response: 'readonly',
        React: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
    },
  },

  // Next.js configuration (additional)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Custom rules for the project
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'prefer-template': 'error',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-redeclare': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Import plugin configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['eslint.config.mjs', 'next.config.ts'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // Import order and sorting - libraries first, then local files
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // External packages from node_modules
            'internal', // Internal modules (your own modules)
            ['parent', 'sibling'], // Relative imports from parent/sibling directories
            'index', // Index imports
            'type', // TypeScript type imports
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '~/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: './**.module.css',
              group: 'sibling',
              position: 'after',
            },
            {
              pattern: './**.css',
              group: 'sibling',
              position: 'after',
            },
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

      // Additional import rules for clean code
      'import/first': 'error',
      'import/newline-after-import': 'off',
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
  },

  // UI components - allow circular dependencies for component index files
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'import/no-cycle': 'off', // UI components often have legitimate circular dependencies
    },
  },

  // Test files specific configuration
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-cycle': 'off', // Tests don't need strict dependency checking
    },
  },
]
