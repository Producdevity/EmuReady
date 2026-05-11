/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdown'

describe('Markdown Utils server runtime', () => {
  it('renders safe markdown through the jsdom DOMPurify setup', () => {
    const result = parseMarkdown('**safe**')

    expect(result).toContain('<strong>safe</strong>')
  })

  it('sanitizes dangerous markdown through the jsdom DOMPurify setup', () => {
    const result = parseMarkdown('**safe** <script>alert("xss")</script>')

    expect(result).toContain('safe')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })
})
