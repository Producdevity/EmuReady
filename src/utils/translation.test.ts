import { beforeEach, describe, expect, it, vi } from 'vitest'
import http from '@/rest/http'
import { detectLanguage, shouldShowTranslation, translateText } from './translation'

vi.mock('@/rest/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window, 'navigator', {
    configurable: true,
    writable: true,
    value: { language },
  })
}

describe('translation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setNavigatorLanguage('en-US')
  })

  describe('detectLanguage', () => {
    it('detects English text', async () => {
      const result = await detectLanguage('This is a test message in English that is long enough.')

      expect(result.isEnglish).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('detects Portuguese-like text', async () => {
      const result = await detectLanguage(
        'Ele e perfeito mas nao consigo jogar porque quando abro o arquivo do jogo ele vai mas n entra no jogo porque n tenho conta steam pra jogar normalmente o jogo poroso eu intalo o arquivo do game mas nao abre',
      )

      expect(result.isEnglish).toBe(false)
      expect(['gl', 'pt']).toContain(result.detectedLanguage)
    })

    it('ignores standalone URLs when detecting language', async () => {
      const result = await detectLanguage(
        'С модом на HD текстуры идет отлично\nhttps://github.com/Lin-zl522/Patapon-3-HD-Texture-Pack',
      )

      expect(result.isEnglish).toBe(false)
      expect(result.detectedLanguage).toBe('ru')
    })
  })

  describe('shouldShowTranslation', () => {
    it('does not show translation for short text', async () => {
      await expect(shouldShowTranslation('Hi')).resolves.toBe(false)
      await expect(shouldShowTranslation('')).resolves.toBe(false)
      await expect(shouldShowTranslation('Test')).resolves.toBe(false)
    })

    it('does not show translation for English text', async () => {
      await expect(
        shouldShowTranslation('This is a test message in English that is long enough.'),
      ).resolves.toBe(false)
    })

    it('shows translation for non-English text when user locale is English', async () => {
      await expect(
        shouldShowTranslation('Baguette, croissant et ce genre de choses'),
      ).resolves.toBe(true)
    })

    it('does not show translation when detected language matches user locale', async () => {
      setNavigatorLanguage('es-ES')

      await expect(
        shouldShowTranslation('Esto es un mensaje de prueba en espanol que es suficientemente largo.'),
      ).resolves.toBe(false)
    })
  })

  describe('translateText', () => {
    const mockedHttp = http as unknown as { get: ReturnType<typeof vi.fn> }

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
