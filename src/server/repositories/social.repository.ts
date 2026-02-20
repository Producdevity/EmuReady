import { ResourceError } from '@/lib/errors'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, RelationshipStatus, RelationshipType, Role } from '@orm'
import { BaseRepository } from './base.repository'
import type { Prisma } from '@orm'

interface VisibilityContext {
  requestingUserId?: string
  requestingUserRole?: Role
}

export class SocialRepository extends BaseRepository {
  static readonly selects = {
    user: {
      id: true,
      name: true,
      profileImage: true,
      role: true,
      trustScore: true,
    } satisfies Prisma.UserSelect,
  } as const

  static readonly includes = {
    followerWithUser: {
      id: true,
      createdAt: true,
      follower: { select: SocialRepository.selects.user },
    } satisfies Prisma.UserFollowSelect,

    followingWithUser: {
      id: true,
      createdAt: true,
      following: { select: SocialRepository.selects.user },
    } satisfies Prisma.UserFollowSelect,

    relationshipWithUsers: {
      id: true,
      createdAt: true,
      sender: { select: SocialRepository.selects.user },
      receiver: { select: SocialRepository.selects.user },
    } satisfies Prisma.UserRelationshipSelect,

    listingFeedItem: {
      id: true,
      createdAt: true,
      author: { select: SocialRepository.selects.user },
      game: {
        select: { title: true, system: { select: { id: true, name: true, key: true } } },
      },
      device: {
        select: { modelName: true, brand: { select: { name: true } } },
      },
      emulator: { select: { name: true } },
      performance: { select: { label: true, rank: true, description: true } },
    } satisfies Prisma.ListingSelect,

    pcListingFeedItem: {
      id: true,
      createdAt: true,
      author: { select: SocialRepository.selects.user },
      game: {
        select: { title: true, system: { select: { id: true, name: true, key: true } } },
      },
      cpu: { select: { modelName: true, brand: { select: { name: true } } } },
      gpu: { select: { modelName: true, brand: { select: { name: true } } } },
      emulator: { select: { name: true } },
      performance: { select: { label: true, rank: true, description: true } },
    } satisfies Prisma.PcListingSelect,
  } as const

  // ─── Follow / Unfollow ──────────────────────────────────

  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw ResourceError.social.cannotFollowSelf()
    }

    await this.assertNotBlocked(currentUserId, targetUserId)

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, settings: { select: { allowFollows: true } } },
    })
    if (!target) throw ResourceError.user.notFound()
    if (!(target.settings?.allowFollows ?? true)) throw ResourceError.social.followsDisabled()

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userFollow.upsert({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: targetUserId,
            },
          },
          create: { followerId: currentUserId, followingId: targetUserId },
          update: {},
        }),
      'UserFollow',
    )
  }

  async unfollow(currentUserId: string, targetUserId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.userFollow.deleteMany({
          where: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        }),
      'UserFollow',
    )
  }

  async removeFollower(currentUserId: string, followerId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.userFollow.deleteMany({
          where: {
            followerId: followerId,
            followingId: currentUserId,
          },
        }),
      'UserFollow',
    )
  }

  // ─── Follow Queries ─────────────────────────────────────

  async getFollowers(
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
  ) {
    if (ctx?.requestingUserId && ctx.requestingUserId !== userId) {
      await this.assertNotBlocked(ctx.requestingUserId, userId)
    }

    const isOwner = ctx?.requestingUserId === userId
    const isMod = hasRolePermission(ctx?.requestingUserRole, Role.MODERATOR)

    if (!isOwner && !isMod) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { settings: { select: { followersVisible: true } } },
      })
      if (user && !(user.settings?.followersVisible ?? true)) {
        return { items: [], pagination: paginate({ total: 0, page, limit }), hidden: true }
      }
    }

    const offset = calculateOffset({ page }, limit)
    const where: Prisma.UserFollowWhereInput = {
      followingId: userId,
      ...(search ? { follower: { name: { contains: search, mode: this.mode } } } : {}),
    }

    const [items, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where,
        select: SocialRepository.includes.followerWithUser,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.userFollow.count({ where }),
    ])

    return { items, pagination: paginate({ total, page, limit }), hidden: false }
  }

  async getFollowing(
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
  ) {
    if (ctx?.requestingUserId && ctx.requestingUserId !== userId) {
      await this.assertNotBlocked(ctx.requestingUserId, userId)
    }

    const isOwner = ctx?.requestingUserId === userId
    const isMod = hasRolePermission(ctx?.requestingUserRole, Role.MODERATOR)

    if (!isOwner && !isMod) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { settings: { select: { followingVisible: true } } },
      })
      if (user && !(user.settings?.followingVisible ?? true)) {
        return { items: [], pagination: paginate({ total: 0, page, limit }), hidden: true }
      }
    }

    const offset = calculateOffset({ page }, limit)
    const where: Prisma.UserFollowWhereInput = {
      followerId: userId,
      ...(search ? { following: { name: { contains: search, mode: this.mode } } } : {}),
    }

    const [items, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where,
        select: SocialRepository.includes.followingWithUser,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.userFollow.count({ where }),
    ])

    return { items, pagination: paginate({ total, page, limit }), hidden: false }
  }

  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
      select: { id: true },
    })

    return Boolean(follow)
  }

  async getBulkFollowStatuses(
    currentUserId: string,
    targetUserIds: string[],
  ): Promise<Record<string, boolean>> {
    const follows = await this.prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: targetUserIds },
      },
      select: { followingId: true },
    })

    const followSet = new Set(follows.map((f) => f.followingId))
    const statuses: Record<string, boolean> = {}
    for (const id of targetUserIds) {
      statuses[id] = followSet.has(id)
    }
    return statuses
  }

  async getFollowCounts(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.userFollow.count({ where: { followingId: userId } }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ])

    return { followersCount, followingCount }
  }

  // ─── Friend Requests ────────────────────────────────────

  async sendFriendRequest(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw ResourceError.social.cannotFriendSelf()
    }

    await this.assertNotBlocked(currentUserId, targetUserId)

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, settings: { select: { allowFriendRequests: true } } },
    })
    if (!target) throw ResourceError.user.notFound()
    if (!(target.settings?.allowFriendRequests ?? true))
      throw ResourceError.social.friendRequestsDisabled()

    const existing = await this.prisma.userRelationship.findFirst({
      where: {
        type: RelationshipType.FRIEND,
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
        status: { in: [RelationshipStatus.PENDING, RelationshipStatus.ACCEPTED] },
      },
      select: { id: true, status: true },
    })

    if (existing) {
      if (existing.status === RelationshipStatus.ACCEPTED) {
        throw ResourceError.social.alreadyFriends()
      }
      throw ResourceError.social.friendRequestPending()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userRelationship.create({
          data: {
            senderId: currentUserId,
            receiverId: targetUserId,
            type: RelationshipType.FRIEND,
            status: RelationshipStatus.PENDING,
          },
        }),
      'UserRelationship',
    )
  }

  async respondFriendRequest(currentUserId: string, requestId: string, accept: boolean) {
    const request = await this.prisma.userRelationship.findUnique({
      where: { id: requestId },
      select: { id: true, senderId: true, receiverId: true, status: true },
    })

    if (!request) throw ResourceError.social.friendRequestNotFound()

    if (request.receiverId !== currentUserId) {
      throw ResourceError.social.canOnlyRespondToOwnRequests()
    }

    if (request.status !== RelationshipStatus.PENDING) {
      throw ResourceError.social.requestAlreadyResponded()
    }

    await this.assertNotBlocked(request.senderId, currentUserId)

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userRelationship.update({
          where: { id: requestId },
          data: {
            status: accept ? RelationshipStatus.ACCEPTED : RelationshipStatus.DECLINED,
          },
        }),
      'UserRelationship',
    )
  }

  async getFriendRequests(
    currentUserId: string,
    direction: 'sent' | 'received',
    page: number,
    limit: number,
  ) {
    const offset = calculateOffset({ page }, limit)

    const where: Prisma.UserRelationshipWhereInput =
      direction === 'received'
        ? {
            receiverId: currentUserId,
            status: RelationshipStatus.PENDING,
            type: RelationshipType.FRIEND,
          }
        : {
            senderId: currentUserId,
            status: RelationshipStatus.PENDING,
            type: RelationshipType.FRIEND,
          }

    const [items, total] = await Promise.all([
      this.prisma.userRelationship.findMany({
        where,
        select: SocialRepository.includes.relationshipWithUsers,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.userRelationship.count({ where }),
    ])

    return { items, pagination: paginate({ total, page, limit }) }
  }

  async getFriends(
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
  ) {
    if (ctx?.requestingUserId && ctx.requestingUserId !== userId) {
      await this.assertNotBlocked(ctx.requestingUserId, userId)
    }

    const offset = calculateOffset({ page }, limit)

    const searchFilter = search ? { name: { contains: search, mode: this.mode } } : undefined
    const where: Prisma.UserRelationshipWhereInput = {
      type: RelationshipType.FRIEND,
      status: RelationshipStatus.ACCEPTED,
      OR: [
        { senderId: userId, ...(searchFilter ? { receiver: searchFilter } : {}) },
        { receiverId: userId, ...(searchFilter ? { sender: searchFilter } : {}) },
      ],
    }

    const [items, total] = await Promise.all([
      this.prisma.userRelationship.findMany({
        where,
        select: SocialRepository.includes.relationshipWithUsers,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.userRelationship.count({ where }),
    ])

    return { items, pagination: paginate({ total, page, limit }) }
  }

  async getRelationshipStatus(currentUserId: string, targetUserId: string) {
    const relationship = await this.prisma.userRelationship.findFirst({
      where: {
        type: RelationshipType.FRIEND,
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
        status: { in: [RelationshipStatus.PENDING, RelationshipStatus.ACCEPTED] },
      },
      select: { id: true, status: true, senderId: true },
    })

    if (!relationship) return { isFriend: false, pendingRequest: null }

    if (relationship.status === RelationshipStatus.ACCEPTED) {
      return { isFriend: true, pendingRequest: null }
    }

    return {
      isFriend: false,
      pendingRequest: {
        id: relationship.id,
        direction:
          relationship.senderId === currentUserId ? ('sent' as const) : ('received' as const),
      },
    }
  }

  // ─── Block / Unblock ────────────────────────────────────

  async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw ResourceError.social.cannotBlockSelf()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.$transaction(async (tx) => {
          await tx.userRelationship.deleteMany({
            where: {
              status: { not: RelationshipStatus.BLOCKED },
              OR: [
                { senderId: currentUserId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: currentUserId },
              ],
            },
          })

          await tx.userFollow.deleteMany({
            where: {
              OR: [
                { followerId: currentUserId, followingId: targetUserId },
                { followerId: targetUserId, followingId: currentUserId },
              ],
            },
          })

          return tx.userRelationship.upsert({
            where: {
              senderId_receiverId_type: {
                senderId: currentUserId,
                receiverId: targetUserId,
                type: RelationshipType.FRIEND,
              },
            },
            create: {
              senderId: currentUserId,
              receiverId: targetUserId,
              type: RelationshipType.FRIEND,
              status: RelationshipStatus.BLOCKED,
            },
            update: { status: RelationshipStatus.BLOCKED },
          })
        }),
      'UserRelationship',
    )
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.userRelationship.deleteMany({
          where: {
            senderId: currentUserId,
            receiverId: targetUserId,
            status: RelationshipStatus.BLOCKED,
          },
        }),
      'UserRelationship',
    )
  }

  // ─── Blocked Users ─────────────────────────────────────

  async getBlockedUsers(currentUserId: string, page: number, limit: number, search?: string) {
    const offset = calculateOffset({ page }, limit)

    const where: Prisma.UserRelationshipWhereInput = {
      senderId: currentUserId,
      status: RelationshipStatus.BLOCKED,
      ...(search ? { receiver: { name: { contains: search, mode: this.mode } } } : {}),
    }

    const [items, total] = await Promise.all([
      this.prisma.userRelationship.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          receiver: { select: SocialRepository.selects.user },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.userRelationship.count({ where }),
    ])

    return { items, pagination: paginate({ total, page, limit }) }
  }

  // ─── Activity Feed ──────────────────────────────────────

  async getActivityFeed(
    currentUserId: string,
    page: number,
    limit: number,
    options?: { scope?: 'following' | 'community'; type?: 'all' | 'listing' | 'pcListing' },
  ) {
    const scope = options?.scope ?? 'following'
    const type = options?.type ?? 'all'

    let authorFilter: Prisma.ListingWhereInput['authorId'] | undefined
    let pcAuthorFilter: Prisma.PcListingWhereInput['authorId'] | undefined

    if (scope === 'following') {
      const followedUsers = await this.prisma.userFollow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      })
      const followedIds = followedUsers.map((f) => f.followingId)

      if (followedIds.length === 0) {
        return { items: [], pagination: paginate({ total: 0, page, limit }) }
      }

      authorFilter = { in: followedIds }
      pcAuthorFilter = { in: followedIds }
    }

    const blockedRelations = await this.prisma.userRelationship.findMany({
      where: {
        status: RelationshipStatus.BLOCKED,
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      },
      select: { senderId: true, receiverId: true },
    })
    const blockedIds = [
      ...new Set(
        blockedRelations.map((r) => (r.senderId === currentUserId ? r.receiverId : r.senderId)),
      ),
    ]

    const activityFilter = {
      author: { settings: { showActivityInFeed: true } },
      ...(blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {}),
    }

    const offset = calculateOffset({ page }, limit)
    const fetchCount = offset + limit

    const listingWhere = {
      ...(authorFilter ? { authorId: authorFilter } : {}),
      status: ApprovalStatus.APPROVED,
      ...activityFilter,
    }
    const pcListingWhere = {
      ...(pcAuthorFilter ? { authorId: pcAuthorFilter } : {}),
      status: ApprovalStatus.APPROVED,
      ...activityFilter,
    }

    const [listings, pcListings, listingCount, pcListingCount] = await Promise.all([
      type === 'pcListing'
        ? Promise.resolve([])
        : this.prisma.listing.findMany({
            where: listingWhere,
            select: SocialRepository.includes.listingFeedItem,
            orderBy: { createdAt: 'desc' },
            take: fetchCount,
          }),
      type === 'listing'
        ? Promise.resolve([])
        : this.prisma.pcListing.findMany({
            where: pcListingWhere,
            select: SocialRepository.includes.pcListingFeedItem,
            orderBy: { createdAt: 'desc' },
            take: fetchCount,
          }),
      type === 'pcListing'
        ? Promise.resolve(0)
        : this.prisma.listing.count({ where: listingWhere }),
      type === 'listing'
        ? Promise.resolve(0)
        : this.prisma.pcListing.count({ where: pcListingWhere }),
    ])

    type FeedItem =
      | { type: 'listing'; data: (typeof listings)[number] }
      | { type: 'pcListing'; data: (typeof pcListings)[number] }

    const merged: FeedItem[] = [
      ...listings.map((l) => ({ type: 'listing' as const, data: l })),
      ...pcListings.map((l) => ({ type: 'pcListing' as const, data: l })),
    ].sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime())

    const paged = merged.slice(offset, offset + limit)
    const total = listingCount + pcListingCount

    return { items: paged, pagination: paginate({ total, page, limit }) }
  }

  // ─── Helpers ────────────────────────────────────────────

  private async assertNotBlocked(currentUserId: string, targetUserId: string) {
    const blocked = await this.prisma.userRelationship.findFirst({
      where: {
        status: RelationshipStatus.BLOCKED,
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
      },
      select: { id: true },
    })
    if (blocked) throw ResourceError.social.userBlocked()
  }
}
