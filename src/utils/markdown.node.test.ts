/**
 * @vitest-environment node
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdown'

describe('Markdown Utils server runtime', () => {
  it('renders safe markdown through the jsdom DOMPurify setup', () => {
    const result = parseMarkdown('**safe**')

    expect(result).toContain('<strong>safe</strong>')
  })

  it('sanitizes dangerous markdown through the jsdom DOMPurify setup', () => {
    const result = parseMarkdown('**safe** <script>alert("xss")</script>')
    const doc = new JSDOM(result).window.document

    expect(result).toContain('safe')
    expect(result).not.toContain('<script>')
    expect(doc.querySelector('script')).toBeNull()
  })
})
