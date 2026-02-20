/**
 * Pluralizes a word based on the count.
 * We will use this temporarily until we implement a full i18n solution.
 * @param word
 * @param count
 */
export function formatCountLabel(word: string, count: number) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/**
 * Normalizes a string by removing accents and converting to lowercase.
 * Useful for accent-insensitive searching.
 *
 * @example
 * normalizeString("Astérix & Obélix") // "asterix & obelix"
 * normalizeString("Pokémon") // "pokemon"
 * normalizeString("CAFÉ") // "cafe"
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompose combined characters (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
}

/**
 * Normalizes an array of strings by removing accents and converting to lowercase.
 *
 * @example
 * normalizeStrings(["Astérix", "Obélix"]) // ["asterix", "obelix"]
 */
export function normalizeStrings(strings: string[]): string[] {
  return strings.map(normalizeString)
}

/**
 * Pretty formats a byte size into a human-readable string (e.g., "1.5 MB").
 * @param bytes
 */
export function bytesToHuman(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(1)} ${sizes[i]}`
}
