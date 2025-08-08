import axios from 'axios'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import {
  searchGames,
  getGameDetails,
  getGameScreenshots,
  searchGameImages,
  RawgError,
} from './rawg'
import type { RawgGameResponse, RawgGameDetails, RawgScreenshotsResponse } from '@/types/rawg'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

const mockedAxios = vi.mocked(axios)

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
            platforms: [],
          },
        ],
      }

      vi.mocked(mockedAxios.get).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      })

      const result = await searchGames('test game')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.rawg.io/api/games'),
        expect.objectContaining({
          headers: {
            'User-Agent': 'EmuReady/1.0',
          },
        }),
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
            platforms: [],
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
            platforms: [],
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
            platforms: [],
          },
        ],
      }

      vi.mocked(mockedAxios.get).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      })

      const result = await searchGames('Super Mario Maker 2')

      // The exact match "Super Mario Maker 2" should be first
      expect(result.results[0].name).toBe('Super Mario Maker 2')
      expect(result.results[0].id).toBe(2)
    })

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: null,
        },
      }

      vi.mocked(mockedAxios.isAxiosError).mockReturnValue(true)
      vi.mocked(mockedAxios.get).mockRejectedValueOnce(mockError)

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
        stores: [],
      }

      vi.mocked(mockedAxios.get).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      })

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
            height: 1080,
          },
        ],
      }

      vi.mocked(mockedAxios.get).mockResolvedValueOnce({
        data: mockScreenshots,
        status: 200,
        statusText: 'OK',
      })

      const result = await getGameScreenshots(1)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.rawg.io/api/games/1/screenshots'),
        expect.any(Object),
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
            platforms: [],
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
            platforms: [],
          },
        ],
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
        stores: [],
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
        stores: [],
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
            height: 1080,
          },
        ],
      }

      vi.mocked(mockedAxios.get)
        // First call: searchGames
        .mockResolvedValueOnce({
          data: mockGamesResponse,
          status: 200,
          statusText: 'OK',
        })
        // Mock for game details calls
        .mockResolvedValueOnce({
          data: mockGame1Details,
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          data: mockGame2Details,
          status: 200,
          statusText: 'OK',
        })
        // Mock for screenshots calls
        .mockResolvedValueOnce({
          data: mockScreenshots,
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          data: mockScreenshots,
          status: 200,
          statusText: 'OK',
        })

      const result = await searchGameImages('test game')

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBeGreaterThan(0) // At least some games should have images

      // Check that we have images for at least one game
      const allImages = Array.from(result.values()).flat()
      expect(allImages.length).toBeGreaterThan(0)

      // Find any background image to verify structure
      const backgroundImage = allImages.find((img) => img.type === 'background')
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
