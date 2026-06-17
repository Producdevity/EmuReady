import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import getImageUrl from './getImageUrl'
import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'

vi.mock('./getSafePlaceholderImageUrl', () => ({
  default: vi.fn((title) => `/placeholder-image-for-${title ?? 'unknown'}`),
}))

describe('getImageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns a placeholder image when url is null', () => {
    const result = getImageUrl(null, 'Game Title')
    expect(getSafePlaceholderImageUrl).toHaveBeenCalledWith('Game Title')
    expect(result).toBe('/placeholder-image-for-Game Title')
  })

  it('returns a placeholder image when url is undefined', () => {
    const result = getImageUrl(undefined as unknown as string, 'Another Game')
    expect(getSafePlaceholderImageUrl).toHaveBeenCalledWith('Another Game')
    expect(result).toBe('/placeholder-image-for-Another Game')
  })

  it('returns the url directly when it is a local path', () => {
    const localPath = '/uploads/games/image.jpg'
    const result = getImageUrl(localPath)

    expect(result).toBe(localPath)
  })

  it('returns a placeholder when an http url cannot be rendered safely', () => {
    const httpUrl = 'http://example.com/image.jpg'
    const result = getImageUrl(httpUrl, 'HTTP Game')

    expect(result).toBe('/placeholder-image-for-HTTP Game')
  })

  it('returns an unknown https remote url directly for native browser rendering', () => {
    const httpsUrl = 'https://example.com/image.jpg'
    const result = getImageUrl(httpsUrl)

    expect(result).toBe(httpsUrl)
  })

  it('returns a configured next/image remote url directly', () => {
    const imageUrl = 'https://images.igdb.com/igdb/image/upload/t_cover_big/game.jpg'
    const result = getImageUrl(imageUrl)

    expect(result).toBe(imageUrl)
  })

  it('supports wildcard configured next/image remote hosts', () => {
    const imageUrl = 'https://img.clerk.com/avatar.png'
    const result = getImageUrl(imageUrl)

    expect(result).toBe(imageUrl)
  })

  it('returns a placeholder image when the url format is invalid', () => {
    const invalidUrl = 'invalid-url-format'
    const result = getImageUrl(invalidUrl, 'Invalid URL Game')

    expect(getSafePlaceholderImageUrl).toHaveBeenCalledWith('Invalid URL Game')
    expect(result).toBe('/placeholder-image-for-Invalid URL Game')
  })

  it('handles protocol-relative URLs correctly', () => {
    const protocolRelativeUrl = '//example.com/image.jpg'
    const result = getImageUrl(protocolRelativeUrl)

    expect(getSafePlaceholderImageUrl).toHaveBeenCalled()
    expect(result).toBe('/placeholder-image-for-unknown')
  })
})
