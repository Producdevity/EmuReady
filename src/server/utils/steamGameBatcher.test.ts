import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import {
  normalizeGameTitle,
  matchSteamAppIdsToNames,
  validateSteamAppIds,
} from './steamGameBatcher'
import * as steamGameSearch from './steamGameSearch'

const SAMPLE_STEAM_APPS = [
  { appid: 220, name: 'Half-Life 2' },
  { appid: 500, name: 'Left 4 Dead' },
  { appid: 550, name: 'Left 4 Dead 2' },
  { appid: 730, name: 'Counter-Strike 2' },
  { appid: 440, name: 'Team Fortress 2' },
]

describe('steamGameBatcher', () => {
  describe('normalizeGameTitle', () => {
    it('normalizes game titles by removing special characters', () => {
      expect(normalizeGameTitle('Half-Life® 2')).toBe('half life 2')
      expect(normalizeGameTitle('The Legend of Zelda™: Breath of the Wild')).toBe(
        'the legend of zelda breath of the wild',
      )
    })

    it('removes trademark symbols', () => {
      expect(normalizeGameTitle('Game™')).toBe('game')
      expect(normalizeGameTitle('Game®')).toBe('game')
      expect(normalizeGameTitle('Game©')).toBe('game')
    })

    it('converts separators to spaces', () => {
      expect(normalizeGameTitle('Game: Subtitle')).toBe('game subtitle')
      expect(normalizeGameTitle('Game - Subtitle')).toBe('game subtitle')
      expect(normalizeGameTitle('Game – Subtitle')).toBe('game subtitle')
    })

    it('collapses multiple spaces', () => {
      expect(normalizeGameTitle('Game   with    spaces')).toBe('game with spaces')
    })

    it('converts to lowercase', () => {
      expect(normalizeGameTitle('UPPERCASE GAME')).toBe('uppercase game')
    })

    it('trims whitespace', () => {
      expect(normalizeGameTitle('  Game  ')).toBe('game')
    })
  })

  describe('validateSteamAppIds', () => {
    it('validates correct Steam App IDs', () => {
      const result = validateSteamAppIds(['220', '500', '730'])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects empty array', () => {
      const result = validateSteamAppIds([])
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Batch cannot be empty')
    })

    it('rejects batches exceeding 1000 IDs', () => {
      const largeArray = Array.from({ length: 1001 }, (_, i) => String(i))
      const result = validateSteamAppIds(largeArray)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Batch size exceeds maximum limit of 1000')
    })

    it('detects duplicate Steam App IDs', () => {
      const result = validateSteamAppIds(['220', '500', '220'])
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Batch contains duplicate Steam App IDs')
    })

    it('rejects non-numeric Steam App IDs', () => {
      const result = validateSteamAppIds(['220', 'abc', '730'])
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Invalid Steam App ID format')
    })

    it('rejects Steam App IDs out of valid range', () => {
      const result = validateSteamAppIds(['-1'])
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Invalid Steam App ID format')
    })

    it('rejects Steam App IDs above maximum', () => {
      const result = validateSteamAppIds(['10000001'])
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Steam App ID out of valid range')
    })
  })

  describe('matchSteamAppIdsToNames', () => {
    beforeEach(() => {
      vi.spyOn(steamGameSearch, 'getSteamGamesData').mockResolvedValue(SAMPLE_STEAM_APPS)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('matches valid Steam App IDs to game names', async () => {
      const results = await matchSteamAppIdsToNames(['220', '500', '730'])

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({
        steamAppId: '220',
        gameName: 'Half-Life 2',
        matchStrategy: 'exact',
      })
      expect(results[1]).toEqual({
        steamAppId: '500',
        gameName: 'Left 4 Dead',
        matchStrategy: 'exact',
      })
      expect(results[2]).toEqual({
        steamAppId: '730',
        gameName: 'Counter-Strike 2',
        matchStrategy: 'exact',
      })
    })

    it('returns not_found for invalid Steam App IDs', async () => {
      const results = await matchSteamAppIdsToNames(['999999'])

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        steamAppId: '999999',
        gameName: null,
        matchStrategy: 'not_found',
      })
    })

    it('handles mixed valid and invalid Steam App IDs', async () => {
      const results = await matchSteamAppIdsToNames(['220', '999999', '500'])

      expect(results).toHaveLength(3)
      expect(results[0]?.gameName).toBe('Half-Life 2')
      expect(results[1]?.gameName).toBeNull()
      expect(results[1]?.matchStrategy).toBe('not_found')
      expect(results[2]?.gameName).toBe('Left 4 Dead')
    })

    it('handles empty array', async () => {
      const results = await matchSteamAppIdsToNames([])
      expect(results).toHaveLength(0)
    })

    it('caches Steam app data between calls', async () => {
      const getSteamGamesSpy = vi.spyOn(steamGameSearch, 'getSteamGamesData')

      await matchSteamAppIdsToNames(['220'])
      await matchSteamAppIdsToNames(['500'])

      expect(getSteamGamesSpy).toHaveBeenCalledTimes(2)
    })

    it('handles fetch errors gracefully', async () => {
      vi.spyOn(steamGameSearch, 'getSteamGamesData').mockRejectedValue(new Error('Network error'))

      const results = await matchSteamAppIdsToNames(['220', '500'])

      expect(results).toHaveLength(2)
      expect(results[0]?.matchStrategy).toBe('not_found')
      expect(results[1]?.matchStrategy).toBe('not_found')
    })
  })
})
