import { franc } from 'franc'
import http from '@/rest/http'
import type {
  MyMemoryTranslationResponse,
  LanguageDetectionResult,
  TranslationResult,
} from '@/utils/translation.types'

const LANG_MAP: Record<string, string> = {
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

// Language names mapping for display
const LANGUAGE_NAMES: Record<string, string> = {
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

// MyMemory's supported ISO-639-1 set
const SUPPORTED_LANGUAGES = new Set([
  'ar',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'it',
  'ja',
  'lt',
  'lv',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'zh',
])

/**
 * Get the user's locale.
 * @return {string} The user's locale.
 */
export function getUserLocale(): string {
  const locale =
    typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'
  return SUPPORTED_LANGUAGES.has(locale) ? locale : 'en'
}

/**
 * Detect the language of the text.
 * @param text - The text to detect the language of.
 * @return {LanguageDetectionResult} The language detection result.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (text.trim().length < 10) {
    return { isEnglish: true, detectedLanguage: 'en', confidence: 0 }
  }

  const francCode = franc(text)
  const iso = LANG_MAP[francCode] ?? 'und'
  const isEnglish = iso === 'en'

  return {
    isEnglish,
    detectedLanguage: iso === 'und' ? 'en' : iso,
    confidence: iso === 'und' ? 0.3 : isEnglish ? 1 : 0.8,
  }
}

/**
 * Translate text using MyMemory API.
 * @param text - The text to translate.
 * @param fromLang - Optional source language (ISO 639-1 code).
 * @param toLang - Optional target language (ISO 639-1 code).
 * @return {Promise<TranslationResult>} A promise that resolves to the translation result.
 */
export async function translateText(
  text: string,
  fromLang?: string,
  toLang?: string,
): Promise<TranslationResult> {
  const target = toLang ?? getUserLocale()
  const source = fromLang ?? detectLanguage(text).detectedLanguage

  // No need to request if languages already match
  if (source === target) {
    return {
      translatedText: text,
      originalLanguage: source,
      targetLanguage: target,
    }
  }

  const safeTarget = SUPPORTED_LANGUAGES.has(target) ? target : 'en'
  // Use MyMemory API (free tier: 1000 requests/day)
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${safeTarget}`

  try {
    const { data } = await http.get<MyMemoryTranslationResponse>(url, {
      timeout: 10_000,
      headers: {
        Accept: 'application/json',
      },
    })

    if (data.responseStatus === 200 && data.responseData) {
      return {
        translatedText: data.responseData.translatedText,
        originalLanguage: source,
        targetLanguage: safeTarget,
      }
    }

    // Non-200 or malformed: fall through to return-original
  } catch (err) {
    console.error('Translation request failed:', err)
  }

  // Fallback – return original text unchanged
  return {
    translatedText: text,
    originalLanguage: source,
    targetLanguage: target,
  }
}

/** Cache for translations to avoid repeated API calls */
const translationCache = new Map<string, TranslationResult>()

/**
 * Translate text with caching.
 * @param text - The text to translate.
 * @param fromLang - Optional source language (ISO 639-1 code).
 * @param toLang - Optional target language (ISO 639-1 code).
 * @return {Promise<TranslationResult>} A promise that resolves to the translation result.
 */
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

/**
 * Check if translation should be shown based on text length and language detection.
 * @param text - The text to check.
 * @return {boolean} True if translation should be shown, false otherwise.
 */
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

/**
 * Get the full language name from ISO language code.
 * @param isoCode - The ISO 639-1 language code.
 * @return {string} The full language name or the original code if not found.
 */
export function getLanguageName(isoCode: string): string {
  return LANGUAGE_NAMES[isoCode.toLowerCase()] || isoCode.toUpperCase()
}
