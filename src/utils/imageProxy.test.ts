import { describe, expect, it } from 'vitest'
import { isKnownNextImageRemoteUrl, resolveImageProxyUrl, shouldProxyImageUrl } from './imageProxy'

describe('imageProxy', () => {
  it('uses configured next/image remote hosts directly', () => {
    const src = 'https://media.rawg.io/media/games/example.jpg'

    expect(isKnownNextImageRemoteUrl(src)).toBe(true)
    expect(shouldProxyImageUrl(src)).toBe(false)
    expect(resolveImageProxyUrl(src)).toBe(src)
  })

  it('supports configured wildcard remote hosts', () => {
    const src = 'https://img.clerk.com/avatar.png'

    expect(isKnownNextImageRemoteUrl(src)).toBe(true)
    expect(shouldProxyImageUrl(src)).toBe(false)
  })

  it('proxies unknown remote hosts by default', () => {
    const src = 'https://example.com/image.jpg'

    expect(isKnownNextImageRemoteUrl(src)).toBe(false)
    expect(shouldProxyImageUrl(src)).toBe(true)
    expect(resolveImageProxyUrl(src)).toBe(`/api/proxy-image?url=${encodeURIComponent(src)}`)
  })

  it('proxies http URLs because next/image remote patterns only allow https hosts', () => {
    expect(shouldProxyImageUrl('http://media.rawg.io/media/games/example.jpg')).toBe(true)
  })

  it('respects explicit proxy overrides', () => {
    const knownSrc = 'https://images.igdb.com/igdb/image/upload/t_cover_big/game.jpg'
    const unknownSrc = 'https://example.com/image.jpg'

    expect(shouldProxyImageUrl(knownSrc, true)).toBe(true)
    expect(shouldProxyImageUrl(unknownSrc, false)).toBe(false)
  })

  it('never proxies local paths', () => {
    expect(shouldProxyImageUrl('/uploads/games/image.jpg', true)).toBe(false)
    expect(resolveImageProxyUrl('/uploads/games/image.jpg', true)).toBe('/uploads/games/image.jpg')
  })
})
