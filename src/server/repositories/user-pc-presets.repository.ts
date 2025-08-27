import { ResourceError } from '@/lib/errors'
import {
  validateRequired,
  validateStringFormat,
  ValidationPatterns,
} from '@/server/utils/security-validation'
import { roleIncludesRole } from '@/utils/permission-system'
import { type Prisma, Role } from '@orm'
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
  async listByUserId(
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
          throw ResourceError.pcPreset.canOnlyViewOwn()
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
   * Validate ownership and permissions for preset operations
   */
  private async validateOwnershipAndPermissions(
    id: string,
    requestingUserId: string,
    requestingUserRole?: Role,
    operation: 'edit' | 'delete' = 'edit',
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include: typeof UserPcPresetsRepository.includes.full
    }>
  > {
    const preset = await this.prisma.userPcPreset.findUnique({
      where: { id },
      include: UserPcPresetsRepository.includes.full,
    })

    if (!preset) throw ResourceError.pcPreset.notFound()

    // Check ownership or admin permissions
    const isAdmin = requestingUserRole && roleIncludesRole(requestingUserRole, Role.ADMIN)
    if (preset.userId !== requestingUserId && !isAdmin) {
      throw operation === 'edit'
        ? ResourceError.pcPreset.canOnlyEditOwn()
        : ResourceError.pcPreset.canOnlyDeleteOwn()
    }

    return preset
  }

  /**
   * Create a new preset
   */
  async create(
    data: Omit<Prisma.UserPcPresetUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>,
    options: { limited?: boolean } = {},
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include:
        | typeof UserPcPresetsRepository.includes.full
        | typeof UserPcPresetsRepository.includes.limited
    }>
  > {
    validateRequired(data.userId, 'userId')
    validateRequired(data.name, 'preset name')
    validateStringFormat(data.userId, ValidationPatterns.UUID, 'userId', 'UUID format')

    // Check for duplicate name
    const exists = await this.existsByName(data.userId, data.name)
    if (exists) throw ResourceError.pcPreset.alreadyExists(data.name)

    // Validate CPU and GPU exist
    const [cpu, gpu] = await Promise.all([
      this.prisma.cpu.findUnique({ where: { id: data.cpuId } }),
      data.gpuId ? this.prisma.gpu.findUnique({ where: { id: data.gpuId } }) : null,
    ])

    if (!cpu) throw ResourceError.cpu.notFound()
    if (data.gpuId && !gpu) throw ResourceError.gpu.notFound()

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userPcPreset.create({
          data,
          include: options.limited
            ? UserPcPresetsRepository.includes.limited
            : UserPcPresetsRepository.includes.full,
        }),
      'UserPcPreset',
    )
  }

  /**
   * Update a preset (supports both full and partial updates)
   */
  async update(
    id: string,
    requestingUserId: string,
    data: Partial<
      Omit<Prisma.UserPcPresetUncheckedCreateInput, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
    options: {
      limited?: boolean
      requestingUserRole?: Role
    } = {},
  ): Promise<
    Prisma.UserPcPresetGetPayload<{
      include:
        | typeof UserPcPresetsRepository.includes.full
        | typeof UserPcPresetsRepository.includes.limited
    }>
  > {
    const preset = await this.validateOwnershipAndPermissions(
      id,
      requestingUserId,
      options.requestingUserRole,
      'edit',
    )

    // Check for duplicate name if name is being updated
    if (data.name) {
      const exists = await this.existsByName(preset.userId, data.name, id)
      if (exists) throw ResourceError.pcPreset.alreadyExists(data.name)
    }

    // Validate CPU if being updated
    if (data.cpuId) {
      const cpu = await this.prisma.cpu.findUnique({ where: { id: data.cpuId } })
      if (!cpu) throw ResourceError.cpu.notFound()
    }

    // Validate GPU if being updated
    if (data.gpuId) {
      const gpu = await this.prisma.gpu.findUnique({ where: { id: data.gpuId } })
      if (!gpu) throw ResourceError.gpu.notFound()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.userPcPreset.update({
          where: { id },
          data,
          include: options.limited
            ? UserPcPresetsRepository.includes.limited
            : UserPcPresetsRepository.includes.full,
        }),
      'UserPcPreset',
    )
  }

  /**
   * Delete a preset
   */
  async delete(
    id: string,
    requestingUserId: string,
    options: { requestingUserRole?: Role } = {},
  ): Promise<void> {
    await this.validateOwnershipAndPermissions(
      id,
      requestingUserId,
      options.requestingUserRole,
      'delete',
    )

    await this.handleDatabaseOperation(
      () => this.prisma.userPcPreset.delete({ where: { id } }),
      'UserPcPreset',
    )
  }

  /**
   * Get count of presets for a user
   */
  async count(userId: string): Promise<number> {
    return this.prisma.userPcPreset.count({ where: { userId } })
  }
}
