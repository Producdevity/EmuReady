import { franc } from 'franc'
import http from '@/rest/http'
import type {
  MyMemoryTranslationResponse,
  LanguageDetectionResult,
  TranslationResult,
} from '@/utils/translation.types'

// Language data: franc ISO 639-3 codes mapped to MyMemory-supported ISO 639-1 codes with names
// Only includes languages that MyMemory API actually supports for translation
const SUPPORTED_LANGUAGES: Record<string, { code: string; name: string }> = {
  eng: { code: 'en', name: 'English' },
  spa: { code: 'es', name: 'Spanish' },
  fra: { code: 'fr', name: 'French' },
  deu: { code: 'de', name: 'German' },
  ita: { code: 'it', name: 'Italian' },
  por: { code: 'pt', name: 'Portuguese' },
  rus: { code: 'ru', name: 'Russian' },
  jpn: { code: 'ja', name: 'Japanese' },
  zho: { code: 'zh', name: 'Chinese' },
  cmn: { code: 'zh', name: 'Chinese (Mandarin)' },
  ara: { code: 'ar', name: 'Arabic' },
  arb: { code: 'ar', name: 'Arabic (Standard)' },
  nld: { code: 'nl', name: 'Dutch' },
  pol: { code: 'pl', name: 'Polish' },
  swe: { code: 'sv', name: 'Swedish' },
  dan: { code: 'da', name: 'Danish' },
  fin: { code: 'fi', name: 'Finnish' },
  hun: { code: 'hu', name: 'Hungarian' },
  ces: { code: 'cs', name: 'Czech' },
  slk: { code: 'sk', name: 'Slovak' },
  slv: { code: 'sl', name: 'Slovenian' },
  ron: { code: 'ro', name: 'Romanian' },
  bul: { code: 'bg', name: 'Bulgarian' },
  ell: { code: 'el', name: 'Greek' },
  est: { code: 'et', name: 'Estonian' },
  lav: { code: 'lv', name: 'Latvian' },
  lit: { code: 'lt', name: 'Lithuanian' },
}

// Set of supported ISO 639-1 language codes for quick lookup
const SUPPORTED_LANGUAGE_CODES = new Set(Object.values(SUPPORTED_LANGUAGES).map(({ code }) => code))

/**
 * Get the user's locale.
 * @return {string} The user's locale.
 */
export function getUserLocale(): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'
  return SUPPORTED_LANGUAGE_CODES.has(locale) ? locale : 'en'
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
  const languageData = SUPPORTED_LANGUAGES[francCode]
  const iso = languageData?.code ?? 'und'
  const isEnglish = iso === 'en'

  // If franc returns 'und' (undetermined), treat as English with low confidence
  // Only offer translation for clearly detected non-English languages
  if (iso === 'und') {
    return { isEnglish: true, detectedLanguage: 'en', confidence: 0.1 }
  }

  return {
    isEnglish,
    detectedLanguage: iso,
    confidence: isEnglish ? 1 : 0.9, // High confidence for detected languages
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

  const safeTarget = SUPPORTED_LANGUAGE_CODES.has(target) ? target : 'en'
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

  // Only show translation for high-confidence non-English detection
  // AND when the detected language is different from user's locale
  return (
    !detection.isEnglish && detection.confidence > 0.8 && detection.detectedLanguage !== userLocale
  )
}

/**
 * Get the full language name from ISO language code.
 * @param isoCode - The ISO 639-1 language code.
 * @return {string} The full language name or the original code if not found.
 */
export function getLanguageName(isoCode: string): string {
  // Find the language name by looking for the ISO code in our supported languages
  const languageEntry = Object.values(SUPPORTED_LANGUAGES).find(
    ({ code }) => code === isoCode.toLowerCase(),
  )
  return languageEntry?.name ?? isoCode.toUpperCase()
}
