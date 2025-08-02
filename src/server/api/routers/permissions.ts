import { AppError, ResourceError } from '@/lib/errors'
import {
  AssignPermissionToRoleSchema,
  BulkPermissionActionSchema,
  BulkUpdateRolePermissionsSchema,
  CreatePermissionSchema,
  DeletePermissionSchema,
  GetAllPermissionsSchema,
  GetPermissionByIdSchema,
  GetPermissionMatrixSchema,
  GetRolePermissionsSchema,
  RemovePermissionFromRoleSchema,
  UpdatePermissionSchema,
} from '@/schemas/permission'
import {
  accessAdminPanelProcedure,
  createTRPCRouter,
  managePermissionsProcedure,
} from '@/server/api/trpc'
import {
  calculateOffset,
  createPaginationResult,
} from '@/server/utils/pagination'
import { PermissionActionType, Role } from '@orm'

export const permissionsRouter = createTRPCRouter({
  /**
   * Get all permissions with filtering and pagination
   */
  getAll: accessAdminPanelProcedure
    .input(GetAllPermissionsSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        category,
        sortField = 'label',
        sortDirection = 'asc',
        page = 1,
        limit = 50,
        includeSystemOnly,
      } = input || {}

      const offset = calculateOffset({ page }, limit)

      // Build where clause
      const where: Record<string, unknown> = {}

      if (search) {
        where.OR = [
          { label: { contains: search, mode: 'insensitive' } },
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (category) {
        where.category = category
      }

      if (includeSystemOnly !== undefined) {
        where.isSystem = includeSystemOnly
      }

      // Execute queries
      const [permissions, total] = await Promise.all([
        ctx.prisma.permission.findMany({
          where,
          orderBy: { [sortField]: sortDirection },
          skip: offset,
          take: limit,
          include: {
            rolePermissions: { select: { role: true } },
            _count: { select: { rolePermissions: true } },
          },
        }),
        ctx.prisma.permission.count({ where }),
      ])

      return {
        permissions: permissions.map((permission) => ({
          ...permission,
          assignedRoles: permission.rolePermissions.map((rp) => rp.role),
          roleCount: permission._count.rolePermissions,
        })),
        pagination: createPaginationResult(total, { page }, limit, offset),
      }
    }),

  /**
   * Get permission by ID
   */
  getById: accessAdminPanelProcedure
    .input(GetPermissionByIdSchema)
    .query(async ({ ctx, input }) => {
      const permission = await ctx.prisma.permission.findUnique({
        where: { id: input.id },
        include: {
          rolePermissions: {
            select: {
              role: true,
              assignedAt: true,
              assignedByUser: { select: { id: true, name: true, email: true } },
            },
          },
        },
      })

      if (!permission) return AppError.notFound('Permission')

      return {
        ...permission,
        assignedRoles: permission.rolePermissions,
      }
    }),

  /**
   * Create new permission
   */
  create: managePermissionsProcedure
    .input(CreatePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if permission key already exists
      const existingPermission = await ctx.prisma.permission.findUnique({
        where: { key: input.key },
      })

      if (existingPermission) {
        return ResourceError.permission.alreadyExists('key')
      }

      const permission = await ctx.prisma.permission.create({
        data: input,
      })

      // Log the action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action: PermissionActionType.PERMISSION_CREATED,
          permissionId: permission.id,
          metadata: {
            permissionKey: permission.key,
            permissionLabel: permission.label,
          },
        },
      })

      return permission
    }),

  /**
   * Update permission
   */
  update: managePermissionsProcedure
    .input(UpdatePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const existingPermission = await ctx.prisma.permission.findUnique({
        where: { id: input.id },
      })

      if (!existingPermission) return ResourceError.permission.notFound()

      // System permissions cannot be deleted, but can be updated
      const { id, ...updateData } = input

      const permission = await ctx.prisma.permission.update({
        where: { id },
        data: updateData,
      })

      // Log the action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action: PermissionActionType.PERMISSION_UPDATED,
          permissionId: permission.id,
          metadata: { oldValues: existingPermission, newValues: updateData },
        },
      })

      return permission
    }),

  /**
   * Delete permission
   */
  delete: managePermissionsProcedure
    .input(DeletePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const permission = await ctx.prisma.permission.findUnique({
        where: { id: input.id },
        include: { _count: { select: { rolePermissions: true } } },
      })

      if (!permission) return ResourceError.permission.notFound()

      // Prevent deletion of system permissions
      if (permission.isSystem) {
        return AppError.forbidden('System permissions cannot be deleted')
      }

      // Check if permission is currently assigned to any roles
      if (permission._count.rolePermissions > 0) {
        return AppError.conflict(
          'Cannot delete permission that is assigned to roles. Remove from all roles first.',
        )
      }

      await ctx.prisma.permission.delete({ where: { id: input.id } })

      // Log the action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action: PermissionActionType.PERMISSION_DELETED,
          metadata: { deletedPermission: permission },
        },
      })

      return { success: true }
    }),

  /**
   * Get permissions for specific role or all roles
   */
  getRolePermissions: accessAdminPanelProcedure
    .input(GetRolePermissionsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}
      if (input?.role) where.role = input.role

      return await ctx.prisma.rolePermission.findMany({
        where,
        include: {
          permission: {
            select: {
              id: true,
              key: true,
              label: true,
              description: true,
              category: true,
              isSystem: true,
            },
          },
          assignedByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: [
          { role: 'asc' },
          { permission: { category: 'asc' } },
          { permission: { label: 'asc' } },
        ],
      })
    }),

  /**
   * Assign permission to role
   */
  assignPermissionToRole: managePermissionsProcedure
    .input(AssignPermissionToRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if assignment already exists
      const existingAssignment = await ctx.prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role: input.role,
            permissionId: input.permissionId,
          },
        },
      })

      if (existingAssignment) {
        return AppError.conflict('Permission is already assigned to this role')
      }

      // Verify permission exists
      const permission = await ctx.prisma.permission.findUnique({
        where: { id: input.permissionId },
      })

      if (!permission) return ResourceError.permission.notFound()

      const rolePermission = await ctx.prisma.rolePermission.create({
        data: {
          role: input.role,
          permissionId: input.permissionId,
          assignedBy: ctx.session.user.id,
        },
        include: { permission: true },
      })

      // Log the action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action: PermissionActionType.ROLE_PERMISSION_ASSIGNED,
          targetRole: input.role,
          permissionId: input.permissionId,
          metadata: { permissionKey: permission.key },
        },
      })

      return rolePermission
    }),

  /**
   * Remove permission from role
   */
  removePermissionFromRole: managePermissionsProcedure
    .input(RemovePermissionFromRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const rolePermission = await ctx.prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role: input.role,
            permissionId: input.permissionId,
          },
        },
        include: { permission: true },
      })

      if (!rolePermission) return AppError.notFound('Permission assignment')

      await ctx.prisma.rolePermission.delete({
        where: {
          role_permissionId: {
            role: input.role,
            permissionId: input.permissionId,
          },
        },
      })

      // Log the action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action: PermissionActionType.ROLE_PERMISSION_REMOVED,
          targetRole: input.role,
          permissionId: input.permissionId,
          metadata: { permissionKey: rolePermission.permission.key },
        },
      })

      return { success: true }
    }),

  /**
   * Bulk update role permissions (replace all permissions for a role)
   */
  bulkUpdateRolePermissions: managePermissionsProcedure
    .input(BulkUpdateRolePermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      const { role, permissionIds } = input

      // Verify all permissions exist
      const permissions = await ctx.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      })

      if (permissions.length !== permissionIds.length) {
        return AppError.notFound('One or more permissions')
      }

      // Get current permissions for comparison
      const currentPermissions = await ctx.prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true },
      })

      const currentPermissionIds = currentPermissions.map(
        (rp) => rp.permission.id,
      )

      // Use transaction for bulk update
      await ctx.prisma.$transaction(async (tx) => {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({ where: { role } })

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              role,
              permissionId,
              assignedBy: ctx.session.user.id,
            })),
          })
        }

        // Log the bulk action
        await tx.permissionActionLog.create({
          data: {
            userId: ctx.session.user.id,
            action: PermissionActionType.ROLE_PERMISSION_ASSIGNED,
            targetRole: role,
            metadata: {
              bulkUpdate: true,
              oldPermissions: currentPermissionIds,
              newPermissions: permissionIds,
              addedPermissions: permissionIds.filter(
                (id) => !currentPermissionIds.includes(id),
              ),
              removedPermissions: currentPermissionIds.filter(
                (id) => !permissionIds.includes(id),
              ),
            },
          },
        })
      })

      return { success: true }
    }),

  /**
   * Get permission matrix for UI display
   */
  getPermissionMatrix: accessAdminPanelProcedure
    .input(GetPermissionMatrixSchema)
    .query(async ({ ctx, input }) => {
      const { includeSystemPermissions = true } = input || {}

      const where: Record<string, unknown> = {}
      if (!includeSystemPermissions) {
        where.isSystem = false
      }

      // Get all permissions
      const permissions = await ctx.prisma.permission.findMany({
        where,
        orderBy: [{ category: 'asc' }, { label: 'asc' }],
        include: { rolePermissions: { select: { role: true } } },
      })

      // Get all roles
      const roles = Object.values(Role)

      // Build matrix
      const matrix = permissions.map((permission) => ({
        id: permission.id,
        key: permission.key,
        label: permission.label,
        description: permission.description,
        category: permission.category,
        isSystem: permission.isSystem,
        roles: roles.reduce(
          (acc, role) => ({
            ...acc,
            [role]: permission.rolePermissions.some((rp) => rp.role === role),
          }),
          {} as Record<Role, boolean>,
        ),
      }))

      return {
        permissions: matrix,
        roles,
        categories: Array.from(
          new Set(permissions.map((p) => p.category)),
        ).filter(Boolean),
      }
    }),

  /**
   * Bulk permission actions
   */
  bulkAction: managePermissionsProcedure
    .input(BulkPermissionActionSchema)
    .mutation(async ({ ctx, input }) => {
      const { action, rolePermissions } = input

      const results = []

      for (const rp of rolePermissions) {
        try {
          if (action === 'assign') {
            // Check if already assigned
            const existing = await ctx.prisma.rolePermission.findUnique({
              where: {
                role_permissionId: {
                  role: rp.role,
                  permissionId: rp.permissionId,
                },
              },
            })

            if (!existing) {
              await ctx.prisma.rolePermission.create({
                data: {
                  role: rp.role,
                  permissionId: rp.permissionId,
                  assignedBy: ctx.session.user.id,
                },
              })
              results.push({ ...rp, success: true, action: 'assigned' })
            } else {
              results.push({
                ...rp,
                success: false,
                action: 'already_assigned',
              })
            }
          } else if (action === 'remove') {
            const deleted = await ctx.prisma.rolePermission.deleteMany({
              where: {
                role: rp.role,
                permissionId: rp.permissionId,
              },
            })

            if (deleted.count > 0) {
              results.push({ ...rp, success: true, action: 'removed' })
            } else {
              results.push({ ...rp, success: false, action: 'not_found' })
            }
          }
        } catch {
          results.push({ ...rp, success: false, error: 'operation_failed' })
        }
      }

      // Log bulk action
      await ctx.prisma.permissionActionLog.create({
        data: {
          userId: ctx.session.user.id,
          action:
            action === 'assign'
              ? PermissionActionType.ROLE_PERMISSION_ASSIGNED
              : PermissionActionType.ROLE_PERMISSION_REMOVED,
          metadata: { bulkAction: true, action, results },
        },
      })

      return {
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      }
    }),
})
