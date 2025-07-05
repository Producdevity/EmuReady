/**
 * Pluralizes a word based on the count.
 * We will use this temporarily until we implement a full i18n solution.
 * @param word
 * @param count
 */
export function formatCountLabel(word: string, count: number) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
