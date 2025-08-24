export interface AdminNavItem {
  href: string
  label: string
  description: string
  exact: boolean
  count?: number
}

export const adminNavItems: AdminNavItem[] = [
  {
    href: '/admin/systems',
    label: 'Systems',
    exact: true,
    description: 'Manage game systems and platforms.',
  },
  {
    href: '/admin/games',
    label: 'Games',
    exact: true,
    description: 'Manage games and view related data.',
  },
  {
    href: '/admin/games/approvals',
    label: 'Game Approvals',
    exact: true,
    description: 'Review and approve submitted games.',
  },
  {
    href: '/admin/approvals',
    label: 'Handheld Approvals',
    exact: true,
    description: 'Manage Handheld listing approvals.',
  },
  {
    href: '/admin/pc-listing-approvals',
    label: 'PC Approvals',
    exact: true,
    description: 'Manage PC listing approvals.',
  },
  {
    href: '/admin/brands',
    label: 'Brands',
    exact: true,
    description: 'Manage device brands.',
  },
  {
    href: '/admin/socs',
    label: 'SoCs',
    exact: true,
    description: 'Manage System on Chip specifications.',
  },
  {
    href: '/admin/devices',
    label: 'Devices',
    exact: true,
    description: 'Manage devices.',
  },
  {
    href: '/admin/cpus',
    label: 'CPUs',
    exact: true,
    description: 'Manage CPU models for PC compatibility.',
  },
  {
    href: '/admin/gpus',
    label: 'GPUs',
    exact: true,
    description: 'Manage GPU models for PC compatibility.',
  },
  {
    href: '/admin/emulators',
    label: 'Emulators',
    exact: false,
    description: 'Manage emulators.',
  },
  {
    href: '/admin/verified-developers',
    label: 'Verified Developers',
    exact: true,
    description: 'Manage verified developers for emulators.',
  },
]

export const superAdminNavItems: AdminNavItem[] = [
  {
    href: '/admin/performance',
    label: 'Performance',
    exact: false,
    description: 'View platform performance and analytics.',
  },
  {
    href: '/admin/users',
    label: 'Users',
    exact: false,
    description: 'Manage user accounts.',
  },
  {
    href: '/admin/listings',
    label: 'Manage Listings',
    exact: false,
    description: 'Edit and manage all listings.',
  },
  {
    href: '/admin/processed-listings',
    label: 'Processed Listings',
    exact: true,
    description: 'View all processed listings.',
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    exact: true,
    description: 'Review and manage user reports.',
  },
  {
    href: '/admin/user-bans',
    label: 'User Bans',
    exact: true,
    description: 'Manage user bans and suspensions.',
  },
  {
    href: '/admin/custom-field-templates',
    label: 'Field Templates',
    exact: false,
    description: 'Manage custom field templates.',
  },
  {
    href: '/admin/trust-logs',
    label: 'Trust Logs',
    exact: true,
    description: 'Monitor trust system activity and scores.',
  },
  {
    href: '/admin/permissions',
    label: 'Permissions',
    exact: false,
    description: 'Manage roles and permissions.',
  },
  {
    href: '/admin/monitoring',
    label: 'System Monitoring',
    exact: true,
    description: 'Monitor system performance and metrics.',
  },
  {
    href: '/admin/permission-logs',
    label: 'Permission Logs',
    exact: true,
    description: 'Monitor permission changes and audit trail.',
  },
  {
    href: '/admin/badges',
    label: 'Badges',
    exact: true,
    description: 'Manage user badges and assignments.',
  },
]

export const moderatorNavItems: AdminNavItem[] = [
  {
    href: '/admin/games',
    label: 'Games',
    exact: true,
    description: 'Manage games and view related data.',
  },
  {
    href: '/admin/games/approvals',
    label: 'Game Approvals',
    exact: true,
    description: 'Review and approve submitted games.',
  },
  {
    href: '/admin/approvals',
    label: 'Handheld Listing Approvals',
    exact: true,
    description: 'Manage Handheld listing approvals.',
  },
  {
    href: '/admin/pc-listing-approvals',
    label: 'PC Listing Approvals',
    exact: true,
    description: 'Manage PC listing approvals.',
  },
  {
    href: '/admin/devices',
    label: 'Devices',
    exact: true,
    description: 'Manage devices.',
  },
  {
    href: '/admin/cpus',
    label: 'CPUs',
    exact: true,
    description: 'Manage CPU models for PC compatibility.',
  },
  {
    href: '/admin/gpus',
    label: 'GPUs',
    exact: true,
    description: 'Manage GPU models for PC compatibility.',
  },
  {
    href: '/admin/socs',
    label: 'SoCs',
    exact: true,
    description: 'Manage System on Chip specifications.',
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    exact: true,
    description: 'Review and manage user reports.',
  },
  {
    href: '/admin/user-bans',
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
    href: '/admin/approvals',
    label: 'My Emulator Approvals',
    exact: true,
    description: 'Review and approve listings for your verified emulators.',
  })

  // If multiple emulators, show the main emulators page
  if (emulatorIds.length > 1) {
    navItems.push({
      href: '/admin/emulators',
      label: 'My Emulators',
      exact: false,
      description: 'Manage your emulators.',
    })
  } else {
    // If single emulator, direct link to that emulator
    navItems.push({
      href: `/admin/emulators/${emulatorIds[0]}`,
      label: 'My Emulator',
      exact: true,
      description: 'Manage your emulator.',
    })
  }

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
