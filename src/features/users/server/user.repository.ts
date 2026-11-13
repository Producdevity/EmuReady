import { type z } from 'zod'
import {
  type GetUserByIdSchema,
  type GetAllUsersSchema,
  type SearchUsersSchema,
} from '@/features/users/shared/user.schemas'
import { AppError, ResourceError } from '@/lib/errors'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import {
  aggregateContributions,
  getTopContributorsRaw,
  getUserContributionBreakdown,
  type ContributorTimeframe,
} from '@/server/services/contributors.service'
import { paginate, paginatedResponse } from '@/server/utils/pagination'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { Prisma, Role } from '@orm'
import {
  adminUserQuery,
  profileActivityWhere,
  userSearchWhere,
  type ProfileVisibility,
} from './persistence/user.query'
import * as selects from './persistence/user.selects'

type WriteContext = 'update' | 'delete'

export class UserRepository extends PrismaWriteRepository<WriteContext> {
  protected translateWriteError(error: unknown, action: WriteContext): never {
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
      throw ResourceError.user.notFound()
    }
    if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
      throw AppError.conflict('A user with this email or username already exists')
    }
    throw AppError.databaseError(`User ${action}`)
  }

  ownProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: selects.USER_OWN_PROFILE_SELECT,
    })
  }

  limitedProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: selects.USER_LIMITED_PROFILE_SELECT,
    })
  }

  publicProfile(input: z.output<typeof GetUserByIdSchema>, visibility: ProfileVisibility) {
    const votesWhere = profileActivityWhere({ ...input, votesSearch: undefined }, visibility).votes
    if (visibility.canViewBannedUsers) {
      return this.prisma.user.findUnique({
        where: { id: input.userId },
        select: selects.moderatorProfileSelect(new Date(), votesWhere),
      })
    }
    return this.prisma.user.findUnique({
      where: { id: input.userId },
      select: selects.publicProfileSelect(votesWhere),
    })
  }

  profileAccessRecord(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: selects.profileAccessSelect(new Date()),
    })
  }

  async profileReports(input: z.output<typeof GetUserByIdSchema>, visibility: ProfileVisibility) {
    const where = profileActivityWhere(input, visibility).listings
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        select: selects.USER_PROFILE_REPORT_SELECT,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        skip: (input.listingsPage - 1) * input.listingsLimit,
        take: input.listingsLimit,
      }),
      this.prisma.listing.count({ where }),
    ])
    return paginatedResponse({ items, total, page: input.listingsPage, limit: input.listingsLimit })
  }

  async profilePcReports(input: z.output<typeof GetUserByIdSchema>, visibility: ProfileVisibility) {
    const where = profileActivityWhere(input, visibility).pcListings
    const [items, total] = await Promise.all([
      this.prisma.pcListing.findMany({
        where,
        select: selects.USER_PROFILE_PC_REPORT_SELECT,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        skip: (input.pcListingsPage - 1) * input.pcListingsLimit,
        take: input.pcListingsLimit,
      }),
      this.prisma.pcListing.count({ where }),
    ])
    return paginatedResponse({
      items,
      total,
      page: input.pcListingsPage,
      limit: input.pcListingsLimit,
    })
  }

  async profileVotes(input: z.output<typeof GetUserByIdSchema>, visibility: ProfileVisibility) {
    const where = profileActivityWhere(input, visibility).votes
    const [items, total] = await Promise.all([
      this.prisma.vote.findMany({
        where,
        select: selects.USER_PROFILE_VOTE_SELECT,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        skip: (input.votesPage - 1) * input.votesLimit,
        take: input.votesLimit,
      }),
      this.prisma.vote.count({ where }),
    ])
    return paginatedResponse({ items, total, page: input.votesPage, limit: input.votesLimit })
  }

  async profileTrustActions(input: z.output<typeof GetUserByIdSchema>) {
    const where = { userId: input.userId }
    const [items, total] = await Promise.all([
      this.prisma.trustActionLog.findMany({
        where,
        select: selects.USER_PROFILE_TRUST_ACTION_SELECT,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        skip: (input.trustActionsPage - 1) * input.trustActionsLimit,
        take: input.trustActionsLimit,
      }),
      this.prisma.trustActionLog.count({ where }),
    ])
    return paginatedResponse({
      items,
      total,
      page: input.trustActionsPage,
      limit: input.trustActionsLimit,
    })
  }

  async profileFilterOptions(userId: string) {
    const [devices, emulators] = await Promise.all([
      this.prisma.listing.findMany({
        where: { authorId: userId },
        select: selects.USER_PROFILE_DEVICE_SELECT,
        distinct: ['deviceId'],
      }),
      this.prisma.listing.findMany({
        where: { authorId: userId },
        select: selects.USER_PROFILE_EMULATOR_SELECT,
        distinct: ['emulatorId'],
      }),
    ])
    return { devices, emulators }
  }

  async receivedReportVoteSummary(userId: string) {
    const groups = await Promise.all([
      this.prisma.vote.groupBy({
        by: ['value'],
        where: { listing: { authorId: userId } },
        _count: { _all: true },
      }),
      this.prisma.pcListingVote.groupBy({
        by: ['value'],
        where: { pcListing: { authorId: userId } },
        _count: { _all: true },
      }),
    ])
    return groups.flat().reduce(
      (totals, group) => ({
        total: totals.total + group._count._all,
        upvotes: totals.upvotes + (group.value ? group._count._all : 0),
        downvotes: totals.downvotes + (group.value ? 0 : group._count._all),
      }),
      { total: 0, upvotes: 0, downvotes: 0 },
    )
  }

  topContributors(timeframe: ContributorTimeframe, limit: number) {
    return getTopContributorsRaw(this.prisma, timeframe, limit)
  }

  lifetimeContributions(userIds: string[]) {
    return aggregateContributions(this.prisma, { userIds })
  }

  contributionBreakdown(userId: string) {
    return getUserContributionBreakdown(this.prisma, userId)
  }

  contributorUsers(userIds: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: selects.USER_CONTRIBUTOR_SELECT,
    })
  }

  updateSource(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: selects.USER_UPDATE_SOURCE_SELECT,
    })
  }

  emailOwner(email: string) {
    return this.prisma.user.findUnique({ where: { email }, select: { id: true } })
  }

  usernameOwner(name: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { name, id: { not: userId } },
      select: { id: true },
    })
  }

  updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return this.executeWrite(
      () =>
        this.prisma.user.update({
          where: { id: userId },
          data,
          select: selects.USER_UPDATE_RESULT_SELECT,
        }),
      'update',
    )
  }

  async listAdmin(input: z.output<typeof GetAllUsersSchema>) {
    const page = input?.page ?? 1
    const limit = input?.limit ?? 20
    const query = adminUserQuery(input)
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        ...query,
        select: selects.USER_ADMIN_LIST_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where: query.where }),
    ])
    return { users, pagination: paginate({ total, page, limit }) }
  }

  async statistics() {
    const [user, author, developer, moderator, admin, superAdmin, bannedUsers] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.user.count({ where: { role: Role.AUTHOR } }),
      this.prisma.user.count({ where: { role: Role.DEVELOPER } }),
      this.prisma.user.count({ where: { role: Role.MODERATOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
      this.prisma.user.count({
        where: {
          userBans: {
            some: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          },
        },
      }),
    ])
    return {
      total: user + author + developer + moderator + admin + superAdmin,
      byRole: { user, author, developer, moderator, admin, superAdmin },
      bannedUsers,
    }
  }

  roleChangeTarget(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: selects.USER_ROLE_TARGET_SELECT,
    })
  }

  deleteUser(userId: string) {
    return this.executeWrite(
      () => this.prisma.user.delete({ where: { id: userId }, select: { id: true } }),
      'delete',
    )
  }

  search(input: z.output<typeof SearchUsersSchema>) {
    return this.prisma.user.findMany({
      where: userSearchWhere(input),
      select: selects.USER_SEARCH_SELECT,
      orderBy: [{ name: Prisma.SortOrder.asc }, { email: Prisma.SortOrder.asc }],
      take: input.limit,
    })
  }

  async isVerifiedDeveloper(userId: string, emulatorId: string) {
    const developer = await this.prisma.verifiedDeveloper.findUnique({
      where: { userId_emulatorId: { userId, emulatorId } },
      select: { id: true },
    })
    return developer !== null
  }
}
