const PREFIX = process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX ?? '@EmuReady_'

const storageKeys = {
  theme: `${PREFIX}theme`,
  columnVisibility: {
    listings: `${PREFIX}listings_column_visibility`,
    games: `${PREFIX}games_column_visibility`,
    adminApprovals: `${PREFIX}admin_approvals_column_visibility`,
    adminBrands: `${PREFIX}admin_brands_column_visibility`,
    adminDevices: `${PREFIX}admin_devices_column_visibility`,
    adminEmulators: `${PREFIX}admin_emulators_column_visibility`,
    adminGames: `${PREFIX}admin_games_column_visibility`,
    adminPerformance: `${PREFIX}admin_performance_column_visibility`,
    adminProcessedListings: `${PREFIX}admin_processed_listings_column_visibility`,
    adminSystems: `${PREFIX}admin_systems_column_visibility`,
    adminUsers: `${PREFIX}admin_users_column_visibility`,
  },
} as const

export default storageKeys
