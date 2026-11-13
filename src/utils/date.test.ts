import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { formatters, localeMap, useLocalizedDate } from '@/utils/date'

afterEach(() => vi.restoreAllMocks())

describe('date utilities', () => {
  it('useLocalizedDate hook is exported', () => {
    expect(useLocalizedDate).toBeDefined()
    expect(typeof useLocalizedDate).toBe('function')
  })

  it('updates localized formatting when the browser language changes', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
    const date = new Date('2025-05-10T12:00:00Z')
    const view = renderHook(() => useLocalizedDate())
    expect(view.result.current.formatDate(date)).toBe(formatters.date(date, localeMap.en))

    act(() => {
      language.mockReturnValue('nl-NL')
      window.dispatchEvent(new Event('languagechange'))
    })
    expect(view.result.current.formatDate(date)).toBe(formatters.date(date, localeMap.nl))
  })
})
