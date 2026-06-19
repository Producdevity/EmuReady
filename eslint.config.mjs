import { existsSync, readdirSync } from 'node:fs'

import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const featureNames = existsSync('./src/features')
  ? readdirSync('./src/features', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : []

const featureScopeNames = new Set(['client', 'components', 'hooks', 'server', 'shared', 'utils'])

function hasFeatureScopeDirectory(featurePath) {
  if (!existsSync(featurePath)) return false

  return readdirSync(featurePath, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && featureScopeNames.has(entry.name),
  )
}

const featureModuleNames = featureNames.flatMap((featureName) => {
  const featurePath = `./src/features/${featureName}`
  if (!existsSync(featurePath)) return []

  return readdirSync(featurePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !featureScopeNames.has(entry.name))
    .map((entry) => `${featureName}/${entry.name}`)
})

const topLevelFeatureLayerRootNames = featureNames.filter((featureName) =>
  hasFeatureScopeDirectory(`./src/features/${featureName}`),
)

const featureLayerRootNames = [...topLevelFeatureLayerRootNames, ...featureModuleNames]

const topLevelFeatureBoundaryZones = featureNames.map((featureName) => ({
  target: `./src/features/${featureName}`,
  from: './src/features',
  except: [`./${featureName}`],
  message: 'Features must not import from other features. Compose features at the route layer.',
}))

const nestedFeatureBoundaryZones = featureModuleNames.map((featureModuleName) => {
  const [domainName, moduleName] = featureModuleName.split('/')

  return {
    target: `./src/features/${featureModuleName}`,
    from: `./src/features/${domainName}`,
    except: [`./${moduleName}`, './shared'],
    message:
      'Feature modules must not import from sibling modules. Extract shared domain code or compose modules at the route layer.',
  }
})

const featureLayerBoundaryZones = featureLayerRootNames.flatMap((featureRootName) => [
  {
    target: `./src/features/${featureRootName}/shared`,
    from: `./src/features/${featureRootName}`,
    except: ['./shared'],
    message: 'Feature shared code must not import from client, server, or workflow layers.',
  },
  {
    target: `./src/features/${featureRootName}/client`,
    from: `./src/features/${featureRootName}/server`,
    message: 'Feature client code must not import server code.',
  },
  {
    target: `./src/features/${featureRootName}/client`,
    from: './src/server',
    message: 'Feature client code must not import app-wide server code.',
  },
  {
    target: `./src/features/${featureRootName}/server`,
    from: `./src/features/${featureRootName}/client`,
    message: 'Feature server code must not import client code.',
  },
  {
    target: `./src/features/${featureRootName}/shared`,
    from: './src/server',
    message: 'Feature shared code must stay client-safe and must not import server utilities.',
  },
])

const featureToAppRouteBoundaryZone = {
  target: './src/features',
  from: './src/app',
  message: 'Feature modules must not import from Next.js app routes. Compose features in app routes.',
}

const featureBoundaryZones = [
  ...topLevelFeatureBoundaryZones,
  ...nestedFeatureBoundaryZones,
  ...featureLayerBoundaryZones,
  featureToAppRouteBoundaryZone,
]

const eslintConfig = [
  {
    ignores: [
      '*.log',
      '*.tsbuildinfo',
      '.clerk/**',
      '.husky/**',
      '.idea/**',
      '.next/**',
      '.vercel/',
      'build/**',
      'coverage/**',
      'dist/**',
      'next-env.d.ts',
      'node_modules/**',
      'notes/**',
      'out/**',
      'prisma/generated/**',
      'public/**',
      'test-results/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
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
      // TODO: set to error after fixing existing React Compiler rule violations.
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
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
      'import/internal-regex': '^(@/|~/|@orm(?:/.*)?$)',
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
            { pattern: '@orm', group: 'internal', position: 'after' },
            { pattern: '@orm/**', group: 'internal', position: 'after' },
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
      'import/no-restricted-paths': ['error', { zones: featureBoundaryZones }],
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
