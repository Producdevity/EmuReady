import { describe, it, expect } from 'vitest'
import { parseLimit } from './pagination'

describe('parseLimit', () => {
  describe('with null or empty value', () => {
    it('returns default limit when value is null', () => {
      expect(parseLimit(null, 100)).toBe(10)
    })

    it('returns default limit when value is empty string', () => {
      expect(parseLimit('', 100)).toBe(10)
    })
  })

  describe('with valid PAGE_SIZE_OPTIONS', () => {
    it('returns 10 when value is "10"', () => {
      expect(parseLimit('10', 100)).toBe(10)
    })

    it('returns 25 when value is "25"', () => {
      expect(parseLimit('25', 100)).toBe(25)
    })

    it('returns 50 when value is "50"', () => {
      expect(parseLimit('50', 100)).toBe(50)
    })
  })

  describe('with maxLimit constraint', () => {
    it('returns 25 when value is "50" but maxLimit is 25', () => {
      expect(parseLimit('50', 25)).toBe(25)
    })

    it('returns 10 when value is "25" but maxLimit is 10', () => {
      expect(parseLimit('25', 10)).toBe(10)
    })

    it('returns closest valid option under maxLimit', () => {
      // maxLimit 30 means only 10 and 25 are valid, 50 should return 25
      expect(parseLimit('50', 30)).toBe(25)
    })
  })

  describe('with invalid values', () => {
    it('returns default limit for negative numbers', () => {
      expect(parseLimit('-5', 100)).toBe(10)
    })

    it('returns default limit for zero', () => {
      expect(parseLimit('0', 100)).toBe(10)
    })

    it('returns default limit for non-numeric strings', () => {
      expect(parseLimit('abc', 100)).toBe(10)
    })

    it('returns default limit for NaN-producing strings', () => {
      expect(parseLimit('NaN', 100)).toBe(10)
    })
  })

  describe('with values not in PAGE_SIZE_OPTIONS', () => {
    it('returns closest valid option for 15 (between 10 and 25)', () => {
      // 15 is closer to 10 than to 25
      expect(parseLimit('15', 100)).toBe(10)
    })

    it('returns closest valid option for 20 (between 10 and 25)', () => {
      // 20 is closer to 25 than to 10
      expect(parseLimit('20', 100)).toBe(25)
    })

    it('returns closest valid option for 40 (between 25 and 50)', () => {
      // 40 is closer to 50 than to 25
      expect(parseLimit('40', 100)).toBe(50)
    })

    it('returns closest valid option for 100 (above all options)', () => {
      // 100 is closest to 50
      expect(parseLimit('100', 100)).toBe(50)
    })

    it('returns closest valid option respecting maxLimit', () => {
      // Value 40, maxLimit 30 means only 10 and 25 are valid
      // 40 is closest to 25
      expect(parseLimit('40', 30)).toBe(25)
    })
  })
})
