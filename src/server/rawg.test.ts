import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { searchGames, getGameDetails, getGameScreenshots, searchGameImages, RawgError } from './rawg'
import type { RawgGameResponse, RawgGameDetails, RawgScreenshotsResponse } from '@/types/rawg'

global.fetch = vi.fn()

describe('RAWG API', () => {
  beforeAll(() => {
    vi.stubEnv('RAWG_API_KEY', 'test-api-key')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchGames', () => {
    it('should search for games successfully', async () => {
      const mockResponse: RawgGameResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'Test Game',
            slug: 'test-game',
            background_image: 'https://example.com/image.jpg',
            released: '2024-01-01',
            rating: 4.5,
            ratings_count: 100,
            description_raw: 'Test description',
            genres: [],
            platforms: []
          }
        ]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await searchGames('test game')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.rawg.io/api/games'),
        expect.objectContaining({
          headers: {
            'User-Agent': 'EmuReady/1.0',
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should prioritize exact matches in search results', async () => {
      const mockResponse: RawgGameResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'Super Mario World: Super Mario Advance 2',
            slug: 'super-mario-world-super-mario-advance-2',
            background_image: 'https://example.com/image1.jpg',
            released: '2001-01-01',
            rating: 4.0,
            ratings_count: 50,
            description_raw: 'Remake description',
            genres: [],
            platforms: []
          },
          {
            id: 2,
            name: 'Super Mario Maker 2',
            slug: 'super-mario-maker-2',
            background_image: 'https://example.com/image2.jpg',
            released: '2019-01-01',
            rating: 4.8,
            ratings_count: 200,
            description_raw: 'Level creation game',
            genres: [],
            platforms: []
          },
          {
            id: 3,
            name: 'Super Mario Bros. 2',
            slug: 'super-mario-bros-2',
            background_image: 'https://example.com/image3.jpg',
            released: '1988-01-01',
            rating: 4.2,
            ratings_count: 150,
            description_raw: 'Classic platformer',
            genres: [],
            platforms: []
          }
        ]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await searchGames('Super Mario Maker 2')
      
      // The exact match "Super Mario Maker 2" should be first
      expect(result.results[0].name).toBe('Super Mario Maker 2')
      expect(result.results[0].id).toBe(2)
    })

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(searchGames('nonexistent')).rejects.toThrow(RawgError)
    })

    it('should throw error for empty query', async () => {
      await expect(searchGames('')).rejects.toThrow('Search query cannot be empty')
      await expect(searchGames('   ')).rejects.toThrow('Search query cannot be empty')
    })
  })

  describe('getGameDetails', () => {
    it('should get game details successfully', async () => {
      const mockResponse: RawgGameDetails = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        background_image: 'https://example.com/image.jpg',
        released: '2024-01-01',
        rating: 4.5,
        ratings_count: 100,
        description_raw: 'Test description',
        description: 'Test description HTML',
        website: 'https://testgame.com',
        metacritic: 85,
        genres: [],
        platforms: [],
        stores: []
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await getGameDetails(1)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getGameScreenshots', () => {
    it('should get game screenshots successfully', async () => {
      const mockScreenshots: RawgScreenshotsResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            image: 'https://example.com/screenshot.jpg',
            width: 1920,
            height: 1080
          }
        ]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockScreenshots,
      } as Response)

      const result = await getGameScreenshots(1)
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.rawg.io/api/games/1/screenshots'),
        expect.any(Object)
      )
      expect(result).toEqual(mockScreenshots)
    })
  })

  describe('searchGameImages', () => {
    it('should aggregate images from multiple games', async () => {
      const mockGamesResponse: RawgGameResponse = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'Test Game 1',
            slug: 'test-game-1',
            background_image: 'https://example.com/game1.jpg',
            released: '2024-01-01',
            rating: 4.5,
            ratings_count: 100,
            description_raw: 'Test description 1',
            genres: [],
            platforms: []
          },
          {
            id: 2,
            name: 'Test Game 2',
            slug: 'test-game-2',
            background_image: 'https://example.com/game2.jpg',
            released: '2024-01-02',
            rating: 4.0,
            ratings_count: 50,
            description_raw: 'Test description 2',
            genres: [],
            platforms: []
          }
        ]
      }

      const mockGame1Details: RawgGameDetails = {
        id: 1,
        name: 'Test Game 1',
        slug: 'test-game-1',
        background_image: 'https://example.com/game1.jpg',
        released: '2024-01-01',
        rating: 4.5,
        ratings_count: 100,
        description_raw: 'Test description 1',
        description: 'Full description 1',
        website: 'https://example.com',
        metacritic: 85,
        genres: [],
        platforms: [],
        stores: []
      }

      const mockGame2Details: RawgGameDetails = {
        id: 2,
        name: 'Test Game 2',
        slug: 'test-game-2',
        background_image: 'https://example.com/game2.jpg',
        released: '2024-01-02',
        rating: 4.0,
        ratings_count: 50,
        description_raw: 'Test description 2',
        description: 'Full description 2',
        website: 'https://example.com',
        metacritic: 80,
        genres: [],
        platforms: [],
        stores: []
      }

      const mockScreenshots: RawgScreenshotsResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            image: 'https://example.com/screenshot1.jpg',
            width: 1920,
            height: 1080
          }
        ]
      }

      // Mock the calls - the order may vary due to Promise.all
      // So we'll just mock multiple responses for each type
      vi.mocked(fetch)
        // First call: searchGames
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockGamesResponse,
        } as Response)
        // Subsequent calls will be getGameDetails and getGameScreenshots in any order
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async (url: any) => {
            // Return appropriate response based on URL pattern
            if (typeof url === 'string' && url.includes('/screenshots')) {
              return mockScreenshots
            } else if (typeof url === 'string' && url.includes('/games/1')) {
              return mockGame1Details
            } else if (typeof url === 'string' && url.includes('/games/2')) {
              return mockGame2Details
            }
            return mockGame1Details // fallback
          },
        } as Response)

      // Override the json method to check the actual URL from the fetch call
      vi.mocked(fetch).mockImplementation(async (url: any) => {
        const urlStr = url.toString()
        
        if (urlStr.includes('/games?')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockGamesResponse,
          } as Response
        } else if (urlStr.includes('/screenshots')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockScreenshots,
          } as Response
        } else if (urlStr.includes('/games/1')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockGame1Details,
          } as Response
        } else if (urlStr.includes('/games/2')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockGame2Details,
          } as Response
        }
        
        throw new Error(`Unexpected URL: ${urlStr}`)
      })

      const result = await searchGameImages('test game')
      
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBeGreaterThan(0) // At least some games should have images
      
      // Check that we have images for at least one game
      const allImages = Array.from(result.values()).flat()
      expect(allImages.length).toBeGreaterThan(0)
      
      // Find any background image to verify structure
      const backgroundImage = allImages.find(img => img.type === 'background')
      if (backgroundImage) {
        expect(backgroundImage).toMatchObject({
          type: 'background',
          source: 'rawg',
        })
        expect(backgroundImage.url).toMatch(/^https:\/\//)
        expect(backgroundImage.gameName).toBeTruthy()
      }
    })
  })
})

describe('RawgError', () => {
  it('should create error with message and optional details', () => {
    const error = new RawgError('Test error', 404, '/games')
    
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(404)
    expect(error.endpoint).toBe('/games')
    expect(error.name).toBe('RawgError')
  })
}) 