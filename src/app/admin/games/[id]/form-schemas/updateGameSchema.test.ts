import { describe, expect, it } from 'vitest'
import updateGameSchema from './updateGameSchema'

const baseGameInput = {
  title: 'Alan Wake',
  systemId: '504bca13-6f70-4303-86d4-99a60380a883',
  isErotic: false,
}

describe('updateGameSchema', () => {
  it('converts cleared image fields to null so existing URLs can be removed', () => {
    const result = updateGameSchema.parse({
      ...baseGameInput,
      imageUrl: ' ',
      boxartUrl: '',
      bannerUrl: '',
    })

    expect(result.imageUrl).toBeNull()
    expect(result.boxartUrl).toBeNull()
    expect(result.bannerUrl).toBeNull()
  })

  it('keeps valid HTTPS image URLs trimmed', () => {
    const result = updateGameSchema.parse({
      ...baseGameInput,
      imageUrl: ' https://media.rawg.io/media/games/example.jpg ',
      bannerUrl: undefined,
    })

    expect(result.imageUrl).toBe('https://media.rawg.io/media/games/example.jpg')
  })
})
