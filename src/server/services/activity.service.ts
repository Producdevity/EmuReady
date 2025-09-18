import { subDays, subHours } from 'date-fns'
import { type TimeRange } from '@/schemas/activity'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role, ReportStatus, ApprovalStatus, type PrismaClient, type Prisma } from '@orm'

// Dashboard-specific constants
const PREVIEW_ITEMS_COUNT = 3
const HALF_LIMIT_DIVIDER = 2
const CONTENT_PREVIEW_LENGTH = 100
const PERCENTAGE_MULTIPLIER = 100
const FULL_PERCENTAGE = 100
const ZERO_PERCENTAGE = 0

// Activity result types - these are specific to the dashboard view
export namespace ActivityTypes {
  export type RecentUser = {
    id: string
    name: string | null
    email: string
    profileImage: string | null
    role: Role
    createdAt: Date
  }

  export type RecentListing = {
    id: string
    type: 'handheld' | 'pc'
    gameTitle: string
    gameId: string
    deviceName?: string
    cpuName?: string
    gpuName?: string
    authorName: string | null
    authorId: string
    status: ApprovalStatus
    createdAt: Date
  }

  export type RecentComment = {
    id: string
    content: string
    listingId: string
    listingType: 'handheld' | 'pc'
    gameTitle: string
    authorName: string | null
    authorId: string
    createdAt: Date
  }

  export type RecentReport = {
    id: string
    type: 'listing' | 'pcListing'
    targetId: string
    reason: string
    description: string | null
    reporterName: string | null
    reporterId: string
    status: ReportStatus
    createdAt: Date
  }

  export type RecentBan = {
    id: string
    userId: string
    userName: string | null
    reason: string | null
    bannedBy: string | null
    expiresAt: Date | null
    createdAt: Date
  }

  export type PendingApproval = {
    id: string
    type: 'game' | 'listing' | 'pcListing'
    title: string
    submittedBy: string | null
    submittedById: string
    createdAt: Date
  }

  export type PlatformStats = {
    newUsersCount: number
    newUsersChange: number // percentage
    newListingsCount: number
    newListingsChange: number // percentage
    newPcListingsCount: number
    newPcListingsChange: number // percentage
    activeReportsCount: number
    pendingApprovalsCount: number
    pendingGamesCount: number
    pendingListingsCount: number
    pendingPcListingsCount: number
  }
}

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Converts time range to a Date for filtering
   * @param timeRange - The time range to convert ('24h', '48h', or '7d')
   * @returns Date representing the start of the time range
   */
  private getDateRange(timeRange: TimeRange): Date {
    const now = new Date()
    switch (timeRange) {
      case '24h':
        return subHours(now, 24)
      case '48h':
        return subHours(now, 48)
      case '7d':
        return subDays(now, 7)
      default:
        return subHours(now, 24)
    }
  }

  /**
   * Retrieves recent users registered within the specified time range
   * @param timeRange - Time range to filter users
   * @param limit - Maximum number of users to return
   * @param userRole - Role of the requesting user for permission checks
   * @returns Array of recent users if user has MODERATOR+ role, empty array otherwise
   */
  async getRecentUsers(
    timeRange: TimeRange,
    limit: number,
    userRole?: Role,
  ): Promise<ActivityTypes.RecentUser[]> {
    // Only MODERATOR+ can see user registration data
    if (!roleIncludesRole(userRole, Role.MODERATOR)) return []

    const dateFrom = this.getDateRange(timeRange)

    return this.prisma.user.findMany({
      where: { createdAt: { gte: dateFrom } },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Retrieves recent listings based on user permissions
   * @param timeRange - Time range to filter listings
   * @param limit - Maximum number of listings to return
   * @param userRole - Role of the requesting user
   * @param userId - ID of the requesting user
   * @returns Combined array of handheld and PC listings sorted by creation date
   */
  async getRecentListings(
    timeRange: TimeRange,
    limit: number,
    userRole?: Role,
    userId?: string,
  ): Promise<ActivityTypes.RecentListing[]> {
    const dateFrom = this.getDateRange(timeRange)

    // Clear permission hierarchy
    const isModerator = roleIncludesRole(userRole, Role.MODERATOR)
    const isDeveloperOrHigher = roleIncludesRole(userRole, Role.DEVELOPER)
    const isDeveloperExactly = userRole === Role.DEVELOPER

    // Build where clause based on permissions
    const whereClause: Prisma.ListingWhereInput = { createdAt: { gte: dateFrom } }

    // Users below DEVELOPER only see approved listings
    if (!isDeveloperOrHigher) whereClause.status = ApprovalStatus.APPROVED

    // DEVELOPER role (not MODERATOR+) only sees their verified emulator listings
    if (isDeveloperExactly && userId) {
      whereClause.emulator = { verifiedDevelopers: { some: { userId } } }
    }

    // Non-moderators don't see content from banned users
    if (!isModerator) {
      whereClause.author = {
        userBans: {
          none: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      }
    }

    // Get counts first to determine optimal distribution
    const [handheldCount, pcCount] = await Promise.all([
      this.prisma.listing.count({ where: whereClause }),
      this.prisma.pcListing.count({ where: whereClause as Prisma.PcListingWhereInput }),
    ])

    const totalCount = handheldCount + pcCount
    const handheldLimit =
      totalCount > 0 ? Math.round((handheldCount / totalCount) * limit) : Math.ceil(limit / 2)
    const pcLimit = limit - handheldLimit

    // Fetch both handheld and PC listings with proper limits
    const [handheldListings, pcListings] = await Promise.all([
      this.prisma.listing.findMany({
        where: whereClause,
        select: {
          id: true,
          game: { select: { id: true, title: true } },
          device: { select: { modelName: true, brand: { select: { name: true } } } },
          author: { select: { id: true, name: true } },
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: handheldLimit,
      }),
      this.prisma.pcListing.findMany({
        where: whereClause as Prisma.PcListingWhereInput,
        select: {
          id: true,
          game: { select: { id: true, title: true } },
          cpu: { select: { modelName: true } },
          gpu: { select: { modelName: true } },
          author: { select: { id: true, name: true } },
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: pcLimit,
      }),
    ])

    // Combine and format results
    const combined: ActivityTypes.RecentListing[] = [
      ...handheldListings.map((listing) => ({
        id: listing.id,
        type: 'handheld' as const,
        gameTitle: listing.game.title,
        gameId: listing.game.id,
        deviceName: `${listing.device.brand.name} ${listing.device.modelName}`,
        cpuName: undefined,
        gpuName: undefined,
        authorName: listing.author.name,
        authorId: listing.author.id,
        status: listing.status,
        createdAt: listing.createdAt,
      })),
      ...pcListings.map((listing) => ({
        id: listing.id,
        type: 'pc' as const,
        gameTitle: listing.game.title,
        gameId: listing.game.id,
        deviceName: undefined,
        cpuName: listing.cpu?.modelName,
        gpuName: listing.gpu?.modelName,
        authorName: listing.author.name,
        authorId: listing.author.id,
        status: listing.status,
        createdAt: listing.createdAt,
      })),
    ]

    // Sort combined results by date and return
    return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  }

  /**
   * Retrieves recent comments based on user permissions
   * @param timeRange - Time range to filter comments
   * @param limit - Maximum number of comments to return
   * @param userRole - Role of the requesting user
   * @param userId - ID of the requesting user
   * @returns Array of recent comments with truncated content
   */
  async getRecentComments(
    timeRange: TimeRange,
    limit: number,
    userRole?: Role,
    userId?: string,
  ): Promise<ActivityTypes.RecentComment[]> {
    const dateFrom = this.getDateRange(timeRange)
    const canSeeAll = roleIncludesRole(userRole, Role.MODERATOR)
    const isDeveloper = userRole === Role.DEVELOPER

    const whereClause: Prisma.CommentWhereInput = {
      createdAt: { gte: dateFrom },
    }

    // Apply shadow ban filter for non-moderators
    if (!canSeeAll) {
      whereClause.user = {
        userBans: {
          none: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      }
    }

    // For developers, only show comments on their emulator listings
    if (isDeveloper && userId && !canSeeAll) {
      const verifiedEmulators = await this.prisma.verifiedDeveloper.findMany({
        where: { userId },
        select: { emulatorId: true },
      })
      const emulatorIds = verifiedEmulators.map((ve) => ve.emulatorId)

      if (emulatorIds.length === 0) return []

      whereClause.listing = {
        emulatorId: { in: emulatorIds },
      }
    }

    const comments = await this.prisma.comment.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        listingId: true,
        listing: { select: { game: { select: { title: true } } } },
        user: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return comments.map((c: (typeof comments)[0]) => ({
      id: c.id,
      content:
        c.content.substring(0, CONTENT_PREVIEW_LENGTH) +
        (c.content.length > CONTENT_PREVIEW_LENGTH ? '…' : ''),
      listingId: c.listingId,
      listingType: 'handheld' as const,
      gameTitle: c.listing.game.title,
      authorName: c.user.name,
      authorId: c.user.id,
      createdAt: c.createdAt,
    }))
  }

  /**
   * Retrieves recent reports for moderators
   * @param timeRange - Time range to filter reports
   * @param limit - Maximum number of reports to return
   * @param userRole - Role of the requesting user
   * @returns Array of recent unresolved reports, empty if user lacks permission
   */
  async getRecentReports(
    timeRange: TimeRange,
    limit: number,
    userRole?: Role,
  ): Promise<ActivityTypes.RecentReport[]> {
    // Only MODERATOR+ can see reports
    if (!roleIncludesRole(userRole, Role.MODERATOR)) {
      return []
    }

    const dateFrom = this.getDateRange(timeRange)
    const halfLimit = Math.ceil(limit / HALF_LIMIT_DIVIDER)

    // Fetch reports with database-level sorting
    const [listingReports, pcListingReports] = await Promise.all([
      this.prisma.listingReport.findMany({
        where: {
          createdAt: { gte: dateFrom },
          status: { not: ReportStatus.RESOLVED },
        },
        include: {
          reportedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: halfLimit,
      }),
      this.prisma.pcListingReport.findMany({
        where: {
          createdAt: { gte: dateFrom },
          status: { not: ReportStatus.RESOLVED },
        },
        include: {
          reportedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: halfLimit,
      }),
    ])

    // Combine results (already sorted from database)
    const combined: ActivityTypes.RecentReport[] = [
      ...listingReports.map((r: (typeof listingReports)[0]) => ({
        id: r.id,
        type: 'listing' as const,
        targetId: r.listingId,
        reason: r.reason,
        description: r.description,
        reporterName: r.reportedBy.name,
        reporterId: r.reportedBy.id,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...pcListingReports.map((r: (typeof pcListingReports)[0]) => ({
        id: r.id,
        type: 'pcListing' as const,
        targetId: r.pcListingId,
        reason: r.reason,
        description: r.description,
        reporterName: r.reportedBy.name,
        reporterId: r.reportedBy.id,
        status: r.status,
        createdAt: r.createdAt,
      })),
    ]

    // Final sort and limit (minimal in-memory sorting of already sorted subsets)
    return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  }

  /**
   * Retrieves recent user bans for moderators
   * @param timeRange - Time range to filter bans
   * @param limit - Maximum number of bans to return
   * @param userRole - Role of the requesting user
   * @returns Array of recent active bans, empty if user lacks permission
   */
  async getRecentBans(
    timeRange: TimeRange,
    limit: number,
    userRole?: Role,
  ): Promise<ActivityTypes.RecentBan[]> {
    // Only MODERATOR+ can see bans
    if (!roleIncludesRole(userRole, Role.MODERATOR)) {
      return []
    }

    const dateFrom = this.getDateRange(timeRange)

    const bans = await this.prisma.userBan.findMany({
      where: {
        createdAt: { gte: dateFrom },
        isActive: true,
      },
      include: {
        user: { select: { name: true } },
        bannedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return bans.map((b: (typeof bans)[0]) => ({
      id: b.id,
      userId: b.userId,
      userName: b.user.name,
      reason: b.reason,
      bannedBy: b.bannedBy?.name ?? null,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }))
  }

  /**
   * Retrieves pending items that need approval
   * @param userRole - Role of the requesting user
   * @param userId - ID of the requesting user
   * @returns Array of pending approvals based on user permissions
   */
  async getCriticalActions(
    userRole?: Role,
    userId?: string,
  ): Promise<ActivityTypes.PendingApproval[]> {
    const canSeeAll = roleIncludesRole(userRole, Role.MODERATOR)
    const canSeePending = roleIncludesRole(userRole, Role.DEVELOPER)
    const isDeveloper = userRole === Role.DEVELOPER

    const results: ActivityTypes.PendingApproval[] = []

    // Games (MODERATOR+)
    if (canSeeAll) {
      const games = await this.prisma.game.findMany({
        where: { status: ApprovalStatus.PENDING },
        include: {
          submitter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for fairness
        take: PREVIEW_ITEMS_COUNT,
      })

      results.push(
        ...games.map((g: (typeof games)[0]) => ({
          id: g.id,
          type: 'game' as const,
          title: g.title,
          submittedBy: g.submitter?.name ?? null,
          submittedById: g.submitter?.id ?? '',
          createdAt: g.createdAt,
        })),
      )
    }

    // Build listing where clause
    const listingWhere: Prisma.ListingWhereInput = {
      status: ApprovalStatus.PENDING,
    }

    if (isDeveloper && userId && !canSeeAll) {
      const verifiedEmulators = await this.prisma.verifiedDeveloper.findMany({
        where: { userId },
        select: { emulatorId: true },
      })
      const emulatorIds = verifiedEmulators.map((ve) => ve.emulatorId)

      if (emulatorIds.length > 0) {
        listingWhere.emulatorId = { in: emulatorIds }
      } else {
        return results // No emulators, return what we have
      }
    }

    // Only get listings if user can see them (DEVELOPER+)
    if (canSeePending) {
      // Mobile Listings
      const listings = await this.prisma.listing.findMany({
        where: listingWhere,
        include: {
          game: { select: { title: true } },
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: PREVIEW_ITEMS_COUNT,
      })

      results.push(
        ...listings.map((l: (typeof listings)[0]) => ({
          id: l.id,
          type: 'listing' as const,
          title: l.game.title,
          submittedBy: l.author.name,
          submittedById: l.author.id,
          createdAt: l.createdAt,
        })),
      )

      // PC Listings
      const pcListings = await this.prisma.pcListing.findMany({
        where: listingWhere as Prisma.PcListingWhereInput,
        include: {
          game: { select: { title: true } },
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: PREVIEW_ITEMS_COUNT,
      })

      results.push(
        ...pcListings.map((l: (typeof pcListings)[0]) => ({
          id: l.id,
          type: 'pcListing' as const,
          title: l.game.title,
          submittedBy: l.author.name,
          submittedById: l.author.id,
          createdAt: l.createdAt,
        })),
      )
    }

    // Return sorted by creation date, oldest first
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, 5)
  }

  /**
   * Calculates platform statistics and trends
   * @param timeRange - Time range for statistics calculation
   * @returns Platform statistics with trend percentages
   */
  async getPlatformStats(timeRange: TimeRange): Promise<ActivityTypes.PlatformStats> {
    const dateFrom = this.getDateRange(timeRange)

    // For comparison, get the previous period
    let previousDateFrom: Date
    const previousDateTo: Date = dateFrom

    switch (timeRange) {
      case '24h':
        previousDateFrom = subHours(previousDateTo, 24)
        break
      case '48h':
        previousDateFrom = subHours(previousDateTo, 48)
        break
      case '7d':
        previousDateFrom = subDays(previousDateTo, 7)
        break
    }

    // Current period counts
    const [
      newUsers,
      newListings,
      newPcListings,
      activeReports,
      pendingGames,
      pendingListings,
      pendingPcListings,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: dateFrom } },
      }),
      this.prisma.listing.count({
        where: { createdAt: { gte: dateFrom } },
      }),
      this.prisma.pcListing.count({
        where: { createdAt: { gte: dateFrom } },
      }),
      this.prisma.listingReport.count({
        where: {
          status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
        },
      }),
      this.prisma.game.count({
        where: { status: ApprovalStatus.PENDING },
      }),
      this.prisma.listing.count({
        where: { status: ApprovalStatus.PENDING },
      }),
      this.prisma.pcListing.count({
        where: { status: ApprovalStatus.PENDING },
      }),
    ])

    // Previous period counts for comparison
    const [previousUsers, previousListings, previousPcListings] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: previousDateFrom,
            lt: previousDateTo,
          },
        },
      }),
      this.prisma.listing.count({
        where: {
          createdAt: {
            gte: previousDateFrom,
            lt: previousDateTo,
          },
        },
      }),
      this.prisma.pcListing.count({
        where: {
          createdAt: {
            gte: previousDateFrom,
            lt: previousDateTo,
          },
        },
      }),
    ])

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? FULL_PERCENTAGE : ZERO_PERCENTAGE
      return Math.round(((current - previous) / previous) * PERCENTAGE_MULTIPLIER)
    }

    return {
      newUsersCount: newUsers,
      newUsersChange: calculateChange(newUsers, previousUsers),
      newListingsCount: newListings,
      newListingsChange: calculateChange(newListings, previousListings),
      newPcListingsCount: newPcListings,
      newPcListingsChange: calculateChange(newPcListings, previousPcListings),
      activeReportsCount: activeReports,
      pendingApprovalsCount: pendingGames + pendingListings + pendingPcListings,
      pendingGamesCount: pendingGames,
      pendingListingsCount: pendingListings,
      pendingPcListingsCount: pendingPcListings,
    }
  }
}
