import path from 'path'

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`

/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  'package.json': () => [
    'node scripts/sync-version.js',
    'git add public/service-worker.js public/sw-register.js',
  ],
  '*.{json,css,md,js,jsx,ts,tsx}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
}

export default lintStagedConfig
