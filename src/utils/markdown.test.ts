import { describe, it, expect } from 'vitest'
import { hasMarkdownSyntax, parseMarkdown } from './markdown'

describe('Markdown Utils', () => {
  describe('hasMarkdownSyntax', () => {
    it('should detect bold syntax', () => {
      expect(hasMarkdownSyntax('This is **bold** text')).toBe(true)
    })

    it('should detect italic syntax', () => {
      expect(hasMarkdownSyntax('This is *italic* text')).toBe(true)
    })

    it('should detect numbered lists', () => {
      const text = `Some text before
1. First item
2. Second item
3. Third item`
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect numbered lists with the bug report example', () => {
      const text = `Portal is in Xbox input mode. Requires adjustments:
1. From GameNative settings, go to **Emulation > Box64 Preset**
1. Under Preset name, select the **Performance** preset
1. Change **BOX64_AVX** to **1**`
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect unordered lists', () => {
      const text = `Some text
- Item one
- Item two
* Item three`
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect headers', () => {
      const text = `Some text
# Header 1
## Header 2`
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect inline code', () => {
      expect(hasMarkdownSyntax('Use `code` here')).toBe(true)
    })

    it('should detect code blocks', () => {
      const text = '```\ncode block\n```'
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect blockquotes', () => {
      const text = `Normal text
> This is a quote`
      expect(hasMarkdownSyntax(text)).toBe(true)
    })

    it('should detect links', () => {
      expect(hasMarkdownSyntax('Check [this link](https://example.com)')).toBe(true)
    })

    it('should return false for plain text', () => {
      expect(hasMarkdownSyntax('This is just plain text without any markdown')).toBe(false)
    })

    it('should return false for empty text', () => {
      expect(hasMarkdownSyntax('')).toBe(false)
    })
  })

  describe('parseMarkdown', () => {
    it('should parse bold text correctly', () => {
      const result = parseMarkdown('**bold text**')
      expect(result).toContain('<strong>bold text</strong>')
    })

    it('should parse numbered lists correctly', () => {
      const text = `1. First item
2. Second item
3. Third item`
      const result = parseMarkdown(text)
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>First item</li>')
      expect(result).toContain('<li>Second item</li>')
      expect(result).toContain('<li>Third item</li>')
      expect(result).toContain('</ol>')
    })

    it('should parse the bug report example correctly', () => {
      const text = `Portal is in Xbox input mode. Requires adjustments:
1. From GameNative settings, go to **Emulation > Box64 Preset**
1. Under Preset name, select the **Performance** preset
1. Change **BOX64_AVX** to **1**`

      const result = parseMarkdown(text)
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>From GameNative settings, go to <strong>Emulation')
      expect(result).toContain('<strong>Performance</strong>')
      expect(result).toContain('<strong>BOX64_AVX</strong>')
      expect(result).toContain('<strong>1</strong>')
    })

    it('should handle mixed markdown correctly', () => {
      const text = `# Header
This is **bold** and this is *italic*.
- List item 1
- List item 2

> A quote

\`inline code\``

      const result = parseMarkdown(text)
      expect(result).toContain('<h1>Header</h1>')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('<code>inline code</code>')
    })

    it('should convert line breaks to <br> tags', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const result = parseMarkdown(text)
      expect(result).toContain('<br>')
    })

    it('should auto-link URLs', () => {
      const text = 'Visit https://example.com for more info'
      const result = parseMarkdown(text)
      expect(result).toContain('<a href="https://example.com"')
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener noreferrer"')
    })

    it('should sanitize dangerous content', () => {
      const text = '<script>alert("XSS")</script>**safe text**'
      const result = parseMarkdown(text)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      // When dangerous content is detected, the text is returned sanitized but not parsed
      expect(result).toContain('safe text')
    })
  })
})
