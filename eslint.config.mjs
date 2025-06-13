import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import nextPlugin from '@next/eslint-plugin-next'
import typescriptEslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
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
      'prisma/generated/',

      // Test coverage
      'coverage/',

      // Environment files
      '.env*',

      // IDE files
      '.vscode/',
      '.idea/',

      // OS files
      '.DS_Store',
      'Thumbs.db',

      // Temporary files
      '*.tmp',
      '*.temp',

      // Log files
      '*.log',
      'logs/',

      // Package manager files
      'yarn.lock',
      'package-lock.json',
      'pnpm-lock.yaml',
    ],
  },
  
  // Base recommended configs
  js.configs.recommended,
  
  // Next.js configuration using compatibility layer
  ...compat.extends('next/core-web-vitals'),

  // TypeScript configuration
  ...typescriptEslint.configs.recommended,

  // Custom configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        location: 'readonly',
        history: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        
        // HTML elements
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        
        // Events
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        CustomEvent: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        
        // Next.js globals
        NodeJS: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      },
    },
  },

  // Next.js plugin configuration with proper plugin naming
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

  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Additional rules
  {
    rules: {
      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Disable problematic rules
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
    },
  },

  // Linter options
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
]

