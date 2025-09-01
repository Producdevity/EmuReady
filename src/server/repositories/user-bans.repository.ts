import { ResourceError } from '@/lib/errors'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { Role } from '@orm'
import { BaseRepository } from './base.repository'
import type { Prisma, PrismaClient } from '@orm'

export class UserBansRepository extends BaseRepository {
  private static readonly ROLE_HIERARCHY = [
    Role.USER,
    Role.AUTHOR,
    Role.DEVELOPER,
    Role.MODERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]

  static readonly includes = {
    default: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          createdAt: true,
        },
      },
      bannedBy: { select: { id: true, name: true, email: true } },
      unbannedBy: { select: { id: true, name: true, email: true } },
    } satisfies Prisma.UserBanInclude,

    minimal: { bannedBy: { select: { name: true } } } satisfies Prisma.UserBanInclude,
  } as const

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma as PrismaClient)
  }

  async stats() {
    const [total, active, expired, permanent, temporary] = await Promise.all([
      this.prisma.userBan.count(),
      this.prisma.userBan.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      this.prisma.userBan.count({ where: { isActive: true, expiresAt: { lt: new Date() } } }),
      this.prisma.userBan.count({ where: { isActive: true, expiresAt: null } }),
      this.prisma.userBan.count({ where: { isActive: true, expiresAt: { not: null } } }),
    ])

    return { total, active, expired, permanent, temporary }
  }

  async checkBanStatus(userId: string, includeDetails = false) {
    const ban = await this.prisma.userBan.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: includeDetails ? UserBansRepository.includes.default : undefined,
    })

    return {
      isBanned: !!ban,
      ban,
    }
  }

  async create(data: {
    userId: string
    bannedById: string
    reason: string
    notes?: string | null
    expiresAt?: Date | null
  }) {
    // Check if user can be banned (role hierarchy)
    const [bannerRole, targetRole] = await Promise.all([
      this.getUserRole(data.bannedById),
      this.getUserRole(data.userId),
    ])

    if (!bannerRole || !targetRole) throw ResourceError.user.notFound()

    if (!this.canBanUser(bannerRole, targetRole)) {
      throw ResourceError.userBan.insufficientPermissions()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userBan.create({
          data: { ...data, isActive: true },
          include: UserBansRepository.includes.default,
        }),
      'UserBan',
    )
  }

  async update(id: string, data: Prisma.UserBanUpdateInput) {
    // Check if ban exists
    const ban = await this.byId(id)
    if (!ban) throw ResourceError.userBan.notFound()

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userBan.update({
          where: { id },
          data,
          include: UserBansRepository.includes.default,
        }),
      'UserBan',
    )
  }

  async lift(id: string, unbannedById: string, unbannedNotes?: string) {
    const ban = await this.prisma.userBan.findUnique({
      where: { id },
      select: { notes: true },
    })

    if (!ban) throw ResourceError.userBan.notFound()

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userBan.update({
          where: { id },
          data: {
            isActive: false,
            unbannedById,
            unbannedAt: new Date(),
            notes: unbannedNotes
              ? ban.notes
                ? `${ban.notes}\n\nUnban notes: ${unbannedNotes}`
                : `Unban notes: ${unbannedNotes}`
              : ban.notes,
          },
          include: UserBansRepository.includes.default,
        }),
      'UserBan',
    )
  }

  async delete(id: string) {
    // Check if ban exists
    const ban = await this.byId(id)
    if (!ban) throw ResourceError.userBan.notFound()

    return this.handleDatabaseOperation(
      () => this.prisma.userBan.delete({ where: { id } }),
      'UserBan',
    )
  }

  async byId(id: string, includeDetails = false) {
    return this.prisma.userBan.findUnique({
      where: { id },
      include: includeDetails ? UserBansRepository.includes.default : undefined,
    })
  }

  async getUserRole(userId: string): Promise<Role | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    return user?.role ?? null
  }

  canBanUser(bannerRole: Role, targetRole: Role): boolean {
    if (bannerRole === Role.SUPER_ADMIN) return true

    const bannerIndex = UserBansRepository.ROLE_HIERARCHY.indexOf(bannerRole)
    const targetIndex = UserBansRepository.ROLE_HIERARCHY.indexOf(targetRole)

    return bannerIndex > targetIndex
  }

  async listByUserId(userId: string) {
    return this.prisma.userBan.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async list(params: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    sortField?: string
    sortDirection?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params
    const actualOffset = calculateOffset({ page }, limit)

    const where: Prisma.UserBanWhereInput = {}

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [bans, total] = await Promise.all([
      this.prisma.userBan.findMany({
        where,
        skip: actualOffset,
        take: limit,
        orderBy: { [sortField]: sortDirection },
        include: UserBansRepository.includes.default,
      }),
      this.prisma.userBan.count({ where }),
    ])

    return {
      bans,
      pagination: paginate({ total, page, limit }),
    }
  }
}
