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
