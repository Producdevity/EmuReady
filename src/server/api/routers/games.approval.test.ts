import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInnerTRPCContext } from '@/server/api/trpc'
import { appRouter } from '@/server/api/root'
import { ApprovalStatus, Role } from '@orm'
import { TRPCError } from '@trpc/server'

// Mock Prisma at module level
vi.mock('@/server/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    system: {
      findUnique: vi.fn(),
    },
    game: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Import the mocked prisma
import { prisma } from '@/server/db'

// Use proper UUIDs
const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const mockAdminId = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
const mockSystemId = 'c3d4e5f6-a7b8-9012-cdef-345678901234'
const mockGameId = 'd4e5f6a7-b8c9-0123-def0-456789012345'

const mockUser = {
  id: mockUserId,
  email: 'user@example.com',
  name: 'Test User',
  role: Role.USER,
}

const mockAdmin = {
  id: mockAdminId,
  email: 'admin@example.com',
  name: 'Test Admin',
  role: Role.ADMIN,
}

const mockSystem = {
  id: mockSystemId,
  name: 'Test System',
  key: 'test-system' as string | null,
}

const mockGame = {
  id: mockGameId,
  title: 'Test Game',
  systemId: mockSystemId,
  status: ApprovalStatus.PENDING,
  submittedBy: mockUserId,
  submittedAt: new Date(),
  approvedBy: null,
  approvedAt: null,
  imageUrl: null,
  createdAt: new Date(),
}

describe('Games Router - Approval System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create game (user submission)', () => {
    it('should create game with PENDING status for regular users', async () => {
      // Setup mocks
      vi.mocked(prisma.system.findUnique).mockResolvedValue(mockSystem as any)
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue({
        ...mockGame,
        system: mockSystem,
        submitter: mockUser,
      } as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      const result = await userCaller.games.create({
        title: 'Test Game',
        systemId: mockSystemId,
      })

      expect(result.status).toBe(ApprovalStatus.PENDING)
      expect(result.submittedBy).toBe(mockUser.id)
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Game',
          systemId: mockSystemId,
          status: ApprovalStatus.PENDING,
          submittedBy: mockUser.id,
          submittedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })

    it('should create game with APPROVED status for admin users', async () => {
      // Setup mocks
      vi.mocked(prisma.system.findUnique).mockResolvedValue(mockSystem as any)
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue({
        ...mockGame,
        status: ApprovalStatus.APPROVED,
        submittedBy: mockAdminId,
        approvedBy: mockAdminId,
        approvedAt: new Date(),
        system: mockSystem,
        submitter: mockAdmin,
      } as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockAdmin },
      })
      const adminCaller = appRouter.createCaller(ctx)

      const result = await adminCaller.games.create({
        title: 'Test Game',
        systemId: mockSystemId,
      })

      expect(result.status).toBe(ApprovalStatus.APPROVED)
      expect(result.approvedBy).toBe(mockAdmin.id)
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: ApprovalStatus.APPROVED,
          submittedBy: mockAdmin.id,
          submittedAt: expect.any(Date),
          approvedBy: mockAdmin.id,
          approvedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('updateOwnPendingGame', () => {
    it('should allow users to edit their own pending games', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        ...mockGame,
        system: mockSystem,
      } as any)
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.update).mockResolvedValue({
        ...mockGame,
        title: 'Updated Game',
        system: mockSystem,
        submitter: mockUser,
      } as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      const result = await userCaller.games.updateOwnPendingGame({
        id: mockGameId,
        title: 'Updated Game',
        systemId: mockSystemId,
      })

      expect(result.title).toBe('Updated Game')
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: mockGameId },
        data: {
          title: 'Updated Game',
          systemId: mockSystemId,
        },
        include: expect.any(Object),
      })
    })

    it('should prevent users from editing games they do not own', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        ...mockGame,
        submittedBy: 'other-user-id',
        system: mockSystem,
      } as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      await expect(
        userCaller.games.updateOwnPendingGame({
          id: mockGameId,
          title: 'Updated Game',
          systemId: mockSystemId,
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should prevent users from editing approved games', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        ...mockGame,
        status: ApprovalStatus.APPROVED,
        system: mockSystem,
      } as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      await expect(
        userCaller.games.updateOwnPendingGame({
          id: mockGameId,
          title: 'Updated Game',
          systemId: mockSystemId,
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('approveGame (admin only)', () => {
    it('should approve pending games', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue(mockGame as any)

      const updatedGame = {
        ...mockGame,
        status: ApprovalStatus.APPROVED,
        approvedBy: mockAdminId,
        approvedAt: new Date(),
        system: mockSystem,
        submitter: mockUser,
        approver: mockAdmin,
      }

      // Mock $transaction to just execute the callback
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          // Create a mock transaction object with the game.update method
          const mockTx = {
            game: {
              update: vi.fn().mockResolvedValue(updatedGame),
            },
          }
          return await callback(mockTx)
        },
      )

      const ctx = createInnerTRPCContext({
        session: { user: mockAdmin },
      })
      const adminCaller = appRouter.createCaller(ctx)

      const result = await adminCaller.games.approveGame({
        id: mockGameId,
        status: ApprovalStatus.APPROVED,
      })

      expect(result.status).toBe(ApprovalStatus.APPROVED)
      expect(result.approvedBy).toBe(mockAdmin.id)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should reject pending games', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue(mockGame as any)

      const updatedGame = {
        ...mockGame,
        status: ApprovalStatus.REJECTED,
        approvedBy: mockAdminId,
        approvedAt: new Date(),
        system: mockSystem,
        submitter: mockUser,
        approver: mockAdmin,
      }

      // Mock $transaction to just execute the callback
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          // Create a mock transaction object with the game.update method
          const mockTx = {
            game: {
              update: vi.fn().mockResolvedValue(updatedGame),
            },
          }
          return await callback(mockTx)
        },
      )

      const ctx = createInnerTRPCContext({
        session: { user: mockAdmin },
      })
      const adminCaller = appRouter.createCaller(ctx)

      const result = await adminCaller.games.approveGame({
        id: mockGameId,
        status: ApprovalStatus.REJECTED,
      })

      expect(result.status).toBe(ApprovalStatus.REJECTED)
      expect(result.approvedBy).toBe(mockAdmin.id)
    })

    it('should prevent non-admin users from approving games', async () => {
      const ctx = createInnerTRPCContext({ session: { user: mockUser } })
      const userCaller = appRouter.createCaller(ctx)

      await expect(
        userCaller.games.approveGame({
          id: mockGameId,
          status: ApprovalStatus.APPROVED,
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should prevent approving already processed games', async () => {
      // Setup mocks
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        ...mockGame,
        status: ApprovalStatus.APPROVED,
      })

      const ctx = createInnerTRPCContext({
        session: { user: mockAdmin },
      })
      const adminCaller = appRouter.createCaller(ctx)

      await expect(
        adminCaller.games.approveGame({
          id: mockGameId,
          status: ApprovalStatus.APPROVED,
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('game visibility filtering', () => {
    it('should show approved games to public users', async () => {
      // Setup mocks
      vi.mocked(prisma.game.count).mockResolvedValue(1)
      vi.mocked(prisma.game.findMany).mockResolvedValue([
        {
          ...mockGame,
          status: ApprovalStatus.APPROVED,
          system: mockSystem,
        },
      ] as any)

      const ctx = createInnerTRPCContext({
        session: null,
      })
      const publicCaller = appRouter.createCaller(ctx)

      await publicCaller.games.get({})

      expect(prisma.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ApprovalStatus.APPROVED,
          }),
        }),
      )
    })

    it('should show approved games + own pending games to authenticated users', async () => {
      // Setup mocks
      vi.mocked(prisma.game.count).mockResolvedValue(2)
      vi.mocked(prisma.game.findMany).mockResolvedValue([
        {
          ...mockGame,
          status: ApprovalStatus.APPROVED,
          system: mockSystem,
        },
        {
          ...mockGame,
          id: 'game-2',
          status: ApprovalStatus.PENDING,
          submittedBy: mockUser.id,
          system: mockSystem,
        },
      ] as any)

      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      await userCaller.games.get({})

      expect(prisma.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { status: ApprovalStatus.APPROVED },
              {
                status: ApprovalStatus.PENDING,
                submittedBy: mockUser.id,
              },
            ],
          }),
        }),
      )
    })
  })

  describe('getGameStats (admin only)', () => {
    it('should return game approval statistics', async () => {
      // Setup mocks
      vi.mocked(prisma.game.count)
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(20) // approved
        .mockResolvedValueOnce(2) // rejected

      const ctx = createInnerTRPCContext({
        session: { user: mockAdmin },
      })
      const adminCaller = appRouter.createCaller(ctx)

      const result = await adminCaller.games.getGameStats()

      expect(result).toEqual({
        pending: 5,
        approved: 20,
        rejected: 2,
        total: 27,
      })
    })

    it('should prevent non-admin users from accessing stats', async () => {
      const ctx = createInnerTRPCContext({
        session: { user: mockUser },
      })
      const userCaller = appRouter.createCaller(ctx)

      await expect(userCaller.games.getGameStats()).rejects.toThrow(TRPCError)
    })
  })
})
