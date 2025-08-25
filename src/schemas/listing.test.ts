import { describe, it, expect } from 'vitest'
import { ApprovalStatus } from '@orm'
import {
  CreateListingSchema,
  GetListingsSchema,
  GetAllListingsAdminSchema,
  UpdateListingAdminSchema,
  RejectListingSchema,
  CreateCommentSchema,
  OverrideApprovalStatusSchema,
} from './listing'

describe('Listing Schemas - Null Handling', () => {
  describe('CreateListingSchema', () => {
    it('should accept null for optional fields', () => {
      const validInput = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: '123e4567-e89b-12d3-a456-426614174001',
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        performanceId: 5,
        notes: null,
        customFieldValues: null,
        recaptchaToken: null,
      }

      const result = CreateListingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBeNull()
        expect(result.data.customFieldValues).toBeNull()
        expect(result.data.recaptchaToken).toBeNull()
      }
    })

    it('should accept undefined for optional fields', () => {
      const validInput = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: '123e4567-e89b-12d3-a456-426614174001',
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        performanceId: 5,
      }

      const result = CreateListingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBeUndefined()
        expect(result.data.customFieldValues).toBeUndefined()
        expect(result.data.recaptchaToken).toBeUndefined()
      }
    })

    it('should reject invalid data types', () => {
      const invalidInput = {
        gameId: 'not-a-uuid',
        deviceId: '123e4567-e89b-12d3-a456-426614174001',
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        performanceId: 5,
      }

      const result = CreateListingSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should enforce max length on notes', () => {
      const invalidInput = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: '123e4567-e89b-12d3-a456-426614174001',
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        performanceId: 5,
        notes: 'a'.repeat(5001), // Exceeds 5000 character limit
      }

      const result = CreateListingSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('GetListingsSchema', () => {
    it('should accept null for all optional filter fields', () => {
      const validInput = {
        systemIds: null,
        deviceIds: null,
        socIds: null,
        emulatorIds: null,
        performanceIds: null,
        searchTerm: null,
        sortField: null,
        sortDirection: null,
        approvalStatus: null,
        myListings: null,
        page: 1,
        limit: 10,
      }

      const result = GetListingsSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.systemIds).toBeNull()
        expect(result.data.searchTerm).toBeNull()
        expect(result.data.sortDirection).toBeNull()
      }
    })

    it('should accept valid enum values', () => {
      const validInput = {
        page: 1,
        limit: 10,
        sortField: 'game.title',
        sortDirection: 'asc',
        approvalStatus: ApprovalStatus.APPROVED,
      }

      const result = GetListingsSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortField).toBe('game.title')
        expect(result.data.sortDirection).toBe('asc')
        expect(result.data.approvalStatus).toBe(ApprovalStatus.APPROVED)
      }
    })
  })

  describe('GetAllListingsAdminSchema', () => {
    it('should accept null for optional admin filter fields', () => {
      const validInput = {
        page: 1,
        limit: 20,
        sortField: null,
        sortDirection: null,
        search: null,
        statusFilter: null,
        systemFilter: null,
        emulatorFilter: null,
      }

      const result = GetAllListingsAdminSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortField).toBeNull()
        expect(result.data.sortDirection).toBeNull()
        expect(result.data.search).toBeNull()
        expect(result.data.statusFilter).toBeNull()
      }
    })

    it('should enforce minimum search string length when provided', () => {
      const invalidInput = {
        page: 1,
        limit: 20,
        search: '', // Empty string should fail min(1) validation
      }

      const result = GetAllListingsAdminSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should accept valid status filter', () => {
      const validInput = {
        page: 1,
        limit: 20,
        statusFilter: ApprovalStatus.PENDING,
      }

      const result = GetAllListingsAdminSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.statusFilter).toBe(ApprovalStatus.PENDING)
      }
    })
  })

  describe('UpdateListingAdminSchema', () => {
    it('should accept null for notes and customFieldValues', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        gameId: '123e4567-e89b-12d3-a456-426614174001',
        deviceId: '123e4567-e89b-12d3-a456-426614174002',
        emulatorId: '123e4567-e89b-12d3-a456-426614174003',
        performanceId: 5,
        status: ApprovalStatus.APPROVED,
        notes: null,
        customFieldValues: null,
      }

      const result = UpdateListingAdminSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBeNull()
        expect(result.data.customFieldValues).toBeNull()
      }
    })

    it('should validate custom field values structure', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        gameId: '123e4567-e89b-12d3-a456-426614174001',
        deviceId: '123e4567-e89b-12d3-a456-426614174002',
        emulatorId: '123e4567-e89b-12d3-a456-426614174003',
        performanceId: 5,
        status: ApprovalStatus.APPROVED,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174004',
            value: 'test value',
          },
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174005',
            value: true,
          },
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174006',
            value: 42,
          },
        ],
      }

      const result = UpdateListingAdminSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })
  })

  describe('RejectListingSchema', () => {
    it('should accept null for notes', () => {
      const validInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        notes: null,
      }

      const result = RejectListingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBeNull()
      }
    })

    it('should accept string for notes', () => {
      const validInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        notes: 'Rejection reason here',
      }

      const result = RejectListingSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBe('Rejection reason here')
      }
    })
  })

  describe('CreateCommentSchema', () => {
    it('should accept null for parentId and recaptchaToken', () => {
      const validInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'This is a comment',
        parentId: null,
        recaptchaToken: null,
      }

      const result = CreateCommentSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBeNull()
        expect(result.data.recaptchaToken).toBeNull()
      }
    })

    it('should enforce content length limits', () => {
      const invalidInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        content: '', // Too short
      }

      const result = CreateCommentSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)

      const tooLongInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'a'.repeat(1001), // Too long
      }

      const result2 = CreateCommentSchema.safeParse(tooLongInput)
      expect(result2.success).toBe(false)
    })
  })

  describe('OverrideApprovalStatusSchema', () => {
    it('should accept null for overrideNotes', () => {
      const validInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        newStatus: ApprovalStatus.APPROVED,
        overrideNotes: null,
      }

      const result = OverrideApprovalStatusSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overrideNotes).toBeNull()
      }
    })

    it('should require valid ApprovalStatus enum value', () => {
      const invalidInput = {
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        newStatus: 'INVALID_STATUS',
      }

      const result = OverrideApprovalStatusSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should accept all valid ApprovalStatus values', () => {
      const statuses = [ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]

      statuses.forEach((status) => {
        const input = {
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          newStatus: status,
        }

        const result = OverrideApprovalStatusSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.newStatus).toBe(status)
        }
      })
    })
  })
})
