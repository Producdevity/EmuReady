import '@testing-library/jest-dom'
import { prettyDOM } from '@testing-library/dom'
import { cleanup, configure } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'

// This file is imported in vitest.config.mts
// It sets up the jest-dom matchers for better assertions in tests

// Set up test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock TypedSQL functions
vi.mock('@orm/sql', () => ({
  getTrendingDevices: vi.fn(() => ({ sql: 'getTrendingDevices', params: [] })),
  getTopContributors: vi.fn(() => ({ sql: 'getTopContributors', params: [] })),
}))

// Mock the entire Prisma client module to prevent database initialization
vi.mock('@orm', () => ({
  // Prisma namespace for raw SQL tagged templates
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: Array.from(strings),
      values,
      text: strings.join('?'),
    }),
  },
  PrismaClient: vi.fn().mockImplementation(() => ({
    $transaction: vi.fn(),
    $queryRawTyped: vi.fn().mockResolvedValue([]),
    customFieldDefinition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    listing: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    listingCustomFieldValue: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
  CustomFieldType: {
    TEXT: 'TEXT',
    TEXTAREA: 'TEXTAREA',
    URL: 'URL',
    BOOLEAN: 'BOOLEAN',
    SELECT: 'SELECT',
    RANGE: 'RANGE',
  },
  PcOs: {
    WINDOWS: 'WINDOWS',
    MAC_OS: 'MAC_OS',
    LINUX: 'LINUX',
    CHROME_OS: 'CHROME_OS',
  },
  ApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  PermissionCategory: {
    CONTENT: 'CONTENT',
    MODERATION: 'MODERATION',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    SYSTEM: 'SYSTEM',
  },
  Role: {
    USER: 'USER',
    AUTHOR: 'AUTHOR',
    DEVELOPER: 'DEVELOPER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
  },
  TrustAction: {
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
  },
  ReportReason: {
    INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
    SPAM: 'SPAM',
    MISLEADING_INFORMATION: 'MISLEADING_INFORMATION',
    FAKE_LISTING: 'FAKE_LISTING',
    COPYRIGHT_VIOLATION: 'COPYRIGHT_VIOLATION',
    OTHER: 'OTHER',
  },
  ReportStatus: {
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    RESOLVED: 'RESOLVED',
    DISMISSED: 'DISMISSED',
  },
  NotificationType: {
    COMMENT_ON_LISTING: 'COMMENT_ON_LISTING',
    REPLY_TO_COMMENT: 'REPLY_TO_COMMENT',
    USER_BANNED: 'USER_BANNED',
    USER_UNBANNED: 'USER_UNBANNED',
    REPORT_CREATED: 'REPORT_CREATED',
    REPORT_STATUS_CHANGED: 'REPORT_STATUS_CHANGED',
    VERIFIED_DEVELOPER: 'VERIFIED_DEVELOPER',
    LISTING_UPVOTED: 'LISTING_UPVOTED',
    LISTING_DOWNVOTED: 'LISTING_DOWNVOTED',
    COMMENT_UPVOTED: 'COMMENT_UPVOTED',
    COMMENT_DOWNVOTED: 'COMMENT_DOWNVOTED',
    WEEKLY_DIGEST: 'WEEKLY_DIGEST',
    MONTHLY_ACTIVE_BONUS: 'MONTHLY_ACTIVE_BONUS',

    LISTING_COMMENT: 'LISTING_COMMENT',
    LISTING_VOTE_UP: 'LISTING_VOTE_UP',
    LISTING_VOTE_DOWN: 'LISTING_VOTE_DOWN',
    COMMENT_REPLY: 'COMMENT_REPLY',
    USER_MENTION: 'USER_MENTION',

    NEW_DEVICE_LISTING: 'NEW_DEVICE_LISTING',
    NEW_SOC_LISTING: 'NEW_SOC_LISTING',
    GAME_ADDED: 'GAME_ADDED',
    EMULATOR_UPDATED: 'EMULATOR_UPDATED',

    MAINTENANCE_NOTICE: 'MAINTENANCE_NOTICE',
    FEATURE_ANNOUNCEMENT: 'FEATURE_ANNOUNCEMENT',
    POLICY_UPDATE: 'POLICY_UPDATE',

    LISTING_APPROVED: 'LISTING_APPROVED',
    LISTING_REJECTED: 'LISTING_REJECTED',
    CONTENT_FLAGGED: 'CONTENT_FLAGGED',
    ACCOUNT_WARNING: 'ACCOUNT_WARNING',
    ROLE_CHANGED: 'ROLE_CHANGED',
  },
  PermissionActionType: {
    PERMISSION_CREATED: 'PERMISSION_CREATED',
    PERMISSION_UPDATED: 'PERMISSION_UPDATED',
    PERMISSION_DELETED: 'PERMISSION_DELETED',
    ROLE_PERMISSION_ASSIGNED: 'ROLE_PERMISSION_ASSIGNED',
    ROLE_PERMISSION_REMOVED: 'ROLE_PERMISSION_REMOVED',
    USER_PERMISSION_ASSIGNED: 'USER_PERMISSION_ASSIGNED',
    USER_PERMISSION_REMOVED: 'USER_PERMISSION_REMOVED',
  },
  TailwindColor: {
    yellow: 'yellow',
    lime: 'lime',
    green: 'green',
    emerald: 'emerald',
    teal: 'teal',
    cyan: 'cyan',
    sky: 'sky',
    blue: 'blue',
    indigo: 'indigo',
    violet: 'violet',
    purple: 'purple',
    fuchsia: 'fuchsia',
    pink: 'pink',
    rose: 'rose',
    slate: 'slate',
    gray: 'gray',
    zinc: 'zinc',
    neutral: 'neutral',
    stone: 'stone',
  },
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ARCHIVE: 'ARCHIVE',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    ASSIGN: 'ASSIGN',
    UNASSIGN: 'UNASSIGN',
    BAN: 'BAN',
    UNBAN: 'UNBAN',
  },
  AuditEntityType: {
    USER: 'USER',
    USER_BAN: 'USER_BAN',
    LISTING: 'LISTING',
    PC_LISTING: 'PC_LISTING',
    GAME: 'GAME',
    PERMISSION: 'PERMISSION',
    COMMENT: 'COMMENT',
    REPORT: 'REPORT',
    EMULATOR: 'EMULATOR',
    OTHER: 'OTHER',
  },
}))

// Mock the database module to use a mock prisma client
vi.mock('../server/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    customFieldDefinition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    listing: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    listingCustomFieldValue: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}))

// Mock tRPC to prevent initialization issues
vi.mock('../server/api/trpc', () => ({
  createTRPCRouter: vi.fn((routes) => ({
    createCaller: vi.fn((_ctx) => {
      const caller: Record<string, unknown> = {}
      Object.keys(routes).forEach((key) => {
        if (typeof routes[key] === 'function') {
          caller[key] = routes[key]
        }
      })
      return caller
    }),
    _def: {
      procedures: routes,
    },
  })),
  publicProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn(),
    query: vi.fn(),
  },
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn(),
    query: vi.fn(),
  },
  authorProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn(),
    query: vi.fn(),
  },
  adminProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn(),
    query: vi.fn(),
  },
  superAdminProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn(),
    query: vi.fn(),
  },
  createInnerTRPCContext: vi.fn((opts) => ({
    session: opts?.session ?? null,
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      game: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      listing: {
        findMany: vi.fn(),
      },
    },
  })),
}))

// Mock the app router with the expected structure
vi.mock('../server/api/root', () => ({
  appRouter: {
    createCaller: vi.fn(() => ({
      games: {
        create: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        updateOwnPendingGame: vi.fn(),
        approveGame: vi.fn(),
        getGameStats: vi.fn(),
      },
      listings: {
        create: vi.fn(),
        get: vi.fn(),
      },
    })),
  },
}))

beforeEach(() => {
  // Clear all mocks and timers before each test
  vi.clearAllMocks()
  vi.clearAllTimers()
})

afterEach(() => {
  // Clean up React components
  cleanup()

  // Clean up any remaining timers
  vi.clearAllTimers()
  vi.clearAllMocks()
})

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia for responsive components - only if window is available
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
} else {
  // Create a minimal global matchMedia for cases where window is not available
  global.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Optimize React Testing Library
configure({
  // Reduce async utils timeout for faster tests
  asyncUtilTimeout: 5000,
  // Better error handling for clearer test failures
  getElementError: (message, container) => {
    const prettifiedDOM = prettyDOM(container)
    return new Error(
      [message, "Here's the DOM tree at the time of failure:", prettifiedDOM]
        .filter(Boolean)
        .join('\n\n'),
    )
  },
})
