import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockCheckSpamContent = vi.fn().mockResolvedValue(undefined)
const mockGetSubmissionBalance = vi.fn().mockResolvedValue({
  gamesCount: 0,
  listingsCount: 1,
  pcListingsCount: 0,
  totalListingsCount: 1,
  buffer: 2,
  canSubmitGame: true,
  reportsNeeded: 0,
})
const mockGameStatsCacheDelete = vi.fn()

vi.mock('@/server/utils/spam-check', () => ({
  checkSpamContent: (...args: unknown[]) => mockCheckSpamContent(...args),
}))

vi.mock('@/server/utils/submission-balance', () => ({
  getSubmissionBalance: (...args: unknown[]) => mockGetSubmissionBalance(...args),
}))

vi.mock('@/server/utils/cache', () => ({
  gameStatsCache: { delete: mockGameStatsCacheDelete, get: vi.fn(), set: vi.fn() },
}))

vi.mock('@/server/cache/invalidation', () => ({
  invalidateGame: vi.fn().mockResolvedValue(undefined),
  invalidateGameRelatedContent: vi.fn().mockResolvedValue(undefined),
  invalidateListPages: vi.fn().mockResolvedValue(undefined),
  invalidateSitemap: vi.fn().mockResolvedValue(undefined),
  revalidateByTag: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: {
    GAME_STATUS_APPROVED: 'GAME_STATUS_APPROVED',
    GAME_STATUS_REJECTED: 'GAME_STATUS_REJECTED',
    GAME_STATUS_OVERRIDDEN: 'GAME_STATUS_OVERRIDDEN',
  },
}))

vi.mock('@/lib/analytics', () => ({
  default: { performance: { errorOccurred: vi.fn() } },
}))

const { gamesRouter } = await import('./games')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const SYSTEM_ID = '00000000-0000-4000-a000-000000000010'
const GAME_ID = '00000000-0000-4000-a000-000000000020'

function createMockPrisma() {
  return {
    system: {
      findUnique: vi.fn().mockResolvedValue({ id: SYSTEM_ID, name: 'Nintendo Switch' }),
    },
    game: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: GAME_ID,
        title: 'Amazing!! This runs perfectly!!',
        systemId: SYSTEM_ID,
        status: ApprovalStatus.PENDING,
        system: { id: SYSTEM_ID, name: 'Nintendo Switch' },
        submitter: { id: USER_ID, name: 'Test User' },
      }),
    },
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(overrides: { role?: Role; prisma?: MockPrisma } = {}) {
  const prisma = overrides.prisma ?? createMockPrisma()
  return {
    caller: gamesRouter.createCaller({
      session: {
        user: {
          id: USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: overrides.role ?? Role.USER,
          permissions: [],
          showNsfw: false,
        },
      },
      prisma: prisma as never,
      headers: new Headers(),
    }),
    prisma,
  }
}

describe('games router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('passes a human verification token to the spam check when retrying game creation', async () => {
      const { caller, prisma } = createCaller()

      await caller.create({
        title: 'Amazing!! This runs perfectly!!',
        systemId: SYSTEM_ID,
        humanVerificationToken: 'verification-token',
      })

      expect(mockCheckSpamContent).toHaveBeenCalledWith({
        prisma,
        userId: USER_ID,
        content: 'Amazing!! This runs perfectly!!',
        entityType: 'game',
        challengeMode: 'challenge',
        enableRateLimiting: false,
        enableDuplicateDetection: false,
        humanVerificationToken: 'verification-token',
        headers: expect.any(Headers),
      })
      expect(prisma.game.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ humanVerificationToken: expect.anything() }),
        }),
      )
      expect(mockGameStatsCacheDelete).toHaveBeenCalled()
    })
  })
})
