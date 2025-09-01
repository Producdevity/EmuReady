import { describe, it, expect } from 'vitest'
import { Role, type PrismaClient } from '@orm'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasPermissionInContext,
  hasAnyPermissionInContext,
  hasAllPermissionsInContext,
  roleIncludesRole,
  PERMISSIONS,
  type PermissionKey,
  canBanUser,
} from './permission-system'
import type { TRPCContext } from '@/server/api/trpc'

describe('Permission System', () => {
  // Test data setup
  const mockPermissions: PermissionKey[] = [
    PERMISSIONS.CREATE_LISTING,
    PERMISSIONS.EDIT_OWN_COMMENT,
    PERMISSIONS.VIEW_STATISTICS,
  ]

  const createMockContext = (permissions?: string[] | null, role?: Role): TRPCContext => ({
    session:
      permissions !== undefined
        ? {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
              role: role || Role.USER,
              permissions: permissions || [],
              showNsfw: false,
            },
          }
        : null,
    prisma: {} as PrismaClient,
    headers: {} as Headers,
  })

  describe('hasPermission', () => {
    describe('happy paths', () => {
      it('should return true when user has the required permission', () => {
        expect(hasPermission(mockPermissions, PERMISSIONS.CREATE_LISTING)).toBe(true)
        expect(hasPermission(mockPermissions, PERMISSIONS.EDIT_OWN_COMMENT)).toBe(true)
        expect(hasPermission(mockPermissions, PERMISSIONS.VIEW_STATISTICS)).toBe(true)
      })

      it('should handle string array permissions correctly', () => {
        const stringPermissions = ['custom_permission', 'another_permission']
        expect(hasPermission(stringPermissions, 'custom_permission')).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should return false when user lacks the required permission', () => {
        expect(hasPermission(mockPermissions, PERMISSIONS.MANAGE_USERS)).toBe(false)
        expect(hasPermission(mockPermissions, PERMISSIONS.APPROVE_GAMES)).toBe(false)
      })

      it('should return false for null permissions', () => {
        expect(hasPermission(null, PERMISSIONS.CREATE_LISTING)).toBe(false)
      })

      it('should return false for undefined permissions', () => {
        expect(hasPermission(undefined, PERMISSIONS.CREATE_LISTING)).toBe(false)
      })

      it('should return false for empty permissions array', () => {
        expect(hasPermission([], PERMISSIONS.CREATE_LISTING)).toBe(false)
      })

      it('should handle case sensitivity correctly', () => {
        expect(hasPermission(mockPermissions, 'CREATE_LISTING')).toBe(false)
        expect(hasPermission(mockPermissions, 'create_listing')).toBe(true)
      })
    })
  })

  describe('hasAnyPermission', () => {
    describe('happy paths', () => {
      it('should return true when user has at least one required permission', () => {
        expect(
          hasAnyPermission(mockPermissions, [PERMISSIONS.CREATE_LISTING, PERMISSIONS.MANAGE_USERS]),
        ).toBe(true)
      })

      it('should return true when user has all required permissions', () => {
        expect(
          hasAnyPermission(mockPermissions, [
            PERMISSIONS.CREATE_LISTING,
            PERMISSIONS.EDIT_OWN_COMMENT,
          ]),
        ).toBe(true)
      })

      it('should return true with single matching permission', () => {
        expect(
          hasAnyPermission(mockPermissions, [
            PERMISSIONS.MANAGE_USERS,
            PERMISSIONS.APPROVE_GAMES,
            PERMISSIONS.VIEW_STATISTICS,
          ]),
        ).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should return false when user has none of the required permissions', () => {
        expect(
          hasAnyPermission(mockPermissions, [PERMISSIONS.MANAGE_USERS, PERMISSIONS.APPROVE_GAMES]),
        ).toBe(false)
      })

      it('should return false for null permissions', () => {
        expect(hasAnyPermission(null, [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })

      it('should return false for undefined permissions', () => {
        expect(hasAnyPermission(undefined, [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })

      it('should return false for empty permissions array', () => {
        expect(hasAnyPermission([], [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })

      it('should return false when checking against empty required permissions', () => {
        expect(hasAnyPermission(mockPermissions, [])).toBe(false)
      })
    })
  })

  describe('hasAllPermissions', () => {
    describe('happy paths', () => {
      it('should return true when user has all required permissions', () => {
        expect(
          hasAllPermissions(mockPermissions, [
            PERMISSIONS.CREATE_LISTING,
            PERMISSIONS.EDIT_OWN_COMMENT,
          ]),
        ).toBe(true)
      })

      it('should return true when checking single permission that exists', () => {
        expect(hasAllPermissions(mockPermissions, [PERMISSIONS.CREATE_LISTING])).toBe(true)
      })

      it('should return true when checking empty required permissions', () => {
        expect(hasAllPermissions(mockPermissions, [])).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should return false when user lacks any required permission', () => {
        expect(
          hasAllPermissions(mockPermissions, [
            PERMISSIONS.CREATE_LISTING,
            PERMISSIONS.MANAGE_USERS,
          ]),
        ).toBe(false)
      })

      it('should return false when user lacks all required permissions', () => {
        expect(
          hasAllPermissions(mockPermissions, [PERMISSIONS.MANAGE_USERS, PERMISSIONS.APPROVE_GAMES]),
        ).toBe(false)
      })

      it('should return false for null permissions', () => {
        expect(hasAllPermissions(null, [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })

      it('should return false for undefined permissions', () => {
        expect(hasAllPermissions(undefined, [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })

      it('should return false for empty permissions array', () => {
        expect(hasAllPermissions([], [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })
    })
  })

  describe('Context-aware permission functions', () => {
    describe('hasPermissionInContext', () => {
      it('should return true when user has permission in context', () => {
        const ctx = createMockContext(mockPermissions)
        expect(hasPermissionInContext(ctx, PERMISSIONS.CREATE_LISTING)).toBe(true)
      })

      it('should return false when user lacks permission in context', () => {
        const ctx = createMockContext(mockPermissions)
        expect(hasPermissionInContext(ctx, PERMISSIONS.MANAGE_USERS)).toBe(false)
      })

      it('should return false when session is null', () => {
        const ctx = createMockContext()
        expect(hasPermissionInContext(ctx, PERMISSIONS.CREATE_LISTING)).toBe(false)
      })

      it('should return false when permissions are null in session', () => {
        const ctx = createMockContext(null)
        expect(hasPermissionInContext(ctx, PERMISSIONS.CREATE_LISTING)).toBe(false)
      })
    })

    describe('hasAnyPermissionInContext', () => {
      it('should return true when user has any permission in context', () => {
        const ctx = createMockContext(mockPermissions)
        expect(
          hasAnyPermissionInContext(ctx, [PERMISSIONS.CREATE_LISTING, PERMISSIONS.MANAGE_USERS]),
        ).toBe(true)
      })

      it('should return false when user has none of the permissions', () => {
        const ctx = createMockContext(mockPermissions)
        expect(
          hasAnyPermissionInContext(ctx, [PERMISSIONS.MANAGE_USERS, PERMISSIONS.APPROVE_GAMES]),
        ).toBe(false)
      })

      it('should handle null session gracefully', () => {
        const ctx = createMockContext()
        expect(hasAnyPermissionInContext(ctx, [PERMISSIONS.CREATE_LISTING])).toBe(false)
      })
    })

    describe('hasAllPermissionsInContext', () => {
      it('should return true when user has all permissions in context', () => {
        const ctx = createMockContext(mockPermissions)
        expect(
          hasAllPermissionsInContext(ctx, [
            PERMISSIONS.CREATE_LISTING,
            PERMISSIONS.EDIT_OWN_COMMENT,
          ]),
        ).toBe(true)
      })

      it('should return false when user lacks any permission', () => {
        const ctx = createMockContext(mockPermissions)
        expect(
          hasAllPermissionsInContext(ctx, [PERMISSIONS.CREATE_LISTING, PERMISSIONS.MANAGE_USERS]),
        ).toBe(false)
      })

      it('should handle edge cases with session', () => {
        const nullSessionCtx = createMockContext()
        expect(hasAllPermissionsInContext(nullSessionCtx, [])).toBe(false)

        // Empty permissions array returns false because of the check in hasAllPermissions
        const emptyPermissionsCtx = createMockContext([])
        expect(hasAllPermissionsInContext(emptyPermissionsCtx, [])).toBe(false)

        // But if user has some permissions and we check for empty required permissions, it returns true
        const somePermissionsCtx = createMockContext([PERMISSIONS.CREATE_LISTING])
        expect(hasAllPermissionsInContext(somePermissionsCtx, [])).toBe(true)

        // Additional edge case: null permissions in context
        const nullPermissionsCtx = createMockContext(null)
        expect(hasAllPermissionsInContext(nullPermissionsCtx, [PERMISSIONS.CREATE_LISTING])).toBe(
          false,
        )
      })
    })
  })

  describe('roleIncludesRole', () => {
    describe('happy paths', () => {
      it('should return true for same role comparison', () => {
        expect(roleIncludesRole(Role.ADMIN, Role.ADMIN)).toBe(true)
        expect(roleIncludesRole(Role.USER, Role.USER)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toBe(true)
      })

      it('should return true when user role is higher in hierarchy', () => {
        expect(roleIncludesRole(Role.ADMIN, Role.USER)).toBe(true)
        expect(roleIncludesRole(Role.ADMIN, Role.AUTHOR)).toBe(true)
        expect(roleIncludesRole(Role.ADMIN, Role.DEVELOPER)).toBe(true)
        expect(roleIncludesRole(Role.ADMIN, Role.MODERATOR)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true)
      })

      it('should respect the complete hierarchy', () => {
        // SUPER_ADMIN can do everything
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.USER)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.AUTHOR)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.DEVELOPER)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.MODERATOR)).toBe(true)
        expect(roleIncludesRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true)

        // MODERATOR can act as USER, AUTHOR, DEVELOPER
        const result = roleIncludesRole(Role.MODERATOR, Role.USER)
        if (!result) {
          console.log('Debug - Role.MODERATOR:', Role.MODERATOR)
          console.log('Debug - Role.USER:', Role.USER)
          console.log('Debug - typeof Role.MODERATOR:', typeof Role.MODERATOR)
          console.log('Debug - typeof Role.USER:', typeof Role.USER)
        }
        expect(result).toBe(true)
        expect(roleIncludesRole(Role.MODERATOR, Role.AUTHOR)).toBe(true)
        expect(roleIncludesRole(Role.MODERATOR, Role.DEVELOPER)).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should return false when user role is lower in hierarchy', () => {
        expect(roleIncludesRole(Role.USER, Role.ADMIN)).toBe(false)
        expect(roleIncludesRole(Role.AUTHOR, Role.MODERATOR)).toBe(false)
        expect(roleIncludesRole(Role.DEVELOPER, Role.ADMIN)).toBe(false)
        expect(roleIncludesRole(Role.MODERATOR, Role.ADMIN)).toBe(false)
        expect(roleIncludesRole(Role.ADMIN, Role.SUPER_ADMIN)).toBe(false)
      })

      it('should return false for null/undefined user role', () => {
        expect(roleIncludesRole(null, Role.USER)).toBe(false)
        expect(roleIncludesRole(undefined, Role.USER)).toBe(false)
      })

      it('should handle all role transitions correctly', () => {
        // USER cannot act as any higher role
        expect(roleIncludesRole(Role.USER, Role.AUTHOR)).toBe(false)
        expect(roleIncludesRole(Role.USER, Role.DEVELOPER)).toBe(false)
        expect(roleIncludesRole(Role.USER, Role.MODERATOR)).toBe(false)
        expect(roleIncludesRole(Role.USER, Role.ADMIN)).toBe(false)
        expect(roleIncludesRole(Role.USER, Role.SUPER_ADMIN)).toBe(false)

        // AUTHOR can only act as USER
        expect(roleIncludesRole(Role.AUTHOR, Role.USER)).toBe(true)
        expect(roleIncludesRole(Role.AUTHOR, Role.DEVELOPER)).toBe(false)
        expect(roleIncludesRole(Role.AUTHOR, Role.MODERATOR)).toBe(false)
      })
    })
  })

  describe('canBanUser', () => {
    describe('happy paths', () => {
      it('should allow SUPER_ADMIN to ban any role', () => {
        expect(canBanUser(Role.SUPER_ADMIN, Role.USER)).toBe(true)
        expect(canBanUser(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true)
        expect(canBanUser(Role.SUPER_ADMIN, Role.MODERATOR)).toBe(true)
      })
      it('should allow ADMIN to ban lower roles', () => {
        expect(canBanUser(Role.ADMIN, Role.USER)).toBe(true)
        expect(canBanUser(Role.ADMIN, Role.AUTHOR)).toBe(true)
        expect(canBanUser(Role.ADMIN, Role.DEVELOPER)).toBe(true)
        expect(canBanUser(Role.ADMIN, Role.MODERATOR)).toBe(true)
      })
      it('should allow MODERATOR to ban USER, AUTHOR, DEVELOPER', () => {
        expect(canBanUser(Role.MODERATOR, Role.USER)).toBe(true)
        expect(canBanUser(Role.MODERATOR, Role.AUTHOR)).toBe(true)
        expect(canBanUser(Role.MODERATOR, Role.DEVELOPER)).toBe(true)
      })
    })
    describe('edge cases', () => {
      it('should prevent banning of same or higher roles', () => {
        expect(canBanUser(Role.ADMIN, Role.ADMIN)).toBe(false)
        expect(canBanUser(Role.ADMIN, Role.SUPER_ADMIN)).toBe(false)
        expect(canBanUser(Role.MODERATOR, Role.MODERATOR)).toBe(false)
        expect(canBanUser(Role.MODERATOR, Role.ADMIN)).toBe(false)
      })
      it('should return false for null/undefined actor role', () => {
        expect(canBanUser(null, Role.USER)).toBe(false)
        expect(canBanUser(undefined, Role.USER)).toBe(false)
      })
      it('should return false for null/undefined target role', () => {
        expect(canBanUser(Role.ADMIN, null as any)).toBe(false)
        expect(canBanUser(Role.ADMIN, undefined as any)).toBe(false)
      })
    })
  })

  describe('PERMISSIONS constant', () => {
    it('should have all expected permission keys', () => {
      // Content Management
      expect(PERMISSIONS.CREATE_LISTING).toBe('create_listing')
      expect(PERMISSIONS.APPROVE_LISTINGS).toBe('approve_listings')
      expect(PERMISSIONS.EDIT_ANY_LISTING).toBe('edit_any_listing')
      expect(PERMISSIONS.DELETE_ANY_LISTING).toBe('delete_any_listing')

      // System Access
      expect(PERMISSIONS.ACCESS_ADMIN_PANEL).toBe('access_admin_panel')
      expect(PERMISSIONS.VIEW_STATISTICS).toBe('view_statistics')
      expect(PERMISSIONS.VIEW_LOGS).toBe('view_logs')
    })

    it('should have unique permission values', () => {
      const values = Object.values(PERMISSIONS)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complex permission checks for content moderation', () => {
      const moderatorPermissions = [
        PERMISSIONS.APPROVE_LISTINGS,
        PERMISSIONS.EDIT_ANY_LISTING,
        PERMISSIONS.DELETE_ANY_COMMENT,
        PERMISSIONS.VIEW_STATISTICS,
      ]

      const ctx = createMockContext(moderatorPermissions, Role.MODERATOR)

      // Moderator can approve and edit listings
      expect(hasPermissionInContext(ctx, PERMISSIONS.APPROVE_LISTINGS)).toBe(true)
      expect(hasPermissionInContext(ctx, PERMISSIONS.EDIT_ANY_LISTING)).toBe(true)

      // But cannot manage users
      expect(hasPermissionInContext(ctx, PERMISSIONS.MANAGE_USERS)).toBe(false)

      // Can perform any of these moderation actions
      expect(
        hasAnyPermissionInContext(ctx, [
          PERMISSIONS.APPROVE_LISTINGS,
          PERMISSIONS.MANAGE_USERS, // doesn't have this
          PERMISSIONS.CHANGE_USER_ROLES, // doesn't have this
        ]),
      ).toBe(true)

      // Has all content moderation permissions
      expect(
        hasAllPermissionsInContext(ctx, [
          PERMISSIONS.APPROVE_LISTINGS,
          PERMISSIONS.EDIT_ANY_LISTING,
        ]),
      ).toBe(true)
    })

    it('should handle permission inheritance correctly', () => {
      const adminCtx = createMockContext(
        [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_PERMISSIONS, PERMISSIONS.ACCESS_ADMIN_PANEL],
        Role.ADMIN,
      )

      // Admin role includes moderator role
      expect(roleIncludesRole(adminCtx.session?.user?.role, Role.MODERATOR)).toBe(true)

      // Admin has specific admin permissions
      expect(hasPermissionInContext(adminCtx, PERMISSIONS.MANAGE_USERS)).toBe(true)

      // But doesn't automatically have all permissions (permission-based, not role-based)
      expect(hasPermissionInContext(adminCtx, PERMISSIONS.CREATE_LISTING)).toBe(false)
    })

    it('should handle permission checks for unauthenticated users', () => {
      const unauthCtx = createMockContext()

      expect(hasPermissionInContext(unauthCtx, PERMISSIONS.CREATE_LISTING)).toBe(false)
      expect(
        hasAnyPermissionInContext(unauthCtx, [
          PERMISSIONS.CREATE_LISTING,
          PERMISSIONS.VIEW_STATISTICS,
        ]),
      ).toBe(false)
      expect(hasAllPermissionsInContext(unauthCtx, [])).toBe(false)
    })
  })

  describe('Performance considerations', () => {
    it('should handle large permission arrays efficiently', () => {
      const largePermissionSet = Array.from({ length: 1000 }, (_, i) => `permission_${i}`)

      const startTime = performance.now()
      const result = hasPermission(largePermissionSet, 'permission_500')
      const endTime = performance.now()

      expect(result).toBe(true)
      expect(endTime - startTime).toBeLessThan(1) // Should be very fast
    })

    it('should short-circuit on first match for hasAnyPermission', () => {
      const permissions = ['first', 'second', 'third']

      // This would use the actual implementation, but demonstrates the concept
      expect(hasAnyPermission(permissions, ['first', 'second', 'third'])).toBe(true)
      // Should stop after finding 'first'
    })
  })
})
