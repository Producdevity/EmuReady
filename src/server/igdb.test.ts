import { describe, expect, it } from 'vitest'
import { buildGamesSearchQuery, DEFAULT_ALLOWED_GAME_TYPES } from './igdb'

describe('buildGamesSearchQuery', () => {
  it('includes platform filter and allowed categories by default', () => {
    const query = buildGamesSearchQuery({
      query: 'Apollo Justice: Ace Attorney Trilogy',
      platformId: 130,
      limit: 20,
      includeAllCategories: false,
    })

    expect(query).toContain('search "Apollo Justice: Ace Attorney Trilogy";')
    expect(query).toContain('platforms = [130]')
    expect(query).toContain(`game_type = (${DEFAULT_ALLOWED_GAME_TYPES.join(',')})`)
    expect(query.trim().endsWith('limit 20;')).toBe(true)
  })

  it('escapes double quotes in the query term', () => {
    const query = buildGamesSearchQuery({
      query: 'Ace Attorney "Collection"',
      platformId: null,
      limit: 10,
      includeAllCategories: false,
    })

    expect(query).toContain('search "Ace Attorney \\"Collection\\"";')
  })

  it('omits category filter when includeAllCategories is true', () => {
    const query = buildGamesSearchQuery({
      query: 'Phoenix Wright',
      platformId: undefined,
      limit: 15,
      includeAllCategories: true,
    })

    expect(query).not.toContain('game_type =')
    expect(query).toContain('limit 15;')
  })
})
