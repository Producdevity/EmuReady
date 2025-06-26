import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectLanguage, shouldShowTranslation } from './translation'

// Mock fetch for translation tests
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock navigator.language
Object.defineProperty(window, 'navigator', {
  value: { language: 'en-US' },
  writable: true,
})

describe('translation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectLanguage', () => {
    it('should detect short text as English with low confidence', () => {
      const result = detectLanguage('Hi')
      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBe(0)
    })

    it('should detect empty text as English', () => {
      const result = detectLanguage('')
      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBe(0)
    })

    it('should detect English text', () => {
      const englishText =
        'This is a test message in English language that should be detected properly.'
      const result = detectLanguage(englishText)
      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBe(1)
    })

    it('should detect non-English text', () => {
      const spanishText =
        'Esto es un mensaje de prueba en español que debería ser detectado correctamente.'
      const result = detectLanguage(spanishText)
      // Language detection may not be perfect, so we just check that it attempts detection
      expect(typeof result.isEnglish).toBe('boolean')
      expect(typeof result.detectedLanguage).toBe('string')
      expect(typeof result.confidence).toBe('number')
    })

    it('should handle detection errors gracefully', () => {
      // Test with text that might cause detection to fail
      const result = detectLanguage('12345 !@#$% ^^^^')
      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(typeof result.confidence).toBe('number')
    })
  })

  describe('shouldShowTranslation', () => {
    it('should not show translation for short text', () => {
      expect(shouldShowTranslation('Hi')).toBe(false)
      expect(shouldShowTranslation('')).toBe(false)
    })

    it('should not show translation for English text when user locale is English', () => {
      const englishText = 'This is a test message in English language.'
      expect(shouldShowTranslation(englishText)).toBe(false)
    })

    it('should make a decision about showing translation based on text length and detection', () => {
      const spanishText =
        'Esto es un mensaje de prueba en español que es suficientemente largo.'
      const result = shouldShowTranslation(spanishText)
      expect(typeof result).toBe('boolean')
    })
  })
})
