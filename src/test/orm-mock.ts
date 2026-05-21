// Mock for @orm module to provide Prisma enums and types for tests

import { vi } from 'vitest'

export const CustomFieldType = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  URL: 'URL',
  BOOLEAN: 'BOOLEAN',
  SELECT: 'SELECT',
} as const

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export const Role = {
  USER: 'USER',
  AUTHOR: 'AUTHOR',
  MODERATOR: 'MODERATOR',
  DEVELOPER: 'DEVELOPER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export const TrustAction = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  LISTING_CREATED: 'LISTING_CREATED',
  LISTING_APPROVED: 'LISTING_APPROVED',
  LISTING_REJECTED: 'LISTING_REJECTED',
  MONTHLY_ACTIVE_BONUS: 'MONTHLY_ACTIVE_BONUS',
  LISTING_RECEIVED_UPVOTE: 'LISTING_RECEIVED_UPVOTE',
  LISTING_RECEIVED_DOWNVOTE: 'LISTING_RECEIVED_DOWNVOTE',
  LISTING_DEVELOPER_VERIFIED: 'LISTING_DEVELOPER_VERIFIED',
  COMMENT_RECEIVED_UPVOTE: 'COMMENT_RECEIVED_UPVOTE',
  COMMENT_RECEIVED_DOWNVOTE: 'COMMENT_RECEIVED_DOWNVOTE',
  REPORT_CONFIRMED: 'REPORT_CONFIRMED',
  FALSE_REPORT: 'FALSE_REPORT',
  GAME_SUBMISSION_APPROVED: 'GAME_SUBMISSION_APPROVED',
  GAME_SUBMISSION_REJECTED: 'GAME_SUBMISSION_REJECTED',
  HELPFUL_COMMENT: 'HELPFUL_COMMENT',
  ADMIN_ADJUSTMENT_POSITIVE: 'ADMIN_ADJUSTMENT_POSITIVE',
  ADMIN_ADJUSTMENT_NEGATIVE: 'ADMIN_ADJUSTMENT_NEGATIVE',
  VOTE_NULLIFICATION_REVERSAL: 'VOTE_NULLIFICATION_REVERSAL',
  VOTE_CHANGE_REVERSAL: 'VOTE_CHANGE_REVERSAL',
} as const

// Type exports for TypeScript
export type CustomFieldType = keyof typeof CustomFieldType
export type ApprovalStatus = keyof typeof ApprovalStatus
export type Role = keyof typeof Role
export type TrustAction = keyof typeof TrustAction

// Mock Prisma types
export type Prisma = {
  TrustActionLogWhereInput: Record<string, unknown>
  [key: string]: unknown
}

// Mock PrismaClient
export class PrismaClient {
  constructor() {}

  $transaction = vi.fn()
  $disconnect = vi.fn()

  user = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  }

  listing = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }

  trustActionLog = {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  }

  customFieldDefinition = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  }

  listingCustomFieldValue = {
    create: vi.fn(),
  }
}

const ormMock = {
  PrismaClient,
  CustomFieldType,
  ApprovalStatus,
  Role,
  TrustAction,
}

export default ormMock
