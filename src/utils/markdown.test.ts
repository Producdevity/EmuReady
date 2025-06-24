import { describe, it, expect } from 'vitest'
import {
  parseMarkdown,
  hasMarkdownSyntax,
  stripMarkdown,
  validateMarkdown,
} from './markdown'

describe('markdown utilities', () => {
  describe('parseMarkdown', () => {
    it('should parse basic markdown', () => {
      const input = '**bold** and *italic*'
      const output = parseMarkdown(input)
      expect(output).toContain('<strong>bold</strong>')
      expect(output).toContain('<em>italic</em>')
    })

    it('should handle code blocks', () => {
      const input = '`inline code` and\n```\ncode block\n```'
      const output = parseMarkdown(input)
      expect(output).toContain('<code>inline code</code>')
      expect(output).toContain('<pre><code>code block')
      expect(output).toContain('</code></pre>')
    })

    it('should handle links', () => {
      const input = '[Google](https://google.com)'
      const output = parseMarkdown(input)
      expect(output).toContain('<a href="https://google.com">Google</a>')
    })

    it('should handle lists', () => {
      const input = '- Item 1\n- Item 2'
      const output = parseMarkdown(input)
      expect(output).toContain('<ul>')
      expect(output).toContain('<li>Item 1</li>')
    })

    it('should sanitize dangerous HTML', () => {
      const input = '<script>alert("xss")</script>'
      const output = parseMarkdown(input)
      expect(output).not.toContain('<script>')
      expect(output).not.toContain('alert("xss")')
    })

    it('should remove event handlers', () => {
      const input = '[Click me](javascript:alert("xss"))'
      const output = parseMarkdown(input)
      expect(output).not.toContain('javascript:')
    })

    it('should handle empty input', () => {
      expect(parseMarkdown('')).toBe('')
      expect(parseMarkdown(null as any)).toBe('')
      expect(parseMarkdown(undefined as any)).toBe('')
    })

    it('should handle non-string input gracefully', () => {
      expect(parseMarkdown(123 as any)).toBe('')
      expect(parseMarkdown({} as any)).toBe('')
    })
  })

  describe('hasMarkdownSyntax', () => {
    it('should detect bold markdown', () => {
      expect(hasMarkdownSyntax('**bold text**')).toBe(true)
    })

    it('should detect italic markdown', () => {
      expect(hasMarkdownSyntax('*italic text*')).toBe(true)
    })

    it('should detect code markdown', () => {
      expect(hasMarkdownSyntax('`code`')).toBe(true)
    })

    it('should detect headers', () => {
      expect(hasMarkdownSyntax('# Header')).toBe(true)
      expect(hasMarkdownSyntax('## Header 2')).toBe(true)
    })

    it('should detect lists', () => {
      expect(hasMarkdownSyntax('- List item')).toBe(true)
      expect(hasMarkdownSyntax('* List item')).toBe(true)
      expect(hasMarkdownSyntax('1. Numbered item')).toBe(true)
    })

    it('should detect links', () => {
      expect(hasMarkdownSyntax('[link](url)')).toBe(true)
    })

    it('should detect blockquotes', () => {
      expect(hasMarkdownSyntax('> Quote')).toBe(true)
    })

    it('should detect code blocks', () => {
      expect(hasMarkdownSyntax('```code```')).toBe(true)
    })

    it('should not detect plain text', () => {
      expect(hasMarkdownSyntax('just plain text')).toBe(false)
      expect(hasMarkdownSyntax('some text with numbers 123')).toBe(false)
      expect(hasMarkdownSyntax('')).toBe(false)
    })
  })

  describe('stripMarkdown', () => {
    it('should strip markdown syntax', () => {
      const input = '**bold** and *italic* text'
      const output = stripMarkdown(input)
      expect(output).toBe('bold and italic text')
    })

    it('should strip links but keep text', () => {
      const input = '[Google](https://google.com)'
      const output = stripMarkdown(input)
      expect(output).toBe('Google')
    })

    it('should strip headers', () => {
      const input = '# Big Header'
      const output = stripMarkdown(input)
      expect(output).toBe('Big Header')
    })

    it('should strip code blocks', () => {
      const input = '```javascript\nconsole.log("hello")\n```'
      const output = stripMarkdown(input)
      expect(output).toBe('console.log("hello")')
    })

    it('should handle empty input', () => {
      expect(stripMarkdown('')).toBe('')
    })

    it('should normalize whitespace', () => {
      const input = '**bold**\n\n*italic*'
      const output = stripMarkdown(input)
      expect(output).toBe('bold italic')
    })
  })

  describe('validateMarkdown', () => {
    it('should validate safe markdown', () => {
      const input = '**bold** text with [link](https://example.com)'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(true)
      expect(result.cleanText).toContain('<strong>bold</strong>')
      expect(result.errors).toHaveLength(0)
    })

    it('should detect dangerous JavaScript URLs', () => {
      const input = '[Click me](javascript:alert("xss"))'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potentially dangerous content detected')
    })

    it('should detect dangerous data URLs', () => {
      const input = '[Click me](data:text/html,<script>alert("xss")</script>)'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potentially dangerous content detected')
    })

    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potentially dangerous content detected')
    })

    it('should detect event handlers', () => {
      const input = 'Text with onload=alert("xss")'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potentially dangerous content detected')
    })

    it('should handle empty input', () => {
      const result = validateMarkdown('')
      expect(result.isValid).toBe(true)
      expect(result.cleanText).toBe('')
      expect(result.errors).toHaveLength(0)
    })

    it('should clean dangerous content even when invalid', () => {
      const input = '<script>alert("xss")</script>Safe text'
      const result = validateMarkdown(input)
      expect(result.isValid).toBe(false)
      expect(result.cleanText).not.toContain('<script>')
      expect(result.cleanText).toContain('Safe text')
    })

    it('should handle complex safe markdown', () => {
      const input = `
# Header
**Bold** and *italic* text.

- List item 1
- List item 2

\`code\` and [link](https://example.com)

> Blockquote
      `.trim()

      const result = validateMarkdown(input)
      expect(result.isValid).toBe(true)
      expect(result.cleanText).toContain('<h1>Header</h1>')
      expect(result.cleanText).toContain('<strong>Bold</strong>')
      expect(result.cleanText).toContain('<ul>')
      expect(result.cleanText).toContain('<code>code</code>')
      expect(result.cleanText).toContain('<blockquote>')
    })
  })

  describe('XSS protection', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      '<iframe src="javascript:alert(\'xss\')"></iframe>',
      '<svg onload="alert(\'xss\')">',
      'vbscript:alert("xss")',
      '<object data="javascript:alert(\'xss\')"></object>',
      '<embed src="javascript:alert(\'xss\')">',
    ]

    xssPayloads.forEach((payload) => {
      it(`should sanitize XSS payload: ${payload}`, () => {
        const result = parseMarkdown(payload)

        // Check that script tags are completely removed (most dangerous)
        if (payload.includes('<script>')) {
          expect(result).not.toContain('<script>')
          expect(result).not.toContain('alert')
        }

        // For other payloads, ensure they're either escaped or attributes removed
        // The key is that dangerous executable content is neutralized
        if (
          payload.includes('javascript:') &&
          !result.includes('&lt;') &&
          !result.includes('&gt;')
        ) {
          // Only check for javascript: removal if content isn't HTML-escaped
          expect(result).not.toContain('javascript:')
        }
        if (
          payload.includes('vbscript:') &&
          !result.includes('&lt;') &&
          !result.includes('&gt;')
        ) {
          // Only check for vbscript: removal if content isn't HTML-escaped
          expect(result).not.toContain('vbscript:')
        }
        if (
          payload.includes('onerror=') &&
          !result.includes('&lt;') &&
          !result.includes('&gt;')
        ) {
          // Only check for onerror removal if content isn't HTML-escaped
          expect(result).not.toContain('onerror=')
        }
        if (
          payload.includes('onload=') &&
          !result.includes('&lt;') &&
          !result.includes('&gt;')
        ) {
          // Only check for onload removal if content isn't HTML-escaped
          expect(result).not.toContain('onload=')
        }

        // Ensure dangerous attributes are neutralized
        // DOMPurify may allow some tags but strips dangerous attributes
        if (payload.includes('javascript:') && result.includes('<iframe')) {
          // iframe with javascript: should have the dangerous protocol removed
          expect(result).not.toMatch(/src\s*=\s*["']?javascript:/i)
        }
        if (payload.includes('javascript:') && result.includes('<object')) {
          // object with javascript: should have the dangerous protocol removed
          expect(result).not.toMatch(/data\s*=\s*["']?javascript:/i)
        }
      })
    })
  })
})
