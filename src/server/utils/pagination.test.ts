import { describe, it, expect } from 'vitest'
import {
  paginate,
  paginatedResponse,
  buildOrderBy,
  buildSearchConditions,
  contains,
  resolvePagination,
} from './pagination'

type TestOrderBy = Record<string, unknown>

describe('pagination utilities', () => {
  describe('resolvePagination', () => {
    it('resolves page-based pagination to database offset', () => {
      expect(resolvePagination({ page: 3, limit: 25 })).toEqual({
        page: 3,
        limit: 25,
        offset: 50,
      })
    })

    it('resolves offset-based pagination back to the matching page', () => {
      expect(resolvePagination({ offset: 40, limit: 20 })).toEqual({
        page: 3,
        limit: 20,
        offset: 40,
      })
    })
  })

  describe('paginate', () => {
    it('should create pagination metadata with page', () => {
      const result = paginate({ total: 100, page: 3, limit: 10 })
      expect(result).toEqual({
        total: 100,
        pages: 10,
        page: 3,
        offset: 20,
        limit: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      })
    })

    it('should handle first page correctly', () => {
      const result = paginate({ total: 100, page: 1, limit: 10 })
      expect(result).toEqual({
        total: 100,
        pages: 10,
        page: 1,
        offset: 0,
        limit: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    })

    it('should handle last page correctly', () => {
      const result = paginate({ total: 100, page: 10, limit: 10 })
      expect(result).toEqual({
        total: 100,
        pages: 10,
        page: 10,
        offset: 90,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      })
    })

    it('should handle edge cases correctly', () => {
      // Empty results
      expect(paginate({ total: 0, page: 1, limit: 10 })).toEqual({
        total: 0,
        pages: 0,
        page: 1,
        offset: 0,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      })

      // Single item
      expect(paginate({ total: 1, page: 1, limit: 10 })).toEqual({
        total: 1,
        pages: 1,
        page: 1,
        offset: 0,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })
  })

  describe('paginatedResponse', () => {
    it('should create a complete paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const response = paginatedResponse({ items, total: 50, page: 2, limit: 10 })

      expect(response).toEqual({
        items,
        pagination: {
          total: 50,
          pages: 5,
          page: 2,
          offset: 10,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      })
    })
  })

  describe('buildOrderBy', () => {
    const sortConfig = {
      title: (dir: 'asc' | 'desc') => ({ title: dir }),
      'user.name': (dir: 'asc' | 'desc') => ({ user: { name: dir } }),
      device: (dir: 'asc' | 'desc') => [{ brand: { name: dir } }, { modelName: dir }],
    }

    it('should build orderBy from sort config', () => {
      expect(buildOrderBy<TestOrderBy>(sortConfig, 'title', 'asc')).toEqual([{ title: 'asc' }])

      expect(buildOrderBy<TestOrderBy>(sortConfig, 'user.name', 'desc')).toEqual([
        { user: { name: 'desc' } },
      ])

      expect(buildOrderBy<TestOrderBy>(sortConfig, 'device', 'asc')).toEqual([
        { brand: { name: 'asc' } },
        { modelName: 'asc' },
      ])
    })

    it('should return default orderBy when no sort specified', () => {
      const defaultOrderBy = { createdAt: 'desc' }
      expect(buildOrderBy<TestOrderBy>(sortConfig, undefined, undefined, defaultOrderBy)).toEqual([
        { createdAt: 'desc' },
      ])
    })

    it('should add default as secondary sort when sorting by different field', () => {
      const defaultOrderBy = { createdAt: 'desc' }
      expect(buildOrderBy<TestOrderBy>(sortConfig, 'title', 'asc', defaultOrderBy)).toEqual([
        { title: 'asc' },
        { createdAt: 'desc' },
      ])
    })

    it('should not duplicate createdAt when already sorting by it', () => {
      const sortConfigWithCreatedAt = {
        ...sortConfig,
        createdAt: (dir: 'asc' | 'desc') => ({ createdAt: dir }),
      }
      const defaultOrderBy = { createdAt: 'desc' }

      expect(
        buildOrderBy<TestOrderBy>(sortConfigWithCreatedAt, 'createdAt', 'asc', defaultOrderBy),
      ).toEqual([{ createdAt: 'asc' }])
    })
  })

  describe('buildOrderBy - Null Handling', () => {
    it('should handle null sortField correctly', () => {
      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
        name: (dir: 'asc' | 'desc') => ({ name: dir }),
      }

      const result = buildOrderBy<TestOrderBy>(sortConfig, null, 'asc', { createdAt: 'desc' })
      expect(result).toEqual([{ createdAt: 'desc' }])
    })

    it('should handle null sortDirection correctly', () => {
      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
      }

      const result = buildOrderBy<TestOrderBy>(sortConfig, 'title', null, { createdAt: 'desc' })
      expect(result).toEqual([{ createdAt: 'desc' }])
    })

    it('should handle both null sortField and sortDirection', () => {
      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
      }

      const result = buildOrderBy<TestOrderBy>(sortConfig, null, null, { createdAt: 'desc' })
      expect(result).toEqual([{ createdAt: 'desc' }])
    })

    it('should handle undefined values as null', () => {
      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
      }

      const result = buildOrderBy<TestOrderBy>(sortConfig, undefined, undefined, {
        createdAt: 'desc',
      })
      expect(result).toEqual([{ createdAt: 'desc' }])
    })

    it('should return empty array when no default and null values', () => {
      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
      }

      const result = buildOrderBy<TestOrderBy>(sortConfig, null, null)
      expect(result).toEqual([])
    })
  })

  describe('buildSearchConditions', () => {
    it('should build search conditions for multiple fields', () => {
      type SearchCondition =
        | { title: { contains: string } }
        | { description: { contains: string } }
        | { author: { name: { contains: string } } }

      const fields: ((term: string) => SearchCondition)[] = [
        (term: string) => ({ title: { contains: term } }),
        (term: string) => ({ description: { contains: term } }),
        (term: string) => ({ author: { name: { contains: term } } }),
      ]

      const conditions = buildSearchConditions('test', fields)

      expect(conditions).toEqual([
        { title: { contains: 'test' } },
        { description: { contains: 'test' } },
        { author: { name: { contains: 'test' } } },
      ])
    })
  })

  describe('contains', () => {
    it('should create contains condition for simple field', () => {
      expect(contains('title', 'test')).toEqual({
        title: { contains: 'test', mode: 'insensitive' },
      })
    })

    it('should create nested contains condition', () => {
      expect(contains('user.name', 'john')).toEqual({
        user: { name: { contains: 'john', mode: 'insensitive' } },
      })
    })

    it('should handle deeply nested fields', () => {
      expect(contains('game.system.name', 'Nintendo')).toEqual({
        game: {
          system: { name: { contains: 'Nintendo', mode: 'insensitive' } },
        },
      })
    })
  })
})
