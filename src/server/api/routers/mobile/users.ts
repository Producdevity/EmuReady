import { AppError, ResourceError } from '@/lib/errors'
import { GetUserByIdSchema } from '@/schemas/user'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { roleIncludesRole } from '@/utils/permission-system'
import { ApprovalStatus, Role, Prisma } from '@orm'

export const mobileUsersRouter = createMobileTRPCRouter({
  /**
   * Get user profile by ID (public user profiles)
   */
  byId: mobilePublicProcedure.input(GetUserByIdSchema).query(async ({ ctx, input }) => {
    const {
      userId,
      listingsPage = 1,
      listingsLimit = 12,
      listingsSearch,
      listingsSystem,
      listingsEmulator,
      votesPage = 1,
      votesLimit = 12,
      votesSearch,
    } = input

    const mode = Prisma.QueryMode.insensitive

    // Check if user exists and get ban status
    const userWithBanStatus = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userBans: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true },
        },
      },
    })

    if (!userWithBanStatus) return ResourceError.user.notFound()

    // Check if user is banned and if current user can view banned profiles
    const isBanned = userWithBanStatus.userBans.length > 0
    const currentUserRole = ctx.session?.user?.role
    const canViewBannedUsers = roleIncludesRole(currentUserRole, Role.MODERATOR)

    if (isBanned && !canViewBannedUsers) {
      return AppError.forbidden('This user profile is not accessible.')
    }

    // Build where clauses for listings filtering
    const listingsWhere: Prisma.ListingWhereInput = {}

    // Filter by approval status based on user permissions
    if (canViewBannedUsers) {
      // Moderators can see all statuses including rejected
      // No additional filtering needed
    } else if (ctx.session?.user?.id === userId) {
      // Users can see their own approved and pending listings, but NOT rejected
      listingsWhere.status = {
        in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING],
      }
    } else {
      // Regular users (including signed out) can ONLY see approved listings from others
      listingsWhere.status = ApprovalStatus.APPROVED
    }

    if (listingsSearch) {
      listingsWhere.OR = [
        { game: { title: { contains: listingsSearch, mode } } },
        { device: { modelName: { contains: listingsSearch, mode } } },
        { emulator: { name: { contains: listingsSearch, mode } } },
      ]
    }
    if (listingsSystem) {
      listingsWhere.device = { brand: { name: listingsSystem } }
    }
    if (listingsEmulator) {
      listingsWhere.emulator = { name: listingsEmulator }
    }

    // Build where clause for votes filtering
    const votesWhere: Prisma.VoteWhereInput = {
      listing: { status: ApprovalStatus.APPROVED }, // Only show votes on approved listings
    }

    if (votesSearch) {
      votesWhere.listing = {
        status: ApprovalStatus.APPROVED,
        OR: [
          { game: { title: { contains: votesSearch, mode } } },
          { device: { modelName: { contains: votesSearch, mode } } },
          { emulator: { name: { contains: votesSearch, mode } } },
        ],
      }
    }

    // Calculate offsets
    const listingsOffset = (listingsPage - 1) * listingsLimit
    const votesOffset = (votesPage - 1) * votesLimit

    // TODO: if this code was public, I would be ashamed of it.
    // Fetch user data with paginated listings and votes
    const [user, listingsTotal, votesTotal] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          bio: true,
          profileImage: true,
          role: true,
          trustScore: true,
          createdAt: true,
          listings: {
            where: listingsWhere,
            select: {
              id: true,
              createdAt: true,
              status: true,
              device: {
                select: {
                  id: true,
                  modelName: true,
                  brand: { select: { id: true, name: true } },
                },
              },
              game: { select: { id: true, title: true } },
              emulator: { select: { id: true, name: true } },
              performance: { select: { id: true, label: true, rank: true } },
              _count: { select: { votes: true, comments: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: listingsOffset,
            take: listingsLimit,
          },
          votes: {
            where: votesWhere,
            select: {
              id: true,
              value: true,
              listing: {
                select: {
                  id: true,
                  device: {
                    select: {
                      id: true,
                      modelName: true,
                      brand: { select: { id: true, name: true } },
                    },
                  },
                  game: { select: { id: true, title: true } },
                  emulator: { select: { id: true, name: true } },
                  performance: {
                    select: { id: true, label: true, rank: true },
                  },
                },
              },
            },
            skip: votesOffset,
            take: votesLimit,
          },
          _count: {
            select: {
              listings: { where: listingsWhere },
              votes: { where: votesWhere },
              submittedGames: true,
            },
          },
        },
      }),
      ctx.prisma.listing.count({
        where: { ...listingsWhere, authorId: userId },
      }),
      ctx.prisma.vote.count({
        where: { ...votesWhere, userId },
      }),
    ])

    if (!user) return ResourceError.user.notFound()

    const listingsPages = Math.ceil(listingsTotal / listingsLimit)
    const votesPages = Math.ceil(votesTotal / votesLimit)

    return {
      ...user,
      pagination: {
        listings: {
          page: listingsPage,
          limit: listingsLimit,
          total: listingsTotal,
          pages: listingsPages,
        },
        votes: {
          page: votesPage,
          limit: votesLimit,
          total: votesTotal,
          pages: votesPages,
        },
      },
    }
  }),
})
