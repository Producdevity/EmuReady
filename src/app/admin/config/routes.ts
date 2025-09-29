/**
 * Centralized admin route configuration
 */

export const ADMIN_ROUTES = {
  // Dashboard
  DASHBOARD: '/admin',

  // Approvals
  GAME_APPROVALS: '/admin/games/approvals',
  LISTING_APPROVALS: '/admin/approvals',
  PC_LISTING_APPROVALS: '/admin/pc-listing-approvals',

  // Management
  GAMES: '/admin/games',
  SYSTEMS: '/admin/systems',
  EMULATORS: '/admin/emulators',
  DEVICES: '/admin/devices',
  CPUS: '/admin/cpus',
  GPUS: '/admin/gpus',
  SOCS: '/admin/socs',
  BRANDS: '/admin/brands',

  // Users & Permissions
  USERS: '/admin/users',
  USER_BANS: '/admin/user-bans',
  PERMISSIONS: '/admin/permissions',
  PERMISSION_LOGS: '/admin/permission-logs',
  AUDIT_LOGS: '/admin/audit-logs',
  VERIFIED_DEVELOPERS: '/admin/verified-developers',
  BADGES: '/admin/badges',

  // Tools
  TITLE_ID_TOOLS: '/admin/title-id-tools',
  API_ACCESS: '/admin/api-access',
  API_ACCESS_DEV: '/admin/api-access/developer',

  // Reports & Monitoring
  REPORTS: '/admin/reports',
  TRUST_LOGS: '/admin/trust-logs',
  MONITORING: '/admin/monitoring',
  PERFORMANCE: '/admin/performance',
  ANDROID_RELEASES: '/admin/releases',
  ENTITLEMENTS: '/admin/entitlements',

  // Listings
  MANAGE_LISTINGS: '/admin/listings',
  PROCESSED_LISTINGS: '/admin/processed-listings',

  // Custom Fields
  FIELD_TEMPLATES: '/admin/custom-field-templates',
} as const

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]

/**
 * Maps approval types to their routes
 */
export const APPROVAL_TYPE_ROUTES = {
  game: ADMIN_ROUTES.GAME_APPROVALS,
  listing: ADMIN_ROUTES.LISTING_APPROVALS,
  pcListing: ADMIN_ROUTES.PC_LISTING_APPROVALS,
} as const

/**
 * Get the approval route for a given type
 */
export function getApprovalRoute(type: keyof typeof APPROVAL_TYPE_ROUTES): string {
  return APPROVAL_TYPE_ROUTES[type] || ADMIN_ROUTES.DASHBOARD
}
