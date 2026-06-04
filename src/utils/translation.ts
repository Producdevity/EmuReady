import http from '@/rest/http'
import type {
  MyMemoryTranslationResponse,
  LanguageDetectionResult,
  TranslationResult,
} from '@/utils/translation.types'
import type { Options as FrancOptions, TrigramTuple } from 'franc-min'

interface FrancMinModule {
  franc: (value?: string, options?: FrancOptions) => string
  francAll: (value?: string, options?: FrancOptions) => TrigramTuple[]
}

// Language data: franc ISO 639-3 codes mapped to MyMemory-supported ISO 639-1 codes with names
// Only includes languages that MyMemory API actually supports for translation
const SUPPORTED_LANGUAGES: Record<string, { code: string; name: string }> = {
  eng: { code: 'en', name: 'English' },
  spa: { code: 'es', name: 'Spanish' },
  fra: { code: 'fr', name: 'French' },
  deu: { code: 'de', name: 'German' },
  ita: { code: 'it', name: 'Italian' },
  por: { code: 'pt', name: 'Portuguese' },
  glg: { code: 'gl', name: 'Galician' },
  cat: { code: 'ca', name: 'Catalan' },
  afr: { code: 'af', name: 'Afrikaans' },
  nob: { code: 'no', name: 'Norwegian (Bokmål)' },
  nno: { code: 'no', name: 'Norwegian (Nynorsk)' },
  hrv: { code: 'hr', name: 'Croatian' },
  srp: { code: 'sr', name: 'Serbian' },
  bos: { code: 'bs', name: 'Bosnian' },
  ukr: { code: 'uk', name: 'Ukrainian' },
  bel: { code: 'be', name: 'Belarusian' },
  tur: { code: 'tr', name: 'Turkish' },
  ind: { code: 'id', name: 'Indonesian' },
  msa: { code: 'ms', name: 'Malay' },
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
const LINE_SPLIT_REGEX = /(\r?\n+)/
const URL_REGEX = /(https?:\/\/|www\.)[^\s)]+/gi
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/|www\.)[^)]+\)/gi
const MIN_ENGLISH_CONFIDENCE = 0.8
const NON_ENGLISH_SCORE_MARGIN = 0.05
const FRANC_MIN_LENGTH = 10
const MIN_ALTERNATIVE_CONFIDENCE = 0.4

let francMinModulePromise: Promise<FrancMinModule> | null = null
const detectionCache = new Map<string, Promise<LanguageDetectionResult>>()

function loadFrancMin(): Promise<FrancMinModule> {
  francMinModulePromise ??= import('franc-min').then((module) => ({
    franc: module.franc,
    francAll: module.francAll,
  }))
  return francMinModulePromise
}

function sanitizeForDetection(value: string): string {
  const withoutMarkdownLinks = value.replace(MARKDOWN_LINK_REGEX, '$1')
  const withoutStandaloneUrls = withoutMarkdownLinks.replace(URL_REGEX, ' ')
  return withoutStandaloneUrls.replace(/\s+/g, ' ').trim()
}

interface TranslationRequest {
  text: string
  source: string
  target: string
}

function normalizeForComparison(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function isMeaningfullyDifferent(original: string, translated: string): boolean {
  return normalizeForComparison(original) !== normalizeForComparison(translated)
}

function getFallbackDetection(confidence = 0): LanguageDetectionResult {
  return { isEnglish: true, detectedLanguage: 'en', confidence }
}

async function requestTranslation({ text, source, target }: TranslationRequest) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`

  try {
    const { data } = await http.get<MyMemoryTranslationResponse>(url, {
      timeout: 10_000,
      headers: {
        Accept: 'application/json',
      },
    })

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText
    }
  } catch (err) {
    console.error('Translation request failed:', err)
  }

  return null
}

async function translateBySegments({
  text,
  target,
}: {
  text: string
  target: string
}): Promise<string | null> {
  const segments = text.split(LINE_SPLIT_REGEX)
  const translatedSegments: string[] = []
  let anyTranslated = false

  for (const segment of segments) {
    if (segment === '') {
      translatedSegments.push(segment)
      continue
    }

    if (/^(?:\r?\n)+$/.test(segment)) {
      translatedSegments.push(segment)
      continue
    }

    const trimmed = segment.trim()
    if (!trimmed) {
      translatedSegments.push(segment)
      continue
    }

    const detection = await detectLanguage(trimmed)
    if (detection.isEnglish || detection.detectedLanguage === target) {
      translatedSegments.push(segment)
      continue
    }

    const partialTranslation = await requestTranslation({
      text: trimmed,
      source: detection.detectedLanguage,
      target,
    })

    if (partialTranslation && isMeaningfullyDifferent(trimmed, partialTranslation)) {
      const leadingWhitespace = segment.match(/^\s*/)?.[0] ?? ''
      const trailingWhitespace = segment.match(/\s*$/)?.[0] ?? ''
      translatedSegments.push(`${leadingWhitespace}${partialTranslation}${trailingWhitespace}`)
      anyTranslated = true
    } else {
      translatedSegments.push(segment)
    }
  }

  return anyTranslated ? translatedSegments.join('') : null
}

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
 * @return A promise resolving to the language detection result.
 */
async function detectSanitizedLanguage(sanitized: string): Promise<LanguageDetectionResult> {
  try {
    const { franc, francAll } = await loadFrancMin()
    const francOptions = { minLength: FRANC_MIN_LENGTH }
    const francCode = franc(sanitized, francOptions)
    const candidates = francAll(sanitized, francOptions)

    const languageData = SUPPORTED_LANGUAGES[francCode]
    const iso = languageData?.code ?? 'und'
    const detectedConfidence = 1

    if (languageData && iso !== 'en') {
      return { isEnglish: false, detectedLanguage: iso, confidence: detectedConfidence }
    }

    const englishCandidateScore =
      languageData?.code === 'en'
        ? detectedConfidence
        : (() => {
            const candidate = candidates.find(([code, score]) => {
              const data = SUPPORTED_LANGUAGES[code]
              if (!data) return false
              return data.code === 'en' && score >= MIN_ENGLISH_CONFIDENCE
            })
            return candidate ? candidate[1] : 0
          })()

    const bestNonEnglishCandidate = candidates.reduce<{ code: string; score: number } | null>(
      (current, [code, score]) => {
        const data = SUPPORTED_LANGUAGES[code]
        if (!data) return current
        if (data.code === 'en') return current
        if (score < MIN_ALTERNATIVE_CONFIDENCE) return current
        if (!current || score > current.score) {
          return { code: data.code, score }
        }
        return current
      },
      null,
    )

    if (
      bestNonEnglishCandidate &&
      (englishCandidateScore === 0 ||
        englishCandidateScore - bestNonEnglishCandidate.score <= NON_ENGLISH_SCORE_MARGIN)
    ) {
      return {
        isEnglish: false,
        detectedLanguage: bestNonEnglishCandidate.code,
        confidence: Math.max(0.9, bestNonEnglishCandidate.score),
      }
    }

    if (languageData?.code === 'en') {
      return { isEnglish: true, detectedLanguage: 'en', confidence: detectedConfidence }
    }

    if (englishCandidateScore >= MIN_ENGLISH_CONFIDENCE) {
      return { isEnglish: true, detectedLanguage: 'en', confidence: englishCandidateScore }
    }

    if (iso === 'und') {
      return getFallbackDetection(0.1)
    }

    return getFallbackDetection(1)
  } catch (error) {
    console.error('Language detection failed:', error)
    return getFallbackDetection()
  }
}

export function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  const sanitized = sanitizeForDetection(text)

  if (sanitized.length < FRANC_MIN_LENGTH) {
    return Promise.resolve(getFallbackDetection())
  }

  const cachedDetection = detectionCache.get(sanitized)
  if (cachedDetection) return cachedDetection

  const detectionPromise = detectSanitizedLanguage(sanitized)
  detectionCache.set(sanitized, detectionPromise)
  return detectionPromise
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
  const source = fromLang ?? (await detectLanguage(text)).detectedLanguage

  // No need to request if languages already match
  if (source === target) {
    return {
      translatedText: text,
      originalLanguage: source,
      targetLanguage: target,
    }
  }

  const safeTarget = SUPPORTED_LANGUAGE_CODES.has(target) ? target : 'en'

  const initialTranslation = await requestTranslation({
    text,
    source,
    target: safeTarget,
  })

  if (initialTranslation && isMeaningfullyDifferent(text, initialTranslation)) {
    return {
      translatedText: initialTranslation,
      originalLanguage: source,
      targetLanguage: safeTarget,
    }
  }

  const segmentedTranslation = await translateBySegments({
    text,
    target: safeTarget,
  })

  if (segmentedTranslation) {
    return {
      translatedText: segmentedTranslation,
      originalLanguage: source,
      targetLanguage: safeTarget,
    }
  }

  return {
    translatedText: initialTranslation ?? text,
    originalLanguage: source,
    targetLanguage: safeTarget,
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
 * @return A promise resolving to true if translation should be shown.
 */
export async function shouldShowTranslation(text: string): Promise<boolean> {
  if (!text || text.trim().length < FRANC_MIN_LENGTH) return false

  const detection = await detectLanguage(text)
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
