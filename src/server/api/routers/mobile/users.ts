import { ResourceError } from '@/lib/errors'
import { GetUserByIdSchema } from '@/schemas/user'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import {
  checkProfileAccess,
  PRIVATE_PROFILE_SETTINGS,
} from '@/server/services/user-profile.service'
import { paginate } from '@/server/utils/pagination'
import { ApprovalStatus, Prisma } from '@orm'

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
      listingsDevice,
      listingsEmulator,
      votesPage = 1,
      votesLimit = 12,
      votesSearch,
    } = input

    const mode = Prisma.QueryMode.insensitive

    const access = await checkProfileAccess(ctx.prisma, userId, {
      currentUserId: ctx.session?.user?.id,
      currentUserRole: ctx.session?.user?.role,
      showNsfw: ctx.session?.user?.showNsfw,
    })

    if (!access.accessible) {
      if (access.reason === 'not_found') return ResourceError.user.notFound()
      if (access.reason === 'banned') return ResourceError.user.profileNotAccessible()

      // Private profile: return minimal data
      const minimalUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          profileImage: true,
          role: true,
          trustScore: true,
          createdAt: true,
        },
      })

      if (!minimalUser) return ResourceError.user.notFound()

      return {
        ...minimalUser,
        bio: null,
        listings: [],
        votes: [],
        _count: { listings: 0, votes: 0, submittedGames: 0 },
        pagination: {
          listings: paginate({ total: 0, page: listingsPage, limit: listingsLimit }),
          votes: paginate({ total: 0, page: votesPage, limit: votesLimit }),
        },
        ...PRIVATE_PROFILE_SETTINGS,
        limitedProfile: true,
      }
    }

    const { canViewBannedUsers, isOwner, isMod, showNsfw, privacySettings } = access

    // Build where clauses for listings filtering
    const listingsWhere: Prisma.ListingWhereInput = {}

    if (canViewBannedUsers) {
      // Moderators can see all statuses including rejected
    } else if (isOwner) {
      listingsWhere.status = {
        in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING],
      }
    } else {
      listingsWhere.status = ApprovalStatus.APPROVED
    }

    if (!showNsfw) {
      listingsWhere.game = { isErotic: false }
    }

    if (listingsSearch) {
      listingsWhere.OR = [
        { game: { title: { contains: listingsSearch, mode } } },
        { device: { modelName: { contains: listingsSearch, mode } } },
        { emulator: { name: { contains: listingsSearch, mode } } },
      ]
    }
    if (listingsDevice) {
      listingsWhere.deviceId = listingsDevice
    }
    if (listingsEmulator) {
      listingsWhere.emulator = { name: listingsEmulator }
    }

    // Determine if votes should be shown
    const showVotes = isOwner || isMod || privacySettings.showVotingActivity

    // Build where clause for votes filtering
    const votesWhere: Prisma.VoteWhereInput = {
      listing: {
        status: ApprovalStatus.APPROVED,
        ...(!showNsfw ? { game: { isErotic: false } } : {}),
      },
    }

    if (votesSearch) {
      votesWhere.listing = {
        status: ApprovalStatus.APPROVED,
        ...(!showNsfw ? { game: { isErotic: false } } : {}),
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
      showVotes ? ctx.prisma.vote.count({ where: { ...votesWhere, userId } }) : Promise.resolve(0),
    ])

    if (!user) return ResourceError.user.notFound()

    return {
      ...user,
      votes: showVotes ? user.votes : [],
      _count: {
        ...user._count,
        votes: showVotes ? user._count.votes : 0,
      },
      pagination: {
        listings: paginate({ total: listingsTotal, page: listingsPage, limit: listingsLimit }),
        votes: paginate({ total: votesTotal, page: votesPage, limit: votesLimit }),
      },
      ...privacySettings,
      limitedProfile: false,
    }
  }),
})
