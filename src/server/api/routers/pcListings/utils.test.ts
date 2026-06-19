import { describe, expect, it } from 'vitest'
import { toPrismaCustomFieldValue } from './utils'

describe('pcListings router utilities', () => {
  it('preserves JSON-compatible custom field values', () => {
    expect(
      toPrismaCustomFieldValue({
        enabled: true,
        values: ['quality', 60, null],
      }),
    ).toEqual({
      enabled: true,
      values: ['quality', 60, null],
    })
  })

  it('rejects non-plain objects instead of converting them to empty records', () => {
    expect(() => toPrismaCustomFieldValue(new Date('2026-01-01T00:00:00.000Z'))).toThrow(
      'Invalid input for field: customFieldValues',
    )
  })
})
