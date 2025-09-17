import { ADMIN_ROUTES } from './config/routes'

export interface AdminNavItem {
  href: string
  label: string
  description: string
  exact: boolean
  count?: number
}

export const adminNavItems: AdminNavItem[] = [
  {
    href: ADMIN_ROUTES.SYSTEMS,
    label: 'Systems',
    exact: true,
    description: 'Manage game systems and platforms.',
  },
  {
    href: ADMIN_ROUTES.GAMES,
    label: 'Games',
    exact: true,
    description: 'Manage games and view related data.',
  },
  {
    href: ADMIN_ROUTES.GAME_APPROVALS,
    label: 'Game Approvals',
    exact: true,
    description: 'Review and approve submitted games.',
  },
  {
    href: ADMIN_ROUTES.LISTING_APPROVALS,
    label: 'Handheld Approvals',
    exact: true,
    description: 'Manage Handheld listing approvals.',
  },
  {
    href: ADMIN_ROUTES.PC_LISTING_APPROVALS,
    label: 'PC Approvals',
    exact: true,
    description: 'Manage PC listing approvals.',
  },
  {
    href: ADMIN_ROUTES.BRANDS,
    label: 'Brands',
    exact: true,
    description: 'Manage device brands.',
  },
  {
    href: ADMIN_ROUTES.SOCS,
    label: 'SoCs',
    exact: true,
    description: 'Manage System on Chip specifications.',
  },
  {
    href: ADMIN_ROUTES.DEVICES,
    label: 'Devices',
    exact: true,
    description: 'Manage devices.',
  },
  {
    href: ADMIN_ROUTES.CPUS,
    label: 'CPUs',
    exact: true,
    description: 'Manage CPU models for PC compatibility.',
  },
  {
    href: ADMIN_ROUTES.GPUS,
    label: 'GPUs',
    exact: true,
    description: 'Manage GPU models for PC compatibility.',
  },
  {
    href: ADMIN_ROUTES.EMULATORS,
    label: 'Emulators',
    exact: false,
    description: 'Manage emulators.',
  },
  {
    href: ADMIN_ROUTES.VERIFIED_DEVELOPERS,
    label: 'Verified Developers',
    exact: true,
    description: 'Manage verified developers for emulators.',
  },
  {
    href: ADMIN_ROUTES.TITLE_ID_TOOLS,
    label: 'Title ID Tools',
    exact: true,
    description: 'Test title ID provider lookups.',
  },
]

export const superAdminNavItems: AdminNavItem[] = [
  {
    href: ADMIN_ROUTES.PERFORMANCE,
    label: 'Performance',
    exact: false,
    description: 'View platform performance and analytics.',
  },
  {
    href: ADMIN_ROUTES.USERS,
    label: 'Users',
    exact: false,
    description: 'Manage user accounts.',
  },
  {
    href: ADMIN_ROUTES.MANAGE_LISTINGS,
    label: 'Manage Listings',
    exact: false,
    description: 'Edit and manage all listings.',
  },
  {
    href: ADMIN_ROUTES.PROCESSED_LISTINGS,
    label: 'Processed Listings',
    exact: true,
    description: 'View all processed listings.',
  },
  {
    href: ADMIN_ROUTES.REPORTS,
    label: 'Reports',
    exact: true,
    description: 'Review and manage user reports.',
  },
  {
    href: ADMIN_ROUTES.USER_BANS,
    label: 'User Bans',
    exact: true,
    description: 'Manage user bans and suspensions.',
  },
  {
    href: ADMIN_ROUTES.FIELD_TEMPLATES,
    label: 'Field Templates',
    exact: false,
    description: 'Manage custom field templates.',
  },
  {
    href: ADMIN_ROUTES.TRUST_LOGS,
    label: 'Trust Logs',
    exact: true,
    description: 'Monitor trust system activity and scores.',
  },
  {
    href: ADMIN_ROUTES.PERMISSIONS,
    label: 'Permissions',
    exact: false,
    description: 'Manage roles and permissions.',
  },
  {
    href: ADMIN_ROUTES.MONITORING,
    label: 'System Monitoring',
    exact: true,
    description: 'Monitor system performance and metrics.',
  },
  {
    href: ADMIN_ROUTES.PERMISSION_LOGS,
    label: 'Permission Logs',
    exact: true,
    description: 'Monitor permission changes and audit trail.',
  },
  {
    href: ADMIN_ROUTES.AUDIT_LOGS,
    label: 'Audit Logs',
    exact: true,
    description: 'System-wide audit trail for sensitive actions.',
  },
  {
    href: ADMIN_ROUTES.BADGES,
    label: 'Badges',
    exact: true,
    description: 'Manage user badges and assignments.',
  },
]

export const moderatorNavItems: AdminNavItem[] = [
  {
    href: ADMIN_ROUTES.GAMES,
    label: 'Games',
    exact: true,
    description: 'Manage games and view related data.',
  },
  {
    href: ADMIN_ROUTES.GAME_APPROVALS,
    label: 'Game Approvals',
    exact: true,
    description: 'Review and approve submitted games.',
  },
  {
    href: ADMIN_ROUTES.LISTING_APPROVALS,
    label: 'Handheld Listing Approvals',
    exact: true,
    description: 'Manage Handheld listing approvals.',
  },
  {
    href: ADMIN_ROUTES.PC_LISTING_APPROVALS,
    label: 'PC Listing Approvals',
    exact: true,
    description: 'Manage PC listing approvals.',
  },
  {
    href: ADMIN_ROUTES.DEVICES,
    label: 'Devices',
    exact: true,
    description: 'Manage devices.',
  },
  {
    href: ADMIN_ROUTES.CPUS,
    label: 'CPUs',
    exact: true,
    description: 'Manage CPU models for PC compatibility.',
  },
  {
    href: ADMIN_ROUTES.GPUS,
    label: 'GPUs',
    exact: true,
    description: 'Manage GPU models for PC compatibility.',
  },
  {
    href: ADMIN_ROUTES.SOCS,
    label: 'SoCs',
    exact: true,
    description: 'Manage System on Chip specifications.',
  },
  {
    href: ADMIN_ROUTES.TITLE_ID_TOOLS,
    label: 'Title ID Tools',
    exact: true,
    description: 'Test handheld title ID lookups.',
  },
  {
    href: ADMIN_ROUTES.REPORTS,
    label: 'Reports',
    exact: true,
    description: 'Review and manage user reports.',
  },
  {
    href: ADMIN_ROUTES.USERS,
    label: 'Users',
    exact: true,
    description: 'View and manage all users.',
  },
  {
    href: ADMIN_ROUTES.USER_BANS,
    label: 'User Bans',
    exact: true,
    description: 'Manage user bans and suspensions.',
  },
]

/**
 * Returns navigation items for a developer based on their emulator access
 * @param emulatorIds - Array of emulator IDs the developer has access to
 */
export function getDeveloperNavItems(emulatorIds: string[]): AdminNavItem[] {
  if (!emulatorIds.length) return []

  const navItems: AdminNavItem[] = []

  // Always include approvals page for developers
  navItems.push({
    href: ADMIN_ROUTES.LISTING_APPROVALS,
    label: 'My Emulator Approvals',
    exact: true,
    description: 'Review and approve listings for your verified emulators.',
  })

  // Include PC listing approvals for developers as well
  navItems.push({
    href: ADMIN_ROUTES.PC_LISTING_APPROVALS,
    label: 'My PC Approvals',
    exact: true,
    description: 'Review and approve PC listings for your verified emulators.',
  })

  // If multiple emulators, link to general emulators page; if single, link directly to that emulator's fields
  const emulatorNavItem: AdminNavItem =
    emulatorIds.length > 1
      ? {
          href: ADMIN_ROUTES.EMULATORS,
          label: 'My Emulators',
          exact: false,
          description: 'Manage your emulators.',
        }
      : {
          href: `${ADMIN_ROUTES.EMULATORS}/${emulatorIds[0]}/custom-fields`,
          label: 'My Emulator Fields',
          exact: false,
          description: 'Manage custom fields for your emulator.',
        }

  navItems.push(emulatorNavItem)

  navItems.push({
    href: ADMIN_ROUTES.TITLE_ID_TOOLS,
    label: 'Title ID Tools',
    exact: true,
    description: 'Test handheld title ID lookups.',
  })

  return navItems
}

/**
 * Server-side function to get developer navigation items for a user
 * @param userId - The developer user ID
 */
export async function getDeveloperNavItemsForUser(userId: string): Promise<AdminNavItem[]> {
  const { prisma } = await import('@/server/db')

  const verifiedEmulators = await prisma.verifiedDeveloper.findMany({
    where: { userId },
    select: { emulatorId: true },
  })

  const emulatorIds = verifiedEmulators.map((ve) => ve.emulatorId)
  return getDeveloperNavItems(emulatorIds)
}
