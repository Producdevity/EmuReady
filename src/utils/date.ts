import { format, formatDistanceToNow } from 'date-fns'
import { de, enUS, es, fr, nl, type Locale } from 'date-fns/locale'
import { first } from 'remeda'

const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  es: es,
  fr: fr,
  nl: nl,
}

function getLocale(): Locale {
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && navigator?.language) {
    const lang = first(navigator.language.split('-')) ?? 'en'
    return localeMap[lang] ?? localeMap.en
  }
  // Server fallback
  return localeMap.en
}

/**
 * Formats a date to show just the month and day
 * @param dateString - Date object or string
 */
export function formatDate(dateString: Date | string) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

/**
 * Formats a date to show the month and year
 * @param date - Date object
 */
export function formatMonthYear(date: Date | string) {
  const locale = getLocale()
  return format(new Date(date), 'MMMM yyyy', { locale })
}

/**
 * Formats a date to show the full date and time
 * @param date - Date object or string
 */
export function formatDateTime(date: Date | string) {
  const locale = getLocale()
  return format(new Date(date), 'Pp', { locale })
}

/**
 * Formats a date to show how long ago it was
 * @param date - Date object or string
 */
export function formatTimeAgo(date: Date | string) {
  const locale = getLocale()
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale })
}

/**
 * Formats a release date to show just the year
 * @param date - Date object or string
 */
export function formatYear(date: Date | string) {
  const locale = getLocale()
  return format(new Date(date), 'yyyy', { locale })
}
