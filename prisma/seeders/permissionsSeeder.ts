import { type PrismaClient, Role, PermissionCategory } from '@orm'

interface PermissionDefinition {
  key: string
  label: string
  description: string
  category: PermissionCategory
  isSystem: boolean
}

interface RolePermissionAssignment {
  role: Role
  permissions: string[] // permission keys
}

// Core permissions based on current functionality
const permissions: PermissionDefinition[] = [
  // Content Management
  {
    key: 'create_listing',
    label: 'Create Listing',
    description: 'Create new compatibility listings',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'approve_listings',
    label: 'Approve Listings',
    description: 'Approve or reject submitted listings',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'edit_any_listing',
    label: 'Edit Any Listing',
    description: "Edit any user's listing",
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'delete_any_listing',
    label: 'Delete Any Listing',
    description: "Delete any user's listing",
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },

  // Comment Management
  {
    key: 'edit_own_comment',
    label: 'Edit Own Comment',
    description: 'Edit your own comments',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'delete_own_comment',
    label: 'Delete Own Comment',
    description: 'Delete your own comments',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'edit_any_comment',
    label: 'Edit Any Comment',
    description: "Edit any user's comment",
    category: PermissionCategory.MODERATION,
    isSystem: true,
  },
  {
    key: 'delete_any_comment',
    label: 'Delete Any Comment',
    description: "Delete any user's comment",
    category: PermissionCategory.MODERATION,
    isSystem: true,
  },

  // Game Management
  {
    key: 'edit_games',
    label: 'Edit Games',
    description: 'Edit game information and details',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'delete_games',
    label: 'Delete Games',
    description: 'Delete games from the system',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'manage_games',
    label: 'Manage Games',
    description: 'Add, edit, and approve games',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'approve_games',
    label: 'Approve Games',
    description: 'Approve or reject submitted games',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },

  // Emulator Management
  {
    key: 'manage_emulators',
    label: 'Manage Emulators',
    description: 'Create, edit, and manage emulators',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'manage_custom_fields',
    label: 'Manage Custom Fields',
    description: 'Create and manage custom field definitions',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
  {
    key: 'manage_emulator_verified_developers',
    label: 'Manage Verified Developers',
    description: 'Verify and manage emulator developers',
    category: PermissionCategory.USER_MANAGEMENT,
    isSystem: true,
  },

  // User Management
  {
    key: 'manage_users',
    label: 'Manage Users',
    description: 'View and manage user accounts',
    category: PermissionCategory.USER_MANAGEMENT,
    isSystem: true,
  },
  {
    key: 'change_user_roles',
    label: 'Change User Roles',
    description: 'Modify user roles',
    category: PermissionCategory.USER_MANAGEMENT,
    isSystem: true,
  },
  {
    key: 'modify_super_admin_users',
    label: 'Modify Super Admin Users',
    description: 'Modify super admin user accounts',
    category: PermissionCategory.USER_MANAGEMENT,
    isSystem: true,
  },

  // User Moderation
  {
    key: 'view_user_bans',
    label: 'View User Bans',
    description: 'View banned users and ban details',
    category: PermissionCategory.MODERATION,
    isSystem: true,
  },
  {
    key: 'manage_user_bans',
    label: 'Manage User Bans',
    description: 'Create, update, and manage user bans',
    category: PermissionCategory.MODERATION,
    isSystem: true,
  },

  // System Access
  {
    key: 'access_admin_panel',
    label: 'Access Admin Panel',
    description: 'Access the admin dashboard',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },
  {
    key: 'view_statistics',
    label: 'View Statistics',
    description: 'View system statistics and analytics',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },
  {
    key: 'view_logs',
    label: 'View Logs',
    description: 'View system logs and audit trails',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },

  // Permission Management
  {
    key: 'manage_permissions',
    label: 'Manage Permissions',
    description: 'Create, edit, and assign permissions to roles',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },
  {
    key: 'view_permission_logs',
    label: 'View Permission Logs',
    description: 'View permission change logs',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },

  // Trust System
  {
    key: 'manage_trust_system',
    label: 'Manage Trust System',
    description: 'Manage user trust scores and actions',
    category: PermissionCategory.USER_MANAGEMENT,
    isSystem: true,
  },
  {
    key: 'view_trust_logs',
    label: 'View Trust Logs',
    description: 'View trust action logs',
    category: PermissionCategory.SYSTEM,
    isSystem: true,
  },

  // Device Management
  {
    key: 'manage_devices',
    label: 'Manage Devices',
    description: 'Create and manage devices and SoCs',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },

  // System Management
  {
    key: 'manage_systems',
    label: 'Manage Systems',
    description: 'Create and manage gaming systems/platforms',
    category: PermissionCategory.CONTENT,
    isSystem: true,
  },
]

// Default role-permission assignments based on current hierarchy
const rolePermissionAssignments: RolePermissionAssignment[] = [
  {
    role: Role.USER,
    permissions: ['create_listing', 'edit_own_comment', 'delete_own_comment'],
  },
  {
    role: Role.AUTHOR,
    permissions: ['create_listing', 'edit_own_comment', 'delete_own_comment'],
  },
  {
    role: Role.DEVELOPER,
    permissions: [
      'create_listing',
      'edit_own_comment',
      'delete_own_comment',
      'access_admin_panel',
      'manage_emulators', // For emulators they're verified for
      'manage_custom_fields', // For their emulators
    ],
  },
  {
    role: Role.MODERATOR,
    permissions: [
      'create_listing',
      'edit_own_comment',
      'delete_own_comment',
      'access_admin_panel',
      'approve_listings',
      'edit_any_listing',
      'delete_any_comment',
      'edit_games',
      'approve_games',
      'view_user_bans',
      'view_statistics',
      'view_logs',
      'view_trust_logs',
    ],
  },
  {
    role: Role.ADMIN,
    permissions: [
      'create_listing',
      'edit_own_comment',
      'delete_own_comment',
      'access_admin_panel',
      'approve_listings',
      'edit_any_listing',
      'delete_any_listing',
      'delete_any_comment',
      'edit_games',
      'delete_games',
      'manage_games',
      'approve_games',
      'manage_emulators',
      'manage_custom_fields',
      'manage_emulator_verified_developers',
      'manage_users',
      'change_user_roles',
      'view_user_bans',
      'manage_user_bans',
      'view_statistics',
      'view_logs',
      'manage_trust_system',
      'view_trust_logs',
      'manage_devices',
      'manage_systems',
    ],
  },
  {
    role: Role.SUPER_ADMIN,
    permissions: [
      // All permissions
      'create_listing',
      'edit_own_comment',
      'delete_own_comment',
      'access_admin_panel',
      'approve_listings',
      'edit_any_listing',
      'delete_any_listing',
      'edit_any_comment',
      'delete_any_comment',
      'edit_games',
      'delete_games',
      'manage_games',
      'approve_games',
      'manage_emulators',
      'manage_custom_fields',
      'manage_emulator_verified_developers',
      'manage_users',
      'change_user_roles',
      'modify_super_admin_users',
      'view_user_bans',
      'manage_user_bans',
      'view_statistics',
      'view_logs',
      'manage_permissions',
      'view_permission_logs',
      'manage_trust_system',
      'view_trust_logs',
      'manage_devices',
      'manage_systems',
    ],
  },
]

export default async function permissionsSeeder(prisma: PrismaClient) {
  console.info('🔐 Seeding permissions...')

  // Create permissions
  console.info('  Creating permissions...')
  for (const permission of permissions) {
    try {
      await prisma.permission.upsert({
        where: { key: permission.key },
        update: {
          label: permission.label,
          description: permission.description,
          category: permission.category,
          isSystem: permission.isSystem,
        },
        create: permission,
      })
      console.info(`    ✓ ${permission.key}`)
    } catch (error) {
      console.error(
        `    ✗ Failed to create permission ${permission.key}:`,
        error,
      )
    }
  }

  // Assign permissions to roles
  console.info('  Assigning permissions to roles...')
  for (const assignment of rolePermissionAssignments) {
    console.info(`    Assigning permissions to ${assignment.role}...`)

    for (const permissionKey of assignment.permissions) {
      try {
        const permission = await prisma.permission.findUnique({
          where: { key: permissionKey },
        })

        if (!permission) {
          console.warn(`    ⚠️  Permission not found: ${permissionKey}`)
          continue
        }

        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: assignment.role,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            role: assignment.role,
            permissionId: permission.id,
          },
        })
        console.info(`      ✓ ${permissionKey}`)
      } catch (error) {
        console.error(
          `      ✗ Failed to assign ${permissionKey} to ${assignment.role}:`,
          error,
        )
      }
    }
  }

  console.info('✅ Permissions seeded successfully!')
}
