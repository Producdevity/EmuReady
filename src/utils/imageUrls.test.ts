import { describe, expect, it } from 'vitest'
import {
  getGameImageUrlValidationError,
  getImageRenderMode,
  isKnownGameImageProviderUrl,
} from './imageUrls'

describe('imageUrls', () => {
  it('uses Next Image for local paths and configured remote hosts', () => {
    expect(getImageRenderMode('/uploads/games/image.jpg')).toBe('next-image')
    expect(getImageRenderMode('https://media.rawg.io/media/games/example.jpg')).toBe('next-image')
  })

  it('uses native browser image rendering for arbitrary HTTPS hosts', () => {
    expect(getImageRenderMode('https://example.com/image.jpg')).toBe('external-img')
  })

  it('rejects unsupported URL forms for app image rendering', () => {
    expect(getImageRenderMode('http://example.com/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('//example.com/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('not-a-url')).toBe('invalid')
  })

  it('classifies Next image hosts separately from game image providers', () => {
    expect(getImageRenderMode('https://img.clerk.com/avatar.png')).toBe('next-image')
    expect(isKnownGameImageProviderUrl('https://img.clerk.com/avatar.png')).toBe(false)
    expect(isKnownGameImageProviderUrl('https://images.igdb.com/igdb/image/upload/game.jpg')).toBe(
      true,
    )
  })

  it('allows verified store CDN hosts as known game image providers', () => {
    expect(
      isKnownGameImageProviderUrl(
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/header.jpg?t=1745363004',
      ),
    ).toBe(true)
    expect(
      isKnownGameImageProviderUrl(
        'https://cdn1.epicgames.com/offer/fn/EN_FNECO_36-00_Blade_2560x1440_2560x1440-f6621f69507135ac955fe3b0a3945aa1',
      ),
    ).toBe(true)
    expect(
      isKnownGameImageProviderUrl(
        'https://cdn2.unrealengine.com/egs-rocketleague-psyonixllc-g1a-03-1920x1080-2ed8a1689f61.jpg',
      ),
    ).toBe(true)
    expect(
      isKnownGameImageProviderUrl(
        'https://images.gog-statics.com/c75e674590b8947542c809924df30bbef2190341163dd08668e243c266be70c5_product_card_v2_mobile_slider_639.jpg',
      ),
    ).toBe(true)
  })

  it('blocks localhost and private address literals', () => {
    expect(getImageRenderMode('https://localhost/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://localhost./image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://app.localhost/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://app.localhost./image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://127.0.0.1/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://0177.0.0.1/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://2130706433/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://127.1/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://10.0.0.5/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://10.1/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://172.16.0.5/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://192.168.1.20/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[::1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[::ffff:127.0.0.1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[::ffff:7f00:1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[2002:0a00:1::]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[fc00::1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[fd00::1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://[fe80::1]/image.jpg')).toBe('invalid')
    expect(getImageRenderMode('https://example.com/image.jpg')).toBe('external-img')
    expect(getImageRenderMode('https://[::ffff:8.8.8.8]/image.jpg')).toBe('external-img')
  })

  it('returns user-facing validation errors for unsafe game image URLs', () => {
    expect(getGameImageUrlValidationError('')).toBeNull()
    expect(getGameImageUrlValidationError('https://example.com/image.jpg')).toBeNull()
    expect(getGameImageUrlValidationError('http://example.com/image.jpg')).toBe(
      'Image URL must use HTTPS.',
    )
    expect(getGameImageUrlValidationError('https://127.0.0.1/image.jpg')).toBe(
      'Image URL cannot point to localhost or a private network address.',
    )
    expect(getGameImageUrlValidationError('https://localhost./image.jpg')).toBe(
      'Image URL cannot point to localhost or a private network address.',
    )
    expect(getGameImageUrlValidationError('https://[::ffff:127.0.0.1]/image.jpg')).toBe(
      'Image URL cannot point to localhost or a private network address.',
    )
    expect(getGameImageUrlValidationError('https://example.com/image.svg')).toBe(
      'SVG game images are not allowed.',
    )
  })
})
