import { describe, expect, it } from 'vitest'
import { buildGamesSearchQuery } from '@/server/igdb'
import {
  getIGDBPlatformId,
  getRAWGPlatformId,
  getTGDBPlatformId,
  systemNameToPlatformKey,
} from './system-platform-mapping'

describe('Nintendo Switch platform mappings', () => {
  it('maps the Switch 2 key to its own platform for game search', () => {
    const platformId = getIGDBPlatformId({ key: 'nintendo_switch_2', name: 'Nintendo Switch 2' })

    expect(platformId).toBe(508)
    expect(
      buildGamesSearchQuery({
        query: 'Mario Kart World',
        platformId,
        limit: 10,
        includeAllCategories: false,
      }),
    ).toContain('platforms = [508]')
  })

  it.each(['Nintendo Switch 2', ' Switch 2 '])('recognizes %s without a key', (name) => {
    expect(systemNameToPlatformKey(name)).toBe('nintendo_switch_2')
    expect(getIGDBPlatformId({ name, key: null })).toBe(508)
    expect(getTGDBPlatformId(name)).toBe(5021)
    expect(getRAWGPlatformId(name)).toBeNull()
  })

  it('keeps original Switch searches separate', () => {
    expect(getIGDBPlatformId('Nintendo Switch')).toBe(130)
    expect(getTGDBPlatformId('Nintendo Switch')).toBe(4971)
    expect(getRAWGPlatformId('Nintendo Switch')).toBe(7)
  })

  it('maps the existing Apple iOS system used by touchHLE', () => {
    expect(getIGDBPlatformId({ key: 'apple_ios', name: 'Apple iOS' })).toBe(39)
    expect(getTGDBPlatformId('Apple iOS')).toBe(4915)
    expect(getRAWGPlatformId('iOS')).toBe(3)
  })
})
