import { describe, expect, it } from 'vitest'
import { ApprovalStatus } from '@orm'
import {
  CreateCommentSchema,
  CreateListingSchema,
  GetAllListingsAdminSchema,
  GetListingsSchema,
  OverrideApprovalStatusSchema,
  RejectListingSchema,
  UpdateListingAdminSchema,
} from './listing'

describe('Listing schemas - null compatibility contracts', () => {
  it('keeps null and undefined optional fields distinct for create input', () => {
    const nullResult = CreateListingSchema.safeParse({
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 5,
      notes: null,
      customFieldValues: null,
    })

    expect(nullResult.success).toBe(true)
    if (nullResult.success) {
      expect(nullResult.data.notes).toBeNull()
      expect(nullResult.data.customFieldValues).toBeNull()
    }

    const undefinedResult = CreateListingSchema.safeParse({
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 5,
    })

    expect(undefinedResult.success).toBe(true)
    if (undefinedResult.success) {
      expect(undefinedResult.data.notes).toBeUndefined()
      expect(undefinedResult.data.customFieldValues).toBeUndefined()
    }
  })

  it('accepts null filter values from listing URLs', () => {
    const result = GetListingsSchema.safeParse({
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
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.systemIds).toBeNull()
      expect(result.data.searchTerm).toBeNull()
      expect(result.data.sortDirection).toBeNull()
    }
  })

  it('accepts null filter values from admin listing URLs', () => {
    const result = GetAllListingsAdminSchema.safeParse({
      page: 1,
      limit: 20,
      sortField: null,
      sortDirection: null,
      search: null,
      statusFilter: null,
      systemFilter: null,
      emulatorFilter: null,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortField).toBeNull()
      expect(result.data.sortDirection).toBeNull()
      expect(result.data.search).toBeNull()
      expect(result.data.statusFilter).toBeNull()
    }
  })

  it('accepts null editable fields for admin updates', () => {
    const result = UpdateListingAdminSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      gameId: '123e4567-e89b-12d3-a456-426614174001',
      deviceId: '123e4567-e89b-12d3-a456-426614174002',
      emulatorId: '123e4567-e89b-12d3-a456-426614174003',
      performanceId: 5,
      status: ApprovalStatus.APPROVED,
      notes: null,
      customFieldValues: null,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBeNull()
      expect(result.data.customFieldValues).toBeNull()
    }
  })

  it('accepts null moderator notes when rejecting or overriding a report', () => {
    const rejectResult = RejectListingSchema.safeParse({
      listingId: '123e4567-e89b-12d3-a456-426614174000',
      notes: null,
    })

    expect(rejectResult.success).toBe(true)
    if (rejectResult.success) expect(rejectResult.data.notes).toBeNull()

    const overrideResult = OverrideApprovalStatusSchema.safeParse({
      listingId: '123e4567-e89b-12d3-a456-426614174000',
      newStatus: ApprovalStatus.APPROVED,
      overrideNotes: null,
    })

    expect(overrideResult.success).toBe(true)
    if (overrideResult.success) expect(overrideResult.data.overrideNotes).toBeNull()
  })

  it('accepts null for top-level comment parentId', () => {
    const result = CreateCommentSchema.safeParse({
      listingId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'This is a comment',
      parentId: null,
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.parentId).toBeNull()
  })
})
