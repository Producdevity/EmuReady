import { first } from 'remeda'
import { de, enUS, es, fr, nl, type Locale } from 'date-fns/locale'
import { format, formatDistanceToNow } from 'date-fns'

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

export function formatDate(dateString: Date | string) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string) {
  const locale = getLocale()
  return format(new Date(date), 'Pp', { locale })
}

export function formatTimeAgo(date: Date | string) {
  const locale = getLocale()
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale })
}
