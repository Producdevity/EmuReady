import path from 'path'

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => path.relative(process.cwd(), f)).join(' ')}`

/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  'package.json': () => [
    'npm install',
    'node scripts/sync-version.js',
    'git add public/service-worker.js public/sw-register.js package-lock.json',
  ],
  '*.{json,css,md,js,jsx,ts,tsx}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
}

export default lintStagedConfig
