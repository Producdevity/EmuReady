import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from '@/lib/errors'
import { Role } from '@orm'
import { assertGameImageUrlsAllowed, canUseArbitraryGameImageUrls } from './game-image-url.policy'

describe('game-image-url policy', () => {
  it('allows provider image URLs for regular users', () => {
    expect(() =>
      assertGameImageUrlsAllowed(
        { imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/game.jpg' },
        { role: Role.USER, permissions: [] },
      ),
    ).not.toThrow()
  })

  it('rejects arbitrary image URLs for regular users', () => {
    expect(() =>
      assertGameImageUrlsAllowed(
        { imageUrl: 'https://example.com/game.jpg' },
        { role: Role.USER, permissions: [] },
      ),
    ).toThrow(ERROR_MESSAGES.FORBIDDEN)
  })

  it('allows arbitrary image URLs for moderators', () => {
    expect(canUseArbitraryGameImageUrls({ role: Role.MODERATOR, permissions: [] })).toBe(true)
    expect(() =>
      assertGameImageUrlsAllowed(
        { bannerUrl: 'https://example.com/banner.jpg' },
        { role: Role.MODERATOR, permissions: [] },
      ),
    ).not.toThrow()
  })

  it('allows arbitrary image URLs for users with game edit permissions', () => {
    expect(() =>
      assertGameImageUrlsAllowed(
        { boxartUrl: 'https://example.com/boxart.jpg' },
        { role: Role.USER, permissions: ['edit_games'] },
      ),
    ).not.toThrow()
  })

  it('rejects unsafe image URL forms for every actor', () => {
    expect(() =>
      assertGameImageUrlsAllowed(
        { imageUrl: 'http://example.com/game.jpg' },
        { role: Role.MODERATOR, permissions: [] },
      ),
    ).toThrow('Image URL must use HTTPS')

    expect(() =>
      assertGameImageUrlsAllowed(
        { imageUrl: 'https://127.0.0.1/game.jpg' },
        { role: Role.MODERATOR, permissions: [] },
      ),
    ).toThrow('localhost or a private network address')

    expect(() =>
      assertGameImageUrlsAllowed(
        { imageUrl: 'https://example.com/game.svg' },
        { role: Role.MODERATOR, permissions: [] },
      ),
    ).toThrow('SVG game images are not allowed')
  })
})
