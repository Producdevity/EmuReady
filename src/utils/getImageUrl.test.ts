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

  it('returns a proxied url when the url starts with http', () => {
    const httpUrl = 'http://example.com/image.jpg'
    const result = getImageUrl(httpUrl)

    expect(result).toBe(`/api/proxy-image?url=${encodeURIComponent(httpUrl)}`)
  })

  it('returns a proxied url when the url starts with https', () => {
    const httpsUrl = 'https://example.com/image.jpg'
    const result = getImageUrl(httpsUrl)

    expect(result).toBe(`/api/proxy-image?url=${encodeURIComponent(httpsUrl)}`)
  })

  it('returns a placeholder image when the url format is invalid', () => {
    const invalidUrl = 'invalid-url-format'
    const result = getImageUrl(invalidUrl, 'Invalid URL Game')

    expect(getSafePlaceholderImageUrl).toHaveBeenCalledWith('Invalid URL Game')
    expect(result).toBe('/placeholder-image-for-Invalid URL Game')
  })

  it('handles protocol-relative URLs correctly', () => {
    const protocolRelativeUrl = '//example.com/image.jpg'
    const result = getImageUrl(protocolRelativeUrl, null, { useProxy: true })

    expect(getSafePlaceholderImageUrl).toHaveBeenCalled()
    expect(result).toBe('/placeholder-image-for-unknown')
  })
})
