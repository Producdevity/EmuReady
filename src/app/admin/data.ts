interface NavItem {
  href: string
  label: string
  description: string
  count?: number
}

export const adminNavItems: NavItem[] = [
  {
    href: '/admin/systems',
    label: 'Systems',
    description: 'Manage game systems and platforms.',
  },
  {
    href: '/admin/games',
    label: 'Games',
    description: 'Manage games and view related data.',
  },
  {
    href: '/admin/games/approvals',
    label: 'Game Approvals',
    description: 'Review and approve submitted games.',
  },
  {
    href: '/admin/brands',
    label: 'Brands',
    description: 'Manage device brands.',
  },
  {
    href: '/admin/socs',
    label: 'SoCs',
    description: 'Manage System on Chip specifications.',
  },
  {
    href: '/admin/devices',
    label: 'Devices',
    description: 'Manage devices.',
  },
  {
    href: '/admin/emulators',
    label: 'Emulators',
    description: 'Manage emulators.',
  },
  {
    href: '/admin/performance',
    label: 'Performance Scales',
    description: 'Manage performance scales.',
  },
  {
    href: '/admin/approvals',
    label: 'Listing Approvals',
    description: 'Manage listing approvals.',
  },
]

export const superAdminNavItems: NavItem[] = [
  {
    href: '/admin/users',
    label: 'Users',
    description: 'Manage user accounts.',
  },
  {
    href: '/admin/processed-listings',
    label: 'Processed Listings',
    description: 'View all processed listings.',
  },
  {
    href: '/admin/custom-field-templates',
    label: 'Field Templates',
    description: 'Manage custom field templates.',
  },
  {
    href: '/admin/trust-logs',
    label: 'Trust Logs',
    description: 'Monitor trust system activity and scores.',
  },
]
