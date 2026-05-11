import { describe, it, expect } from 'vitest'
import { hasMarkdownSyntax, parseMarkdown, stripMarkdown, validateMarkdown } from './markdown'

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
      expect(
        new DOMParser().parseFromString(result, 'text/html').querySelector('script'),
      ).toBeNull()
      expect(result).toContain('safe text')
    })

    it('should not create links for dangerous markdown protocols', () => {
      const result = parseMarkdown('[bad](javascript:alert(1))')

      const doc = new DOMParser().parseFromString(result, 'text/html')

      expect(doc.querySelector('a')).toBeNull()
    })

    it('should not create links for unsafe data URI markdown protocols', () => {
      const result = parseMarkdown('[bad](data:text/html;base64,PHNjcmlwdD4=)')

      const doc = new DOMParser().parseFromString(result, 'text/html')

      expect(doc.querySelector('a')).toBeNull()
    })

    it('should not create elements from raw HTML with event handlers', () => {
      // noinspection HtmlUnknownTarget,HtmlDeprecatedAttribute
      const result = parseMarkdown('<img src=x onerror=alert(1) alt="x">safe')
      const doc = new DOMParser().parseFromString(result, 'text/html')

      expect(result).not.toContain('<img')
      expect(doc.querySelector('img')).toBeNull()
      expect(doc.querySelector('[onerror]')).toBeNull()
      expect(result).toContain('safe')
    })

    it('should preserve formatting when text mentions dangerous protocols', () => {
      const result = parseMarkdown('Never use `javascript:` URLs with **markdown**')

      expect(result).toContain('<code>javascript:</code>')
      expect(result).toContain('<strong>markdown</strong>')
    })

    it('should preserve formatting for benign assignments', () => {
      const result = parseMarkdown('one = **safe**')

      expect(result).toContain('one = <strong>safe</strong>')
      expect(stripMarkdown('one = **safe**')).toBe('one = safe')
    })

    it('should handle markdown-it linkify ReDoS input quickly', () => {
      const redosInput = `https://example.com/${'*'.repeat(30000)}!`
      const start = Date.now()

      const result = parseMarkdown(redosInput)
      const duration = Date.now() - start

      expect(typeof result).toBe('string')
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('validateMarkdown', () => {
    it('should preserve valid markdown that describes unsafe protocols', () => {
      const result = validateMarkdown('Never use `javascript:` URLs with **markdown**')

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.cleanText).toContain('<code>javascript:</code>')
      expect(result.cleanText).toContain('<strong>markdown</strong>')
    })

    it('should return sanitized output without duplicate validation errors', () => {
      const result = validateMarkdown(
        '<script>alert("xss")</script><img src=x onerror=alert(1)>safe',
      )
      const doc = new DOMParser().parseFromString(result.cleanText, 'text/html')

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(doc.querySelector('script')).toBeNull()
      expect(doc.querySelector('img')).toBeNull()
      expect(result.cleanText).toContain('safe')
    })
  })
})
