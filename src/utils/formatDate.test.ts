import { describe, it, expect } from 'vitest'
import formatDate from './formatDate'

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
