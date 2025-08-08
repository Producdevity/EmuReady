// Centralized image validation utilities
// Consolidates validation logic from rawg-utils, tgdb-utils, AdminImageSelectorSwitcher, and schemas

// Image extension constants - shared across the application
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number]

// Regex patterns for validation
export const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i
export const IMAGE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|gif|webp)$/i

/**
 * Validates if a URL is a valid image URL
 * Checks protocol (http/https) and file extension
 */
export function isValidImageUrl(url: string, requireHttps = false): boolean {
  try {
    const urlObj = new URL(url)
    const allowedProtocols = requireHttps ? ['https:'] : ['http:', 'https:']

    return allowedProtocols.includes(urlObj.protocol) && IMAGE_EXTENSION_REGEX.test(urlObj.pathname)
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

    if (!IMAGE_EXTENSION_REGEX.test(urlObj.pathname)) {
      return `Image URL must end with a valid extension: ${IMAGE_EXTENSIONS.join(', ')}`
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
