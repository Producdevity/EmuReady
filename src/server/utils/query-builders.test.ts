import { describe, it, expect } from 'vitest'
import { ApprovalStatus, Role } from '@orm'
import {
  buildShadowBanFilter,
  buildApprovalStatusFilter,
  buildSearchFilter,
  buildNsfwFilter,
  combineWhereConditions,
  buildDateRangeFilter,
  buildArrayFilter,
  buildRelationFilter,
  buildExistenceFilter,
} from './query-builders'

describe('query-builders', () => {
  describe('buildShadowBanFilter', () => {
    it('should return undefined for moderators and above', () => {
      expect(buildShadowBanFilter(Role.MODERATOR)).toBeUndefined()
      expect(buildShadowBanFilter(Role.ADMIN)).toBeUndefined()
      expect(buildShadowBanFilter(Role.SUPER_ADMIN)).toBeUndefined()
    })

    it('should return shadow ban filter for regular users', () => {
      const filter = buildShadowBanFilter(Role.USER)
      expect(filter).toEqual({
        userBans: {
          none: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          },
        },
      })
    })

    it('should return shadow ban filter for unauthenticated users', () => {
      const filter = buildShadowBanFilter(null)
      expect(filter).toBeDefined()
    })
  })

  describe('buildApprovalStatusFilter', () => {
    it('should return undefined for admins without specific status', () => {
      expect(buildApprovalStatusFilter(Role.ADMIN)).toBeUndefined()
    })

    it('should return requested status for admins', () => {
      expect(buildApprovalStatusFilter(Role.ADMIN, null, ApprovalStatus.PENDING)).toEqual({
        status: ApprovalStatus.PENDING,
      })
    })

    it('should filter pending by user for non-admins', () => {
      const filter = buildApprovalStatusFilter(Role.USER, 'user123', ApprovalStatus.PENDING)
      expect(filter).toEqual({
        status: ApprovalStatus.PENDING,
        authorId: 'user123',
      })
    })

    it('should return approved + own pending for authenticated users', () => {
      const filter = buildApprovalStatusFilter(Role.USER, 'user123')
      expect(filter).toEqual([
        { status: ApprovalStatus.APPROVED },
        { status: ApprovalStatus.PENDING, authorId: 'user123' },
      ])
    })

    it('should return only approved for public users', () => {
      expect(buildApprovalStatusFilter(null, null)).toEqual({
        status: ApprovalStatus.APPROVED,
      })
    })
  })

  describe('buildSearchFilter', () => {
    it('should return undefined for empty search', () => {
      expect(buildSearchFilter('', ['title'])).toBeUndefined()
      expect(buildSearchFilter(null, ['title'])).toBeUndefined()
      expect(buildSearchFilter('   ', ['title'])).toBeUndefined()
    })

    it('should build simple search for single word', () => {
      const filter = buildSearchFilter('test', ['title', 'description'])
      expect(filter).toEqual([
        { title: { contains: 'test', mode: 'insensitive' } },
        { description: { contains: 'test', mode: 'insensitive' } },
      ])
    })

    it('should build multi-word search with AND conditions', () => {
      const filter = buildSearchFilter('hello world', ['title'])
      expect(filter).toEqual([
        {
          AND: [
            { title: { contains: 'hello', mode: 'insensitive' } },
            { title: { contains: 'world', mode: 'insensitive' } },
          ],
        },
      ])
    })

    it('should handle nested fields', () => {
      const filter = buildSearchFilter('john', ['user.name', 'author.email'])
      expect(filter).toEqual([
        { user: { name: { contains: 'john', mode: 'insensitive' } } },
        { author: { email: { contains: 'john', mode: 'insensitive' } } },
      ])
    })

    it('should filter out short words in multi-word search', () => {
      const filter = buildSearchFilter('a test of search', ['title'])
      expect(filter).toEqual([
        {
          AND: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { title: { contains: 'of', mode: 'insensitive' } },
            { title: { contains: 'search', mode: 'insensitive' } },
          ],
        },
      ])
    })
  })

  describe('buildNsfwFilter', () => {
    it('should return filter when showNsfw is false', () => {
      expect(buildNsfwFilter(false)).toEqual({ isErotic: false })
    })

    it('should return undefined when showNsfw is true', () => {
      expect(buildNsfwFilter(true)).toBeUndefined()
    })

    it('should support custom field names', () => {
      expect(buildNsfwFilter(false, 'isAdult')).toEqual({ isAdult: false })
    })
  })

  describe('combineWhereConditions', () => {
    it('should return empty object for no conditions', () => {
      expect(combineWhereConditions([])).toEqual({})
      expect(combineWhereConditions([undefined])).toEqual({})
    })

    it('should return single condition without wrapping', () => {
      const condition = { status: 'active' }
      expect(combineWhereConditions([condition])).toEqual(condition)
    })

    it('should combine with AND by default', () => {
      const conditions = [{ status: 'active' }, { type: 'public' }]
      expect(combineWhereConditions(conditions)).toEqual({
        AND: conditions,
      })
    })

    it('should combine with OR when specified', () => {
      const conditions = [{ status: 'active' }, { status: 'pending' }]
      expect(combineWhereConditions(conditions, 'OR')).toEqual({
        OR: conditions,
      })
    })
  })

  describe('buildDateRangeFilter', () => {
    it('should return undefined for no dates', () => {
      expect(buildDateRangeFilter()).toBeUndefined()
    })

    it('should handle start date only', () => {
      const date = new Date('2024-01-01')
      expect(buildDateRangeFilter(date)).toEqual({
        createdAt: { gte: date },
      })
    })

    it('should handle end date only', () => {
      const date = new Date('2024-12-31')
      expect(buildDateRangeFilter(null, date)).toEqual({
        createdAt: { lte: date },
      })
    })

    it('should handle date range', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-12-31')
      expect(buildDateRangeFilter(start, end)).toEqual({
        createdAt: { gte: start, lte: end },
      })
    })

    it('should support custom field names', () => {
      const date = new Date('2024-01-01')
      expect(buildDateRangeFilter(date, null, 'updatedAt')).toEqual({
        updatedAt: { gte: date },
      })
    })
  })

  describe('buildArrayFilter', () => {
    it('should return undefined for empty arrays', () => {
      expect(buildArrayFilter([], 'id')).toBeUndefined()
      expect(buildArrayFilter(null, 'id')).toBeUndefined()
    })

    it('should build IN filter for arrays', () => {
      const ids = ['1', '2', '3']
      expect(buildArrayFilter(ids, 'id')).toEqual({
        id: { in: ids },
      })
    })
  })

  describe('buildRelationFilter', () => {
    it('should build some filter by default', () => {
      const condition = { status: 'active' }
      expect(buildRelationFilter('posts', condition)).toEqual({
        posts: { some: condition },
      })
    })

    it('should support none filter', () => {
      const condition = { status: 'deleted' }
      expect(buildRelationFilter('posts', condition, 'none')).toEqual({
        posts: { none: condition },
      })
    })

    it('should support every filter', () => {
      const condition = { approved: true }
      expect(buildRelationFilter('posts', condition, 'every')).toEqual({
        posts: { every: condition },
      })
    })
  })

  describe('buildExistenceFilter', () => {
    it('should build exists filter', () => {
      expect(buildExistenceFilter('posts', true)).toEqual({
        posts: { some: {} },
      })
    })

    it('should build not exists filter', () => {
      expect(buildExistenceFilter('posts', false)).toEqual({
        posts: { none: {} },
      })
    })
  })
})
