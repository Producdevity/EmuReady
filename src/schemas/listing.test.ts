import { describe, it, expect } from 'vitest'
import { ApprovalStatus } from '@orm'
import {
  CreateListingSchema,
  GetListingsSchema,
  GetListingByIdSchema,
  GetProcessedSchema,
  OverrideApprovalStatusSchema,
  CreateVoteSchema,
  CreateCommentSchema,
  GetSortedCommentsSchema,
  RejectListingSchema,
} from './listing'

describe('Listing Schemas', () => {
  describe('CreateListingSchema', () => {
    const validData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      notes: 'Test notes',
      customFieldValues: [
        {
          customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003',
          value: 'test value',
        },
      ],
    }

    it('should validate valid data', () => {
      const result = CreateListingSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require valid UUIDs for gameId, deviceId, emulatorId', () => {
      const invalidIds = ['invalid-uuid', '', '123']

      invalidIds.forEach((invalidId) => {
        expect(
          CreateListingSchema.safeParse({ ...validData, gameId: invalidId })
            .success,
        ).toBe(false)
        expect(
          CreateListingSchema.safeParse({ ...validData, deviceId: invalidId })
            .success,
        ).toBe(false)
        expect(
          CreateListingSchema.safeParse({ ...validData, emulatorId: invalidId })
            .success,
        ).toBe(false)
      })
    })

    it('should require performanceId to be a number', () => {
      const result = CreateListingSchema.safeParse({
        ...validData,
        performanceId: 'not-a-number',
      })
      expect(result.success).toBe(false)
    })

    it('should allow optional notes', () => {
      const { notes, ...dataWithoutNotes } = validData
      const result = CreateListingSchema.safeParse(dataWithoutNotes)
      expect(result.success).toBe(true)
    })

    it('should allow optional customFieldValues', () => {
      const { customFieldValues, ...dataWithoutCustomFields } = validData
      const result = CreateListingSchema.safeParse(dataWithoutCustomFields)
      expect(result.success).toBe(true)
    })

    it('should validate customFieldValues structure', () => {
      // Test invalid UUID
      const invalidUuidResult = CreateListingSchema.safeParse({
        ...validData,
        customFieldValues: [
          { customFieldDefinitionId: 'invalid-uuid', value: 'test' },
        ],
      })
      expect(invalidUuidResult.success).toBe(false)

      // Test missing value - this passes because value can be any type including undefined
      const missingValueResult = CreateListingSchema.safeParse({
        ...validData,
        customFieldValues: [
          { customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003' },
        ],
      })
      expect(missingValueResult.success).toBe(true)
    })

    it('should accept various value types for custom fields', () => {
      const testCases = [
        { value: 'string value' },
        { value: 123 },
        { value: true },
        { value: false },
        { value: null },
        { value: { nested: 'object' } },
        { value: ['array', 'values'] },
      ]

      testCases.forEach((testCase) => {
        const result = CreateListingSchema.safeParse({
          ...validData,
          customFieldValues: [
            {
              customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003',
              ...testCase,
            },
          ],
        })
        expect(result.success).toBe(true)
      })
    })

    it('should handle empty customFieldValues array', () => {
      const result = CreateListingSchema.safeParse({
        ...validData,
        customFieldValues: [],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GetListingsSchema', () => {
    it('should validate with all optional fields', () => {
      const validData = {
        systemId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: '123e4567-e89b-12d3-a456-426614174001',
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        performanceId: 1,
        searchTerm: 'test search',
        page: 2,
        limit: 20,
        sortField: 'game.title',
        sortDirection: 'asc',
        approvalStatus: ApprovalStatus.APPROVED,
      }

      const result = GetListingsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should use default values', () => {
      const result = GetListingsSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should validate sortField enum values', () => {
      const validSortFields = [
        'game.title',
        'game.system.name',
        'device',
        'emulator.name',
        'performance.label',
        'successRate',
        'author.name',
        'createdAt',
      ]

      validSortFields.forEach((sortField) => {
        const result = GetListingsSchema.safeParse({ sortField })
        expect(result.success).toBe(true)
      })

      const result = GetListingsSchema.safeParse({ sortField: 'invalid-field' })
      expect(result.success).toBe(false)
    })

    it('should validate sortDirection enum values', () => {
      const validDirections = ['asc', 'desc', null]

      validDirections.forEach((sortDirection) => {
        const result = GetListingsSchema.safeParse({ sortDirection })
        expect(result.success).toBe(true)
      })

      const result = GetListingsSchema.safeParse({ sortDirection: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should validate approvalStatus enum values', () => {
      Object.values(ApprovalStatus).forEach((status) => {
        const result = GetListingsSchema.safeParse({ approvalStatus: status })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('GetListingByIdSchema', () => {
    it('should validate valid UUID', () => {
      const result = GetListingByIdSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = GetListingByIdSchema.safeParse({ id: 'invalid-uuid' })
      expect(result.success).toBe(false)
    })
  })

  describe('CreateVoteSchema', () => {
    it('should validate valid vote data', () => {
      const validData = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        value: true,
      }

      const result = CreateVoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate boolean values', () => {
      const validValues = [true, false]

      validValues.forEach((value) => {
        const result = CreateVoteSchema.safeParse({
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          value,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject non-boolean values', () => {
      const invalidValues = ['true', 1, 0, null, undefined]

      invalidValues.forEach((value) => {
        const result = CreateVoteSchema.safeParse({
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          value,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('CreateCommentSchema', () => {
    const validData = {
      listingId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'This is a test comment',
      parentId: '123e4567-e89b-12d3-a456-426614174001',
    }

    it('should validate valid comment data', () => {
      const result = CreateCommentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow comments without parentId', () => {
      const { parentId, ...dataWithoutParent } = validData
      const result = CreateCommentSchema.safeParse(dataWithoutParent)
      expect(result.success).toBe(true)
    })

    it('should enforce content length limits', () => {
      const shortContent = CreateCommentSchema.safeParse({
        ...validData,
        content: '',
      })
      expect(shortContent.success).toBe(false)

      const longContent = CreateCommentSchema.safeParse({
        ...validData,
        content: 'a'.repeat(1001),
      })
      expect(longContent.success).toBe(false)

      const validContent = CreateCommentSchema.safeParse({
        ...validData,
        content: 'a'.repeat(1000),
      })
      expect(validContent.success).toBe(true)
    })
  })

  describe('GetSortedCommentsSchema', () => {
    it('should validate valid sort options', () => {
      const validSortOptions = ['newest', 'oldest', 'popular']

      validSortOptions.forEach((sortBy) => {
        const result = GetSortedCommentsSchema.safeParse({
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          sortBy,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should use default sort value', () => {
      const result = GetSortedCommentsSchema.parse({
        listingId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.sortBy).toBe('newest')
    })

    it('should reject invalid sort options', () => {
      const result = GetSortedCommentsSchema.safeParse({
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        sortBy: 'invalid-sort',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('OverrideApprovalStatusSchema', () => {
    it('should validate valid override data', () => {
      const validData = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        newStatus: ApprovalStatus.APPROVED,
        overrideNotes: 'Override reason',
      }

      const result = OverrideApprovalStatusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow optional override notes', () => {
      const result = OverrideApprovalStatusSchema.safeParse({
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        newStatus: ApprovalStatus.REJECTED,
      })
      expect(result.success).toBe(true)
    })

    it('should validate all approval status values', () => {
      Object.values(ApprovalStatus).forEach((status) => {
        const result = OverrideApprovalStatusSchema.safeParse({
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          newStatus: status,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('RejectListingSchema', () => {
    it('should validate valid rejection data', () => {
      const validData = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        notes: 'Rejection reason',
      }

      const result = RejectListingSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow optional notes', () => {
      const result = RejectListingSchema.safeParse({
        listingId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GetProcessedSchema', () => {
    it('should validate with all fields', () => {
      const validData = {
        page: 2,
        limit: 20,
        filterStatus: ApprovalStatus.APPROVED,
      }

      const result = GetProcessedSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should use default values', () => {
      const result = GetProcessedSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })
  })
})
