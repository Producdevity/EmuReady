const PREFIX = process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX ?? '@EmuReady_'

const storageKeys = {
  theme: `${PREFIX}theme`,
  showSystemIcons: `${PREFIX}show_system_icons`,
  showEmulatorLogos: `${PREFIX}show_emulator_logos`,
  betaWarningDismissed: `${PREFIX}beta_warning_dismissed_v2`,
  voteReminderDismissed: `${PREFIX}vote_reminder_dismissed`,
  columnVisibility: {
    listings: `${PREFIX}listings_column_visibility`,
    games: `${PREFIX}games_column_visibility`,
    devices: `${PREFIX}devices_column_visibility`,
    emulators: `${PREFIX}emulators_column_visibility`,
    adminApprovals: `${PREFIX}admin_approvals_column_visibility`,
    adminGameApprovals: `${PREFIX}admin_game_approvals_column_visibility`,
    adminBrands: `${PREFIX}admin_brands_column_visibility`,
    adminDevices: `${PREFIX}admin_devices_column_visibility`,
    adminEmulators: `${PREFIX}admin_emulators_column_visibility`,
    adminGames: `${PREFIX}admin_games_column_visibility`,
    adminListings: `${PREFIX}admin_listings_column_visibility`,
    adminPerformance: `${PREFIX}admin_performance_column_visibility`,
    adminProcessedListings: `${PREFIX}admin_processed_listings_column_visibility`,
    adminSoCs: `${PREFIX}admin_socs_column_visibility`,
    adminSystems: `${PREFIX}admin_systems_column_visibility`,
    adminTrustLogs: `${PREFIX}admin_trust_logs_column_visibility`,
    adminUsers: `${PREFIX}admin_users_column_visibility`,
  },
} as const

export default storageKeys
