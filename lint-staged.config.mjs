/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{json,css,md,js,jsx,ts,tsx}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
}
