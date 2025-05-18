import { describe, it, expect } from 'vitest'
import sanitizeInput from './sanitizeInput'

describe('sanitizeInput', () => {
  it('should remove angle brackets', () => {
    const input = '<script>alert("XSS")</script>'
    const expectedOutput = 'scriptalert("XSS")/script'
    expect(sanitizeInput(input)).toBe(expectedOutput)
  })

  it('should trim whitespace', () => {
    const input = '   Hello World   '
    const expectedOutput = 'Hello World'
    expect(sanitizeInput(input)).toBe(expectedOutput)
  })

  it('should handle empty strings', () => {
    const input = ''
    const expectedOutput = ''
    expect(sanitizeInput(input)).toBe(expectedOutput)
  })

  it('should handle strings without angle brackets', () => {
    const input = 'Hello World'
    const expectedOutput = 'Hello World'
    expect(sanitizeInput(input)).toBe(expectedOutput)
  })
})
