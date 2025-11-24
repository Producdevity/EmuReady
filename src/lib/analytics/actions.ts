// Analytics Event Categories
export const ANALYTICS_CATEGORIES = {
  ERROR: 'error',
  FILTER: 'filter',
  ENGAGEMENT: 'engagement',
  LISTING: 'listing',
  USER: 'user',
  NAVIGATION: 'navigation',
  PERFORMANCE: 'performance',
  ADMIN: 'admin',
  USER_JOURNEY: 'user_journey',
  CONTENT_DISCOVERY: 'content_discovery',
  TRUST: 'trust',
  CONVERSION: 'conversion',
  CONTENT_QUALITY: 'content_quality',
  SESSION: 'session',
} as const

// Error Actions
export const ERROR_ACTIONS = {
  IMAGE_LOAD_ERROR: 'image_load_error',
} as const

// Filter Actions
export const FILTER_ACTIONS = {
  LISTINGS_COMBINED: 'listings_combined',
  PC_LISTINGS_COMBINED: 'pc_listings_combined',
  PAGE: 'page',
  SORT: 'sort',
  MY_LISTINGS: 'my_listings',
  SYSTEM: 'system',
  DEVICE: 'device',
  SOC: 'soc',
  EMULATOR: 'emulator',
  PERFORMANCE: 'performance',
  SEARCH: 'search',
  CLEAR_ALL: 'clear_all',
  CLEAR_DEVICE_FILTER: 'clear_device_filter',
  CLEAR_SYSTEM_FILTER: 'clear_system_filter',
  CLEAR_EMULATOR_FILTER: 'clear_emulator_filter',
  CLEAR_SOC_FILTER: 'clear_soc_filter',
} as const

// Engagement Actions
export const ENGAGEMENT_ACTIONS = {
  COMMENT_CREATED: 'comment_created',
  COMMENT_DELETED: 'comment_deleted',
  COMMENT_EDITED: 'comment_edited',
  COMMENT_REPLY: 'comment_reply',
  COMMENT_VOTE_DOWN: 'comment_vote_down',
  COMMENT_VOTE_UP: 'comment_vote_up',
  GAME_VIEW: 'game_view',
  LISTING_VIEW: 'listing_view',
  STOP_KILLING_GAMES_CTA: 'stop_killing_games_cta',
  USER_PROFILE_VIEW: 'user_profile_view',
  VOTE_DOWN: 'vote_down',
  VOTE_REMINDER_CLICKED: 'vote_reminder_clicked',
  VOTE_REMINDER_DISMISSED: 'vote_reminder_dismissed',
  STOP_KILLING_GAMES_DISMISSED: 'stop_killing_games_dismissed',
  VOTE_REMINDER_SHOWN: 'vote_reminder_shown',
  VOTE_REMOVED: 'vote_removed',
  VOTE_UP: 'vote_up',
} as const

// Listing Actions
export const LISTING_ACTIONS = {
  CREATED: 'created',
  EDITED: 'edited',
  DELETED: 'deleted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SHARED: 'shared',
} as const

// User Actions
export const USER_ACTIONS = {
  SIGNED_UP: 'signed_up',
  SIGNED_IN: 'signed_in',
  NOT_IN_DATABASE: 'not_in_database',
  PROFILE_UPDATED: 'profile_updated',
  PREFERENCES_UPDATED: 'preferences_updated',
  DEVICE_PREFERENCE_ADDED: 'device_preference_added',
  SOC_PREFERENCE_ADDED: 'soc_preference_added',
} as const

// Navigation Actions
export const NAVIGATION_ACTIONS = {
  PAGE_VIEW: 'page_view',
  PAGE_NOT_FOUND: 'page_not_found',
  MENU_ITEM_CLICKED: 'menu_item_clicked',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_TOGGLE: 'filter_toggle',
} as const

// Performance Actions
export const PERFORMANCE_ACTIONS = {
  SLOW_QUERY: 'slow_query',
  ERROR_OCCURRED: 'error_occurred',
  PAGE_LOAD_TIME: 'page_load_time',
  SESSION_DURATION: 'session_duration',
} as const

// Admin Actions
export const ADMIN_ACTIONS = {
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_BULK_APPROVED: 'listing_bulk_approved',
  LISTING_BULK_REJECTED: 'listing_bulk_rejected',
  GAME_APPROVED: 'game_approved',
  GAME_REJECTED: 'game_rejected',
  GAME_BULK_APPROVED: 'game_bulk_approved',
  GAME_BULK_REJECTED: 'game_bulk_rejected',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_DELETED: 'user_deleted',
  BULK_OPERATION: 'bulk_operation',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_APPLIED: 'template_applied',
  ENTITY_CREATED: 'entity_created',
  ENTITY_UPDATED: 'entity_updated',
  ENTITY_DELETED: 'entity_deleted',
} as const

// User Journey Actions
export const USER_JOURNEY_ACTIONS = {
  REGISTRATION_STARTED: 'registration_started',
  REGISTRATION_COMPLETED: 'registration_completed',
  FIRST_LOGIN: 'first_login',
  FIRST_LISTING_CREATED: 'first_listing_created',
  FIRST_VOTE_CAST: 'first_vote_cast',
  FIRST_COMMENT_POSTED: 'first_comment_posted',
  BECAME_ACTIVE_USER: 'became_active_user',
  BECAME_POWER_USER: 'became_power_user',
  PROFILE_COMPLETED: 'profile_completed',
  PREFERENCES_SET: 'preferences_set',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const

// Content Discovery Actions
export const CONTENT_DISCOVERY_ACTIONS = {
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_NO_RESULTS: 'search_no_results',
  SEARCH_RESULTS_CLICKED: 'search_results_clicked',
  AUTOCOMPLETE_SELECTED: 'autocomplete_selected',
  POPULAR_CONTENT_VIEWED: 'popular_content_viewed',
  RELATED_CONTENT_CLICKED: 'related_content_clicked',
  CONTENT_SHARED: 'content_shared',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  FILTER_APPLIED: 'filter_applied',
  SORT_APPLIED: 'sort_applied',
  HOMEPAGE_EMULATOR_CLICKED: 'homepage_emulator_clicked',
  HOMEPAGE_EMULATOR_HANDHELD_CLICKED: 'homepage_emulator_handheld_clicked',
  HOMEPAGE_EMULATOR_PC_CLICKED: 'homepage_emulator_pc_clicked',
  HOMEPAGE_DEVICE_CLICKED: 'homepage_device_clicked',
  HOMEPAGE_VIEW_ALL_EMULATORS_CLICKED: 'homepage_view_all_emulators_clicked',
  HOMEPAGE_VIEW_ALL_DEVICES_CLICKED: 'homepage_view_all_devices_clicked',
  HOMEPAGE_GAME_SEARCH_PERFORMED: 'homepage_game_search_performed',
} as const

// Trust System Actions
export const TRUST_ACTIONS_ANALYTICS = {
  TRUST_SCORE_INCREASED: 'trust_score_increased',
  TRUST_SCORE_DECREASED: 'trust_score_decreased',
  TRUST_LEVEL_UP: 'trust_level_up',
  TRUST_LEVEL_DOWN: 'trust_level_down',
  TRUST_ACTION_LOGGED: 'trust_action_logged',
  REPUTATION_MILESTONE: 'reputation_milestone',
} as const

// Session Actions
export const SESSION_ACTIONS = {
  PAGE_VIEW: 'page_view',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  TIME_SPENT: 'time_spent',
  SCROLL_DEPTH: 'scroll_depth',
  INTERACTION_RATE: 'interaction_rate',
  DAILY_ACTIVE_USER: 'daily_active_user',
  WEEKLY_ACTIVE_USER: 'weekly_active_user',
  MONTHLY_ACTIVE_USER: 'monthly_active_user',
  USER_RETURNED: 'user_returned',
  FEATURE_DISCOVERED: 'feature_discovered',
  FEATURE_ADOPTED: 'feature_adopted',
} as const

// Content Quality Actions
export const CONTENT_QUALITY_ACTIONS = {
  CONTENT_FLAGGED: 'content_flagged',
  CONTENT_REPORTED: 'content_reported',
  CONTENT_MODERATED: 'content_moderated',
  SPAM_DETECTED: 'spam_detected',
  QUALITY_SCORE_CALCULATED: 'quality_score_calculated',
} as const

// Conversion Actions
export const CONVERSION_ACTIONS = {
  FUNNEL_STEP_COMPLETED: 'funnel_step_completed',
  CONVERSION_GOAL_REACHED: 'conversion_goal_reached',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  FEATURE_UNLOCKED: 'feature_unlocked',
  APP_DOWNLOAD_CLICKED: 'app_download_clicked',
} as const
