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
    href: '/admin/emulators',
    label: 'Emulators',
    exact: false,
    description: 'Manage emulators.',
  },
  {
    href: '/admin/performance',
    label: 'Performance Scales',
    exact: true,
    description: 'Manage performance scales.',
  },
  {
    href: '/admin/approvals',
    label: 'Listing Approvals',
    exact: true,
    description: 'Manage listing approvals.',
  },
]

export const superAdminNavItems: AdminNavItem[] = [
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
]
