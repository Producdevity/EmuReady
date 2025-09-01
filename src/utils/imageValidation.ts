// Centralized image validation utilities
// Consolidates validation logic from rawg-utils, tgdb-utils, AdminImageSelectorSwitcher, and schemas

// Image extension constants - shared across the application
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number]

// Regex patterns for validation
export const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i
export const IMAGE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|gif|webp)$/i

// Known image CDN patterns that don't require file extensions
const KNOWN_IMAGE_CDN_PATTERNS = [
  /^https:\/\/images\.igdb\.com\//,
  /^https:\/\/assets\.nintendo\.com\//,
  /^https:\/\/cdn\.cloudflare\.steamstatic\.com\//,
  /^https:\/\/media\.rawg\.io\//,
  /^https:\/\/cdn\.thegamesdb\.net\//,
  /^https:\/\/images\.launchbox-app\.com\//,
  /^https:\/\/steamcdn-a\.akamaihd\.net\//,
  /^https:\/\/img\.youtube\.com\//,
  /^https:\/\/i\.imgur\.com\//,
]

/**
 * Validates if a URL is a valid image URL
 * Checks protocol (http/https) and either file extension or known CDN pattern
 */
export function isValidImageUrl(url: string, requireHttps = false): boolean {
  try {
    const urlObj = new URL(url)
    const allowedProtocols = requireHttps ? ['https:'] : ['http:', 'https:']

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false
    }

    // Check if URL has a valid image extension
    if (IMAGE_EXTENSION_REGEX.test(urlObj.pathname)) {
      return true
    }

    // Check if URL is from a known image CDN (these don't require extensions)
    if (KNOWN_IMAGE_CDN_PATTERNS.some((pattern) => pattern.test(url))) {
      return true
    }

    // Check if URL contains image-related paths or parameters
    const pathLower = urlObj.pathname.toLowerCase()
    const hasImagePath =
      pathLower.includes('/image/') ||
      pathLower.includes('/images/') ||
      pathLower.includes('/img/') ||
      pathLower.includes('/upload/') ||
      pathLower.includes('/media/')

    // Check for image format parameters in the URL
    const hasImageParams =
      url.includes('f_auto') ||
      url.includes('q_auto') ||
      url.includes('format=') ||
      url.includes('width=') ||
      url.includes('height=')

    return hasImagePath || hasImageParams
  } catch {
    return false
  }
}

/**
 * Validates if a filename is a valid image filename
 * Used for emulator logos and other filename-based validations
 */
export function isValidImageFilename(filename: string): boolean {
  return IMAGE_FILENAME_REGEX.test(filename)
}

/**
 * Gets the file extension from a URL or filename
 */
export function getImageExtension(urlOrFilename: string): ImageExtension | null {
  const match = urlOrFilename.match(IMAGE_EXTENSION_REGEX)
  return match ? (match[1].toLowerCase() as ImageExtension) : null
}

/**
 * Checks if a file extension is valid for images
 */
export function isValidImageExtension(extension: string): extension is ImageExtension {
  return IMAGE_EXTENSIONS.includes(extension.toLowerCase() as ImageExtension)
}

/**
 * Creates user-friendly error messages for image validation failures
 */
export function getImageValidationError(url: string, requireHttps = false): string {
  if (!url.trim()) {
    return 'Image URL is required'
  }

  try {
    const urlObj = new URL(url)

    if (requireHttps && urlObj.protocol !== 'https:') {
      return 'Image URL must use HTTPS protocol'
    }

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return 'Image URL must use HTTP or HTTPS protocol'
    }

    const hasValidExtension = IMAGE_EXTENSION_REGEX.test(urlObj.pathname)
    const isKnownCDN = KNOWN_IMAGE_CDN_PATTERNS.some((pattern) => pattern.test(url))
    const pathLower = urlObj.pathname.toLowerCase()
    const hasImagePath =
      pathLower.includes('/image/') ||
      pathLower.includes('/images/') ||
      pathLower.includes('/img/') ||
      pathLower.includes('/upload/') ||
      pathLower.includes('/media/')
    const hasImageParams =
      url.includes('f_auto') ||
      url.includes('q_auto') ||
      url.includes('format=') ||
      url.includes('width=') ||
      url.includes('height=')

    if (!hasValidExtension && !isKnownCDN && !hasImagePath && !hasImageParams) {
      return `Image URL must end with a valid extension (${IMAGE_EXTENSIONS.join(', ')}) or be from a recognized image service`
    }

    return '' // Valid
  } catch {
    return 'Please enter a valid URL'
  }
}

/**
 * Helper for common image URL validation with user-friendly messages
 */
export function validateImageUrl(
  url: string,
  requireHttps = false,
): {
  isValid: boolean
  error?: string
} {
  const isValid = isValidImageUrl(url, requireHttps)

  return isValid
    ? { isValid: true }
    : {
        isValid: false,
        error: getImageValidationError(url, requireHttps),
      }
}
