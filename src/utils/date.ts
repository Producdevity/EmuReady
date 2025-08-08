import { format, formatDistanceToNow } from 'date-fns'
import { de, enUS, es, fr, nl, type Locale } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { first } from 'remeda'

export const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  es: es,
  fr: fr,
  nl: nl,
}

export function getLocale(): Locale {
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && navigator?.language) {
    const lang = first(navigator.language.split('-')) ?? 'en'
    return localeMap[lang] ?? localeMap.en
  }
  // Server fallback
  return localeMap.en
}

export type DateFormat = 'date' | 'monthYear' | 'dateTime' | 'timeAgo' | 'year'

export const formatters: Record<DateFormat, (date: Date, locale: Locale) => string> = {
  date: (date, locale) => format(date, 'MMM d, yyyy', { locale }),
  monthYear: (date, locale) => format(date, 'MMMM yyyy', { locale }),
  dateTime: (date, locale) => format(date, 'Pp', { locale }),
  timeAgo: (date, locale) => formatDistanceToNow(date, { addSuffix: true, locale }),
  year: (date, locale) => format(date, 'yyyy', { locale }),
}

/**
 * Hook to get locale-aware formatted dates that are hydration-safe
 * Returns English on first render, then updates to user's locale
 * Use this when you need formatted dates as string values (for aria-labels, dynamic content, etc.)
 */
export function useLocalizedDate() {
  const [locale, setLocale] = useState<Locale>(localeMap.en)

  useEffect(() => {
    setLocale(getLocale())
  }, [])

  return {
    formatDate: (dateString: Date | string) => formatters.date(new Date(dateString), locale),
    formatMonthYear: (date: Date | string) => formatters.monthYear(new Date(date), locale),
    formatDateTime: (date: Date | string) => formatters.dateTime(new Date(date), locale),
    formatTimeAgo: (date: Date | string) => formatters.timeAgo(new Date(date), locale),
    formatYear: (date: Date | string) => formatters.year(new Date(date), locale),
  }
}
