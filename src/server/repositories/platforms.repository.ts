import { getCompatiblePlatformSlugsForOs } from '@/utils/platform-os-mapping'
import { type PcOs, type PlatformScope, type Prisma } from '@orm'
import { BaseRepository } from './base.repository'

export interface PlatformFilters {
  scope?: PlatformScope
  scopes?: PlatformScope[]
}

export class PlatformsRepository extends BaseRepository {
  async list(filters: PlatformFilters = {}) {
    return this.handleDatabaseOperation(() => {
      const where: Prisma.PlatformWhereInput = {}

      if (filters.scope) {
        where.scope = filters.scope
      } else if (filters.scopes && filters.scopes.length > 0) {
        where.scope = { in: filters.scopes }
      }

      return this.prisma.platform.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    }, 'Platform')
  }

  async byId(id: string) {
    return this.handleDatabaseOperation(
      () => this.prisma.platform.findUnique({ where: { id } }),
      'Platform',
    )
  }

  async listCompatibleForDevice(deviceId: string) {
    return this.handleDatabaseOperation(async () => {
      const links = await this.prisma.devicePlatform.findMany({
        where: { deviceId },
        select: { platformId: true },
      })
      // Fail-open for unmapped devices: an empty DevicePlatform set
      // means "unknown compatibility", not "no platforms".
      if (links.length === 0) {
        return this.prisma.platform.findMany({
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
      }
      return this.prisma.platform.findMany({
        where: { id: { in: links.map((l) => l.platformId) } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    }, 'Platform')
  }

  async listCompatibleForOs(os: PcOs) {
    return this.handleDatabaseOperation(() => {
      // `compatibleSlugs` is undefined for OS values with no entry
      // (e.g. PcOs.OTHER); in that case match every platform.
      const compatibleSlugs = getCompatiblePlatformSlugsForOs(os)
      const where: Prisma.PlatformWhereInput = compatibleSlugs
        ? { slug: { in: [...compatibleSlugs] } }
        : {}
      return this.prisma.platform.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    }, 'Platform')
  }
}
