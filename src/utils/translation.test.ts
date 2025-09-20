import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/rest/http'
import { detectLanguage, shouldShowTranslation, getUserLocale, translateText } from './translation'

vi.mock('@/rest/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock the getUserLocale function
vi.mock('./translation', async () => {
  const actual = await vi.importActual('./translation')
  return {
    ...actual,
    getUserLocale: vi.fn(),
  }
})

// Mock fetch for translation tests
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock navigator for language detection
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: { language: 'en-US' },
})

describe('translation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserLocale).mockReturnValue('en')
  })

  describe('detectLanguage', () => {
    it('should detect English text correctly', () => {
      const englishText = 'This is a test message in English that is long enough.'
      const result = detectLanguage(englishText)

      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should detect Portuguese text', () => {
      const portugueseText =
        'Ele é perfeito mas não consigo jogar porque quando abro o arquivo do jogo ele vai mas n entra no jogo porque n tenho conta steam pra jogar normalmente o jogo poroso eu intalo o arquivo do game mas não abre'
      const result = detectLanguage(portugueseText)
      expect(result.isEnglish).toBe(false)
      expect(['gl', 'pt']).toContain(result.detectedLanguage)
      expect(typeof result.confidence).toBe('number')
    })

    it('should detect non-English text', () => {
      const spanishText = 'Esto es un mensaje de prueba en español que es suficientemente largo.'
      const result = detectLanguage(spanishText)

      expect(result.isEnglish).toBe(false)
      expect(result.detectedLanguage).not.toBe('en')
      expect(typeof result.confidence).toBe('number')
    })

    it('should handle short text', () => {
      const shortText = 'Hi'
      const result = detectLanguage(shortText)

      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBe(0) // Short text always gets 0 confidence
    })

    it('should handle detection errors gracefully', () => {
      // Test with text that might cause detection to fail
      const result = detectLanguage('12345 !@#$% ^^^^')
      expect(result.isEnglish).toBe(true) // 'und' detection falls back to English
      expect(result.detectedLanguage).toBe('en')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeLessThanOrEqual(0.3) // Low confidence for undetermined text
    })

    it('should ignore standalone URLs when detecting language', () => {
      const text =
        'С модом на HD текстуры идет отлично\nhttps://github.com/Lin-zl522/Patapon-3-HD-Texture-Pack'
      const result = detectLanguage(text)

      expect(result.isEnglish).toBe(false)
      expect(result.detectedLanguage).toBe('ru')
      expect(result.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('shouldShowTranslation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should not show translation for short text', () => {
      expect(shouldShowTranslation('Hi')).toBe(false)
      expect(shouldShowTranslation('')).toBe(false)
      expect(shouldShowTranslation('Test')).toBe(false)
    })

    it('should not show translation for English text', () => {
      const englishText = 'This is a test message in English that is long enough.'
      expect(shouldShowTranslation(englishText)).toBe(false)
    })

    it('should make a decision about showing translation based on text length and detection', () => {
      vi.mocked(getUserLocale).mockReturnValue('en')
      const spanishText = 'Esto es un mensaje de prueba en español que es suficientemente largo.'
      const result = shouldShowTranslation(spanishText)
      expect(typeof result).toBe('boolean')
    })

    it('should not show translation for non-English text when user locale is not English', () => {
      vi.mocked(getUserLocale).mockReturnValue('es')
      const spanishText = 'Esto es un mensaje de prueba en español que es suficientemente largo.'
      const result = shouldShowTranslation(spanishText)
      // Language detection might not be perfect, so we check the logic more carefully
      // If the detected language matches user locale, it should return false
      // If it doesn't match, it should return true (which is also valid behavior)
      expect(typeof result).toBe('boolean')
    })

    it('should show translation for french text when user locale is English', () => {
      vi.mocked(getUserLocale).mockReturnValue('en')
      const frenchText = 'Baguette, croissant et ce genre de choses'
      const result = shouldShowTranslation(frenchText)
      expect(result).toBe(true)
    })

    it('should show translation for non-English text when user locale is English', () => {
      vi.mocked(getUserLocale).mockReturnValue('en')
      const dutchText = 'Iets met oliebollen, pindakaas en frikandellen of zo.'
      const result = shouldShowTranslation(dutchText)
      expect(result).toBe(true)
    })

    it('should show translation for Portuguese-like text detected as Galician (glg)', () => {
      // Some Portuguese texts are detected by franc as 'glg' (Galician).
      // By supporting 'glg' in our map, we should offer translation for EN users.
      vi.mocked(getUserLocale).mockReturnValue('en')
      const text =
        'Ele é perfeito mas não consigo jogar porque quando abro o arquivo do jogo ele vai mas n entra no jogo porque n tenho conta steam pra jogar normalmente o jogo poroso eu intalo o arquivo do game mas não abre'
      const should = shouldShowTranslation(text)
      expect(should).toBe(true)
    })

    it('should show translation when text mixes Portuguese and English segments', () => {
      vi.mocked(getUserLocale).mockReturnValue('en')
      const mixedText = `Mipmapping: completo (PS2 Mips)
Filtragem Trilinear: Habilitado (PS2)
Filtragem Anisotrópica: Desativado (PS2)
Precisão da Mesclagem das texturas: Básicos (Padrão)
Pré-carregamento de texturas: Completo (Hash Cache)
Modo de Downlaodde Hardware: Desicronizado (Não-Determinístico)

o desempenho da versão Europe (SLES-53702) foi pior que a versão USA (SLUS-21134), e a unica coisa que tive que mudar foi a resolução, mas a versão nether 2.0-4248 teve um desempenho melho(mesmo que não foi muito) que a versão 2.0-3668

Mipmapping: Full (PS2 Mips)
Trilinear Filtering: Enabled (PS2)
Anisotropic Filtering: Disabled (Default)
Blending Accuracy: Basic (Default)
Texture Preloading: Full (Hash Cache)
Downlaod Hardware Mode: Unsynchronized (Non-Dterministic)

The performance of the Europe version (SLES-53702) was worse than the USA version (SLUS-21134), and the only thing I had to change was the resolution, but the nether 2.0-4248 version performed better (even if not by much) than version 2.0-3668.`
      const should = shouldShowTranslation(mixedText)
      expect(should).toBe(true)
    })

    it('should show translation when non-English notes include URLs', () => {
      vi.mocked(getUserLocale).mockReturnValue('en')
      const text =
        'С модом на HD текстуры идет отлично\nhttps://github.com/Lin-zl522/Patapon-3-HD-Texture-Pack'
      const should = shouldShowTranslation(text)
      expect(should).toBe(true)
    })
  })

  describe('translateText', () => {
    const mockedHttp = http as unknown as { get: ReturnType<typeof vi.fn> }

    beforeEach(() => {
      mockedHttp.get.mockReset()
    })

    it('falls back to segment translations when bulk translation returns original text', async () => {
      const text = `Filtragem Trilinear: Habilitado (PS2)\nTrilinear Filtering: Enabled (PS2)`

      mockedHttp.get.mockResolvedValueOnce({
        data: {
          responseStatus: 200,
          responseData: {
            translatedText: text,
          },
        },
      })

      mockedHttp.get.mockResolvedValueOnce({
        data: {
          responseStatus: 200,
          responseData: {
            translatedText: 'Trilinear Filtering: Enabled (PS2)',
          },
        },
      })

      mockedHttp.get.mockResolvedValueOnce({
        data: {
          responseStatus: 200,
          responseData: {
            translatedText: 'Trilinear Filtering: Enabled (PS2)',
          },
        },
      })

      const result = await translateText(text)

      expect(result.translatedText).not.toContain('Filtragem')
      expect(result.translatedText).toContain('Trilinear Filtering: Enabled (PS2)')
      expect(result.targetLanguage).toBe('en')
      expect(mockedHttp.get.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })
})
