import { describe, it, expect } from 'vitest'
import { inferRatingAndNsfw } from './nsfwHelpers'

describe('inferRatingAndNsfw', () => {
  it('detects AO rating as erotic', () => {
    const result = inferRatingAndNsfw({ rating: 'AO' })
    expect(result.isErotic).toBe(true)
    expect(result.ageRating).toBe('AO')
  })

  it('handles missing rating', () => {
    const result = inferRatingAndNsfw({})
    expect(result.isErotic).toBe(false)
    expect(result.ageRating).toBeUndefined()
  })
})
