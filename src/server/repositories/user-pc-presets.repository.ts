import { ResourceError } from '@/lib/errors'
import { roleIncludesRole } from '@/utils/permission-system'
import { type Prisma, Role, type PcOs } from '@orm'
import { BaseRepository } from './base.repository'

/**
 * Repository for User PC Preset data access
 */
export class UserPcPresetsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    full: {
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
    } satisfies Prisma.UserPcPresetInclude,

    // Limited brand data for mobile/bandwidth optimization
    limited: {
      cpu: { include: { brand: { select: { id: true, name: true } } } },
      gpu: { include: { brand: { select: { id: true, name: true } } } },
    } satisfies Prisma.UserPcPresetInclude,
  } as const

  /**
   * Get preset by ID with optional limited includes
   */
  async byId(
    id: string,
    options: { limited?: boolean } = {},
  ): Promise<Prisma.UserPcPresetGetPayload<{
    include:
      | typeof UserPcPresetsRepository.includes.full
      | typeof UserPcPresetsRepository.includes.limited
  }> | null> {
    return this.prisma.userPcPreset.findUnique({
      where: { id },
      include: options.limited
        ? UserPcPresetsRepository.includes.limited
        : UserPcPresetsRepository.includes.full,
    })
  }

  /**
   * Check if preset exists for user with given name
   */
  async existsByName(userId: string, name: string, excludeId?: string): Promise<boolean> {
    const preset = await this.prisma.userPcPreset.findFirst({
      where: {
        userId,
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!preset
  }

  /**
   * Get all presets for a user with optional permission checking
   */
  async getByUserId(
    userId: string,
    options: {
      requestingUserId?: string
      userRole?: Role
      limited?: boolean
      limit?: number
    } = {},
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include:
        | typeof UserPcPresetsRepository.includes.full
        | typeof UserPcPresetsRepository.includes.limited
    }>[]
  > {
    // Check permission: users can only see their own presets unless admin
    if (options.requestingUserId && options.userRole) {
      if (userId !== options.requestingUserId) {
        const isAdmin = roleIncludesRole(options.userRole, Role.ADMIN)
        if (!isAdmin) {
          return ResourceError.pcPreset.canOnlyViewOwn()
        }
      }
    }

    return this.prisma.userPcPreset.findMany({
      where: { userId },
      ...(options.limit && { take: options.limit }),
      orderBy: { createdAt: 'desc' },
      include: options.limited
        ? UserPcPresetsRepository.includes.limited
        : UserPcPresetsRepository.includes.full,
    })
  }

  /**
   * Create a new preset
   */
  async create(
    data: {
      userId: string
      name: string
      cpuId: string
      gpuId?: string | null
      memorySize: number
      os: PcOs
      osVersion: string
    },
    options: { limited?: boolean } = {},
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include:
        | typeof UserPcPresetsRepository.includes.full
        | typeof UserPcPresetsRepository.includes.limited
    }>
  > {
    // Check for duplicate name
    const exists = await this.existsByName(data.userId, data.name)
    if (exists) {
      return ResourceError.pcPreset.alreadyExists(data.name)
    }

    // Validate CPU and GPU exist
    const [cpu, gpu] = await Promise.all([
      this.prisma.cpu.findUnique({ where: { id: data.cpuId } }),
      data.gpuId ? this.prisma.gpu.findUnique({ where: { id: data.gpuId } }) : null,
    ])

    if (!cpu) return ResourceError.cpu.notFound()
    if (data.gpuId && !gpu) return ResourceError.gpu.notFound()

    return this.prisma.userPcPreset.create({
      data,
      include: options.limited
        ? UserPcPresetsRepository.includes.limited
        : UserPcPresetsRepository.includes.full,
    })
  }

  /**
   * Update a preset (supports both full and partial updates)
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string
      cpuId: string
      gpuId: string | null
      memorySize: number
      os: PcOs
      osVersion: string
    }>,
    options: { limited?: boolean } = {},
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include:
        | typeof UserPcPresetsRepository.includes.full
        | typeof UserPcPresetsRepository.includes.limited
    }>
  > {
    // Check ownership
    const preset = await this.byId(id)
    if (!preset) return ResourceError.pcPreset.notFound()
    if (preset.userId !== userId) {
      return ResourceError.pcPreset.canOnlyEditOwn()
    }

    // Check for duplicate name if name is being updated
    if (data.name) {
      const exists = await this.existsByName(userId, data.name, id)
      if (exists) return ResourceError.pcPreset.alreadyExists(data.name)
    }

    // Validate CPU if being updated
    if (data.cpuId) {
      const cpu = await this.prisma.cpu.findUnique({ where: { id: data.cpuId } })
      if (!cpu) return ResourceError.cpu.notFound()
    }

    // Validate GPU if being updated
    if (data.gpuId !== undefined) {
      if (data.gpuId) {
        const gpu = await this.prisma.gpu.findUnique({ where: { id: data.gpuId } })
        if (!gpu) return ResourceError.gpu.notFound()
      }
    }

    return this.prisma.userPcPreset.update({
      where: { id },
      data,
      include: options.limited
        ? UserPcPresetsRepository.includes.limited
        : UserPcPresetsRepository.includes.full,
    })
  }

  /**
   * Delete a preset
   */
  async delete(id: string, userId: string): Promise<void> {
    const preset = await this.byId(id)
    if (!preset) return ResourceError.pcPreset.notFound()
    if (preset.userId !== userId) return ResourceError.pcPreset.canOnlyDeleteOwn()

    await this.prisma.userPcPreset.delete({ where: { id } })
  }

  /**
   * Get count of presets for a user
   */
  async count(userId: string): Promise<number> {
    return this.prisma.userPcPreset.count({ where: { userId } })
  }
}
