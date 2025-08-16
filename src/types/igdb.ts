// IGDB API Response Types

export interface IGDBImage {
  id: number
  game?: number
  height: number
  width: number
  image_id: string
  url: string
  checksum?: string
}

export interface IGDBCover {
  id: number
  game?: number
  height: number
  width: number
  image_id: string
  url: string
  checksum?: string
  animated?: boolean
}

export interface IGDBArtwork {
  id: number
  game?: number
  height: number
  width: number
  image_id: string
  url: string
  checksum?: string
}

export interface IGDBScreenshot {
  id: number
  game?: number
  height: number
  width: number
  image_id: string
  url: string
  checksum?: string
}

export interface IGDBPlatform {
  id: number
  abbreviation?: string
  alternative_name?: string
  category?: number
  created_at?: number
  generation?: number
  name: string
  platform_logo?: number
  slug?: string
  summary?: string
  updated_at?: number
  url?: string
  versions?: number[]
  websites?: number[]
}

export interface IGDBGenre {
  id: number
  created_at?: number
  name: string
  slug?: string
  updated_at?: number
  url?: string
}

export interface IGDBTheme {
  id: number
  created_at?: number
  name: string
  slug?: string
  updated_at?: number
  url?: string
}

export interface IGDBGame {
  id: number
  age_ratings?: number[]
  aggregated_rating?: number
  aggregated_rating_count?: number
  alternative_names?: string[]
  artworks?: IGDBArtwork[]
  bundles?: number[]
  category?: number
  checksum?: string
  collection?: number
  cover?: IGDBCover
  created_at?: number
  dlcs?: number[]
  expanded_games?: number[]
  expansions?: number[]
  external_games?: number[]
  first_release_date?: number
  follows?: number
  forks?: number[]
  franchise?: number
  franchises?: number[]
  game_engines?: number[]
  game_localizations?: number[]
  game_modes?: number[]
  genres?: IGDBGenre[]
  hypes?: number
  involved_companies?: number[]
  keywords?: number[]
  language_supports?: number[]
  multiplayer_modes?: number[]
  name: string
  parent_game?: number
  platforms?: IGDBPlatform[]
  player_perspectives?: number[]
  ports?: number[]
  rating?: number
  rating_count?: number
  release_dates?: number[]
  remakes?: number[]
  remasters?: number[]
  screenshots?: IGDBScreenshot[]
  similar_games?: number[]
  slug?: string
  standalone_expansions?: number[]
  status?: number
  storyline?: string
  summary?: string
  tags?: number[]
  themes?: IGDBTheme[]
  total_rating?: number
  total_rating_count?: number
  updated_at?: number
  url?: string
  version_parent?: number
  version_title?: string
  videos?: number[]
  websites?: number[]
}

export interface IGDBSearchResponse {
  games: IGDBGame[]
  count: number
}

// Helper type for image selection
export interface GameImageOption {
  url: string
  type: 'cover' | 'artwork' | 'screenshot' | 'banner'
  width?: number
  height?: number
}

// Category enums (for game categorization)
export enum IGDBGameCategory {
  MAIN_GAME = 0,
  DLC_ADDON = 1,
  EXPANSION = 2,
  BUNDLE = 3,
  STANDALONE_EXPANSION = 4,
  MOD = 5,
  EPISODE = 6,
  SEASON = 7,
  REMAKE = 8,
  REMASTER = 9,
  EXPANDED_GAME = 10,
  PORT = 11,
  FORK = 12,
  PACK = 13,
  UPDATE = 14,
}

// Theme IDs that indicate adult/NSFW content
export const IGDB_ADULT_THEME_IDS = [42] // 42 is the "Erotic" theme in IGDB

// Platform category enums
export enum IGDBPlatformCategory {
  CONSOLE = 1,
  ARCADE = 2,
  PLATFORM = 3,
  OPERATING_SYSTEM = 4,
  PORTABLE_CONSOLE = 5,
  COMPUTER = 6,
}
