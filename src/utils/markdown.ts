import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

// Configure markdown-it with safe settings
const md = new MarkdownIt({
  html: false, // Disable raw HTML
  xhtmlOut: true, // Use XHTML-style tags
  breaks: true, // Convert line breaks to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: false, // Disable smart quotes for security
})

//  DOMPurify with safe settings for markdown
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'strike',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const ALLOWED_ATTR = [
  'href',
  'title',
  'alt',
  'src',
  'class', // For code highlighting
]

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

/**
 * Simple sanitization for server-side or when DOMPurify is not available
 * @param html - The HTML string to sanitize
 * @returns The sanitized HTML string
 */
function basicSanitize(html: string): string {
  // TODO: there must be a better way to do this
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript
    .replace(/vbscript:/gi, '') // Remove vbscript
    .replace(/data:(?!image\/)/gi, '') // Remove data URLs
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '') // Remove event handlers
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove all HTML tags
}

// DOMPurify for client-side usage only
const isClient = typeof window !== 'undefined'

// needs to work in both environments
let purify:
  | typeof DOMPurify
  | { sanitize: (html: string, options?: unknown) => string }

if (isClient) {
  // Client-side - use standard DOMPurify
  purify = DOMPurify
} else {
  // Server-side - use basic sanitization for now since JSDOM is being a little whiny bitch
  // TODO: Fix this
  purify = {
    sanitize: (html: string) => basicSanitize(html),
  }
}

// Security patterns to detect potentially dangerous content
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /data:(?!image\/)/gi,
  /vbscript:/gi,
  /<script\b/gi,
  /on\w+\s*=/gi,
]

/**
 * Parse Markdown text to HTML with security sanitization
 * @param markdownText - The Markdown text to parse
 * @returns Sanitized HTML string
 */
export function parseMarkdown(markdownText: string): string {
  if (!markdownText) return ''

  try {
    // Check for dangerous patterns first
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(markdownText)) {
        // Return plain text if dangerous content is detected
        return basicSanitize(markdownText)
      }
    }

    // Parse markdown to HTML
    const html = md.render(markdownText)

    // Sanitize the HTML using DOMPurify or basic sanitization
    return isClient
      ? purify.sanitize(html, PURIFY_CONFIG)
      : purify.sanitize(html)
  } catch (error) {
    console.warn('Markdown parsing failed:', error)
    // Return escaped plain text as fallback
    return isClient
      ? purify.sanitize(markdownText, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : purify.sanitize(markdownText)
  }
}

/**
 * Check if text contains Markdown syntax
 * @param text - Text to check
 * @returns true if text appears to contain markdown
 */
export function hasMarkdownSyntax(text: string): boolean {
  if (!text) return false

  // Common markdown patterns
  const markdownPatterns = [
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Inline code
    /^#{1,6}\s/, // Headers
    /^\s*[\-*+]\s/, // Lists
    /^\s*\d+\.\s/, // Numbered lists
    /\[.*?\]\(.*?\)/, // Links
    /^>\s/, // Blockquotes
    /```[\s\S]*?```/, // Code blocks
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}

/**
 * Strip Markdown syntax and return plain text
 * @param markdownText - Markdown text
 * @returns Plain text without Markdown syntax
 */
export function stripMarkdown(markdownText: string): string {
  if (!markdownText) return ''

  try {
    // Parse to HTML then strip all tags to get plain text
    const html = md.render(markdownText)
    const textOnly = isClient
      ? purify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : purify.sanitize(html)

    // Clean up extra whitespace
    return textOnly.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.warn('Stripping markdown failed:', error)
    return markdownText
  }
}

/**
 * Validate markdown content for security
 * @param markdownText - Markdown text to validate
 * @returns Object with validation result and cleaned text
 */
export function validateMarkdown(markdownText: string): {
  isValid: boolean
  cleanText: string
  errors: string[]
} {
  const errors: string[] = []

  if (!markdownText) {
    return { isValid: true, cleanText: '', errors: [] }
  }

  // Check for potentially dangerous content
  const dangerousPatterns = [
    /javascript:/i,
    /data:.*base64/i,
    /vbscript:/i,
    /<script/i,
    /onload=/i,
    /onerror=/i,
  ]

  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(markdownText)) {
      errors.push('Potentially dangerous content detected')
    }
  })

  try {
    const cleanText = parseMarkdown(markdownText)
    return {
      isValid: errors.length === 0,
      cleanText,
      errors,
    }
  } catch (error) {
    console.warn('Markdown validation failed:', error)
    errors.push('Invalid markdown syntax')
    return {
      isValid: false,
      cleanText: markdownText,
      errors,
    }
  }
}
