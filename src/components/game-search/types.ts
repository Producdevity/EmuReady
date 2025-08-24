// Common types for game search functionality across all providers (IGDB, TGDB, RAWG)

import type { System } from '@orm'

export type GameProvider = 'igdb' | 'tgdb' | 'rawg'

/**
 * Base game result interface that all providers must implement
 * Providers can extend this with additional fields
 */
export interface BaseGameResult {
  id: string | number
  name: string
  releaseDate?: string | Date | null
  platforms?: { id?: number; name: string }[]
  genres?: { id?: number; name: string }[]
  imageUrl: string | null
  boxartUrl: string | null
  bannerUrl: string | null
  summary?: string | null
  isErotic: boolean
}

export interface GameSearchFormProps {
  onSearch: (query: string, platformId: number | null, systemId: string | null) => void
  systems: System[]
  initialQuery?: string
  initialSystemId?: string
  isSearching: boolean
  provider: GameProvider
  showModeratorFeatures?: boolean
}

export interface GameSearchResultsProps<T extends BaseGameResult = BaseGameResult> {
  results: {
    games: T[]
    count: number
  } | null
  onGameSelect: (game: T) => void
  existingGames?: Record<string, string>
  currentSystemId?: string
  provider: GameProvider
}

export interface GamePreviewModalProps<T extends BaseGameResult = BaseGameResult> {
  game: T | null
  isOpen: boolean
  onClose: () => void
  onSelect: (systemId: string) => void | Promise<void>
  systems: System[]
  isSelecting: boolean
  existingGames?: Record<string, string>
  currentSystemId?: string
  provider: GameProvider
}
