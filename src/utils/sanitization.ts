// Simple sanitization utility to prevent XSS attacks
export function sanitizeText(text: string): string {
  if (!text) return text

  // Remove script tags and their content
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove HTML tags except allowed ones (basic formatting)
  const allowedTags = /^(b|i|em|strong|br|p)$/i
  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    return allowedTags.test(tag) ? match : ''
  })

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  return sanitized.trim()
}

/**
 * Sanitize user bio to remove HTML tags and unsafe content.
 * @param bio - The user bio string to sanitize.
 */
export function sanitizeBio(bio: string): string {
  return bio
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript URLs
    .replace(/data:/gi, '') // Remove data URLs
    .trim()
}
