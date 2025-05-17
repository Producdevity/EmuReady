/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{md,js,jsx,ts,tsx}': [
    'prettier --write',
    'eslint --fix',
    () => 'git add',
  ],
}
