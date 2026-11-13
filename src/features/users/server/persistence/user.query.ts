import { type z } from 'zod'
import { type ProfileAccessResult } from '@/features/users/server/profile-access.service'
import {
  type GetUserByIdSchema,
  type GetAllUsersSchema,
  type SearchUsersSchema,
} from '@/features/users/shared/user.schemas'
import { buildOrderBy } from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { ROLE_HIERARCHY } from '@/utils/permission-system'
import { ApprovalStatus, Prisma } from '@orm'

export type ProfileVisibility = Extract<ProfileAccessResult, { accessible: true }>

export function profileActivityWhere(
  input: z.output<typeof GetUserByIdSchema>,
  visibility: ProfileVisibility,
) {
  const status = visibility.canViewBannedUsers
    ? undefined
    : visibility.isOwner
      ? { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] }
      : ApprovalStatus.APPROVED
  const game = visibility.showNsfw ? undefined : { isErotic: false }
  const listings: Prisma.ListingWhereInput = {
    authorId: input.userId,
    status,
    game,
    deviceId: input.listingsDevice || undefined,
    ...(input.listingsEmulator ? { emulator: { name: input.listingsEmulator } } : {}),
    OR: buildSearchFilter(input.listingsSearch, [
      'game.title',
      'device.modelName',
      'emulator.name',
    ]),
  }
  const pcListings: Prisma.PcListingWhereInput = {
    authorId: input.userId,
    status,
    game,
    OR: buildSearchFilter(input.pcListingsSearch, [
      'game.title',
      'emulator.name',
      'cpu.modelName',
      'gpu.modelName',
    ]),
  }
  const votes: Prisma.VoteWhereInput = {
    userId: input.userId,
    listing: {
      ...(visibility.canViewBannedUsers ? {} : { NOT: { status: ApprovalStatus.REJECTED } }),
      ...(game ? { game } : {}),
    },
    OR: buildSearchFilter(input.votesSearch, [
      'listing.game.title',
      'listing.device.modelName',
      'listing.emulator.name',
    ]),
  }
  return { listings, pcListings, votes }
}

export function adminUserQuery(input: z.output<typeof GetAllUsersSchema>) {
  const sortConfig = {
    name: (direction: Prisma.SortOrder) => ({ name: direction }),
    email: (direction: Prisma.SortOrder) => ({ email: direction }),
    role: (direction: Prisma.SortOrder) => ({ role: direction }),
    createdAt: (direction: Prisma.SortOrder) => ({ createdAt: direction }),
    listingsCount: (direction: Prisma.SortOrder) => ({ listings: { _count: direction } }),
    votesCount: (direction: Prisma.SortOrder) => ({ votes: { _count: direction } }),
    commentsCount: (direction: Prisma.SortOrder) => ({ comments: { _count: direction } }),
    trustScore: (direction: Prisma.SortOrder) => ({ trustScore: direction }),
    followersCount: (direction: Prisma.SortOrder) => ({ followers: { _count: direction } }),
    followingCount: (direction: Prisma.SortOrder) => ({ following: { _count: direction } }),
  }
  const where: Prisma.UserWhereInput = { OR: buildSearchFilter(input?.search, ['name', 'email']) }
  const orderBy = buildOrderBy<Prisma.UserOrderByWithRelationInput>(
    sortConfig,
    input?.sortField,
    input?.sortDirection,
    { createdAt: Prisma.SortOrder.desc },
  )
  return { where, orderBy }
}

export function userSearchWhere(input: z.output<typeof SearchUsersSchema>): Prisma.UserWhereInput {
  return {
    OR: buildSearchFilter(input.query, ['name', 'email']),
    ...(input.minRole
      ? { role: { in: ROLE_HIERARCHY.slice(ROLE_HIERARCHY.indexOf(input.minRole)) } }
      : {}),
  }
}
