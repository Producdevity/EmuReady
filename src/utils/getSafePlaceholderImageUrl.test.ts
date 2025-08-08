import { describe, it, expect } from 'vitest'
import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'

describe('getSafePlaceholderImageUrl', () => {
  it('creates a placeholder URL with the title', () => {
    const title = 'Game Title'
    const result = getSafePlaceholderImageUrl(title)

    expect(result).toContain('/api/proxy-image?url=https://placehold.co/')
    expect(result).toContain(encodeURIComponent(title))
  })

  it('handles null or undefined title', () => {
    const resultNull = getSafePlaceholderImageUrl(null)
    const resultUndefined = getSafePlaceholderImageUrl(undefined)

    expect(resultNull).toContain('/api/proxy-image?url=https://placehold.co/')
    expect(resultNull).toContain(encodeURIComponent(''))

    expect(resultUndefined).toContain('/api/proxy-image?url=https://placehold.co/')
    expect(resultUndefined).toContain(encodeURIComponent(''))
  })

  it('removes non-printable ASCII characters', () => {
    const titleWithNonASCII = 'Game\u0000\u0001Title'
    const result = getSafePlaceholderImageUrl(titleWithNonASCII)

    expect(result).toContain(encodeURIComponent('GameTitle'))
    expect(result).not.toContain(encodeURIComponent('Game\u0000\u0001Title'))
  })

  it('removes potentially dangerous characters', () => {
    const titleWithDangerousChars = 'Game[Title](with)%dangerous/chars+'
    const result = getSafePlaceholderImageUrl(titleWithDangerousChars)

    expect(result).toContain(encodeURIComponent('GameTitlewithda'))
    expect(result).not.toContain(encodeURIComponent('['))
    expect(result).not.toContain(encodeURIComponent(']'))
    expect(result).not.toContain(encodeURIComponent('('))
    expect(result).not.toContain(encodeURIComponent(')'))
    expect(result).not.toContain(encodeURIComponent('%'))
    expect(result).not.toContain(encodeURIComponent('/'))
    expect(result).not.toContain(encodeURIComponent('+'))
  })

  it('trims whitespace from title', () => {
    const titleWithWhitespace = '  Game Title  '
    const result = getSafePlaceholderImageUrl(titleWithWhitespace)

    expect(result).toContain(encodeURIComponent('Game Title'))
    expect(result).not.toContain(encodeURIComponent('  Game Title  '))
  })

  it('limits title length to 15 characters', () => {
    const longTitle = 'This is a very long game title that exceeds the limit'
    const result = getSafePlaceholderImageUrl(longTitle)

    expect(result).toContain(encodeURIComponent('This is a very'))
    expect(result).not.toContain(encodeURIComponent('long'))
  })

  it('handles objects converted to strings', () => {
    const objectTitle = { toString: () => 'Object Title' } as unknown as string
    const result = getSafePlaceholderImageUrl(objectTitle)

    expect(result).toContain(encodeURIComponent('Object Title'))
  })
})
