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

describe('requested mobile and fantasy-console platforms', () => {
  it.each(['Windows Phone', 'Microsoft Windows Phone', 'Windows Phone 8.1'])(
    'keeps %s separate from desktop Windows',
    (name) => {
      expect(getIGDBPlatformId(name)).toBe(74)
      expect(getIGDBPlatformId({ key: 'microsoft_windows_phone', name })).toBe(74)
      expect(getTGDBPlatformId(name)).toBeNull()
      expect(getRAWGPlatformId(name)).toBeNull()
      expect(
        buildGamesSearchQuery({
          query: 'Halo: Spartan Assault',
          platformId: getIGDBPlatformId(name),
          limit: 10,
          includeAllCategories: false,
        }),
      ).toContain('platforms = [74]')
    },
  )

  it.each(['PICO-8', 'PICO 8', 'PICO8'])(
    'recognizes %s without assigning an unrelated provider platform',
    (name) => {
      expect(systemNameToPlatformKey(name)).toBe('pico_8')
      expect(getIGDBPlatformId(name)).toBeNull()
      expect(getIGDBPlatformId({ key: 'pico_8', name })).toBeNull()
      expect(getTGDBPlatformId(name)).toBeNull()
      expect(getRAWGPlatformId(name)).toBeNull()
    },
  )

  it('retains desktop Windows provider mappings', () => {
    expect(getIGDBPlatformId('Microsoft Windows')).toBe(6)
    expect(getTGDBPlatformId('Microsoft Windows')).toBe(1)
    expect(getRAWGPlatformId('Microsoft Windows')).toBe(4)
  })
})
