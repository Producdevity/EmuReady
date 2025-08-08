'use client'

import useMounted from '@/hooks/useMounted'
import { localeMap, getLocale, formatters, type DateFormat } from '@/utils/date'

interface Props {
  date: Date | string
  format: DateFormat
  className?: string
}

/**
 * Client component that renders dates with proper localization
 * Prevents hydration mismatches by rendering English first, then user's locale
 */
export function LocalizedDate(props: Props) {
  const mounted = useMounted()
  const locale = mounted ? getLocale() : localeMap.en

  const dateObj = new Date(props.date)
  const formatter = formatters[props.format]
  const formatted = formatter(dateObj, locale)

  return (
    <time
      aria-label={formatted}
      dateTime={dateObj.toISOString()}
      className={props.className}
      suppressHydrationWarning // handle any edge cases
    >
      {formatted}
    </time>
  )
}
