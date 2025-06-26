import { franc } from 'franc'
import http from '@/rest/http'
import { type MyMemoryTranslationResponse } from '@/utils/translation.types'

export interface LanguageDetectionResult {
  isEnglish: boolean
  detectedLanguage: string
  confidence: number
}

export interface TranslationResult {
  translatedText: string
  originalLanguage: string
  targetLanguage: string
}

// ISO 639-1 language codes supported by MyMemory
const SUPPORTED_LANGUAGES = {
  ar: 'Arabic',
  bg: 'Bulgarian',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  hu: 'Hungarian',
  it: 'Italian',
  ja: 'Japanese',
  lt: 'Lithuanian',
  lv: 'Latvian',
  nl: 'Dutch',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sv: 'Swedish',
  zh: 'Chinese',
}

function getUserLocale(): string {
  // Get user's locale, fallback to 'en' if not supported
  const locale =
    typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'

  return Object.keys(SUPPORTED_LANGUAGES).includes(locale) ? locale : 'en'
}

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length < 10) {
    return {
      isEnglish: true,
      detectedLanguage: 'en',
      confidence: 0,
    }
  }

  try {
    // Use franc to detect language
    const detectedLang = franc(text)

    // Map franc language codes to ISO 639-1
    const langMap: Record<string, string> = {
      eng: 'en',
      spa: 'es',
      fra: 'fr',
      deu: 'de',
      ita: 'it',
      por: 'pt',
      rus: 'ru',
      jpn: 'ja',
      zho: 'zh',
      ara: 'ar',
      nld: 'nl',
      pol: 'pl',
      swe: 'sv',
      dan: 'da',
      fin: 'fi',
      hun: 'hu',
      ces: 'cs',
      slk: 'sk',
      slv: 'sl',
      ron: 'ro',
      bul: 'bg',
      ell: 'el',
      est: 'et',
      lav: 'lv',
      lit: 'lt',
    }

    const mappedLang = langMap[detectedLang] || 'en'
    const isEnglish = mappedLang === 'en'

    return {
      isEnglish,
      detectedLanguage: mappedLang,
      confidence: isEnglish ? 1 : 0.8, // Simplified confidence scoring
    }
  } catch (error) {
    console.warn('Language detection failed:', error)
    return {
      isEnglish: true,
      detectedLanguage: 'en',
      confidence: 0,
    }
  }
}

export async function translateText(
  text: string,
  fromLang?: string,
  toLang?: string,
): Promise<TranslationResult> {
  const targetLang = toLang || getUserLocale()
  const sourceLang = fromLang || detectLanguage(text).detectedLanguage

  // Don't translate if source and target are the same
  if (sourceLang === targetLang) {
    return {
      translatedText: text,
      originalLanguage: sourceLang,
      targetLanguage: targetLang,
    }
  }

  try {
    // Use MyMemory API (free tier: 1000 requests/day)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    const response = await http.get<MyMemoryTranslationResponse>(url, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EmuReady-Translation-Service/1.0',
      },
    })

    if (!response) {
      throw new Error('Translation failed: No response received')
    }

    const data = response.data

    if (data.responseStatus === 200 && data.responseData) {
      return {
        translatedText: data.responseData.translatedText,
        originalLanguage: sourceLang,
        targetLanguage: targetLang,
      }
    }

    throw new Error('Translation failed: Invalid response')
  } catch (error) {
    console.error('Translation error:', error)
    // Return original text if translation fails
    return {
      translatedText: text,
      originalLanguage: sourceLang,
      targetLanguage: targetLang,
    }
  }
}

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, TranslationResult>()

export async function translateTextCached(
  text: string,
  fromLang?: string,
  toLang?: string,
): Promise<TranslationResult> {
  const cacheKey = `${text}-${fromLang || 'auto'}-${toLang || getUserLocale()}`

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  const result = await translateText(text, fromLang, toLang)
  translationCache.set(cacheKey, result)

  return result
}

export function shouldShowTranslation(text: string): boolean {
  if (!text || text.trim().length < 10) return false

  const detection = detectLanguage(text)
  const userLocale = getUserLocale()

  // Show translation if text is not in English AND user locale is English
  // OR if text is not in user's locale
  return (
    (!detection.isEnglish && userLocale === 'en') ||
    (detection.detectedLanguage !== userLocale && detection.confidence > 0.5)
  )
}
