import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import { formatDate, formatDateTime, formatTimeAgo } from '@/utils/date'

describe('formatDate', () => {
  it('should format Date objects correctly', () => {
    const date = new Date('2023-05-15T12:00:00Z')
    expect(formatDate(date)).toMatch(/May 15, 2023/)
  })

  it('should format date strings correctly', () => {
    expect(formatDate('2023-05-15T12:00:00Z')).toMatch(/May 15, 2023/)
  })

  it('should handle different date formats', () => {
    expect(formatDate('2023/01/01')).toMatch(/Jan 1, 2023/)
    expect(formatDate('2023-12-31')).toMatch(/Dec 31, 2023/)
  })
})

function mockNavigatorLanguage(lang: string) {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(lang)
}

describe('formatDateTime', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-05-24T20:30:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('formats date and time in English', () => {
    mockNavigatorLanguage('en-US')
    expect(formatDateTime('2025-05-24T20:30:00')).toMatch(
      /5\/24\/2025.*8:30 PM|8:30 p\.m\./,
    )
  })

  it('formats date and time in Dutch', () => {
    mockNavigatorLanguage('nl-NL')
    expect(formatDateTime('2025-05-24T20:30:00')).toMatch(/24-05-2025, 20:30/)
  })

  it('formats date and time in German', () => {
    mockNavigatorLanguage('de-DE')
    expect(formatDateTime('2025-05-24T20:30:00')).toMatch(/24\.05\.2025.*20:30/)
  })

  it('falls back to English for unknown locale', () => {
    mockNavigatorLanguage('it-IT')
    expect(formatDateTime('2025-05-24T20:30:00')).toMatch(
      /5\/24\/2025.*8:30 PM|8:30 p\.m\./,
    )
  })
})

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-05-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns "less than a minute ago" for now (en)', () => {
    mockNavigatorLanguage('en-US')
    expect(formatTimeAgo(new Date('2025-05-24T12:00:00Z'))).toMatch(
      /less than a minute ago|in less than a minute/,
    )
  })

  it('returns correct format in Dutch', () => {
    mockNavigatorLanguage('nl-NL')
    expect(formatTimeAgo(new Date('2025-05-23T12:00:00Z'))).toMatch(
      /1 dag geleden/,
    )
  })

  it('returns correct format in German', () => {
    mockNavigatorLanguage('de-DE')
    expect(formatTimeAgo(new Date('2025-05-22T12:00:00Z'))).toMatch(
      /vor 2 Tagen/,
    )
  })

  it('returns English fallback for unsupported locale', () => {
    mockNavigatorLanguage('it-IT')
    expect(formatTimeAgo(new Date('2025-05-24T12:00:00Z'))).toMatch(
      /less than a minute ago|in less than a minute/,
    )
  })
})
