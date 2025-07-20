import type { BaseFindParams } from '../types'
import type { Game, System } from '@orm'

export interface GameWithRelations extends Game {
  system: System
  _count: {
    listings: number
  }
}

export interface FindGamesParams extends BaseFindParams {
  systemId?: string
}

export interface GameStats {
  listingsCount: number
  averageSuccessRate: number
}

export interface GameWithStats extends GameWithRelations {
  stats: GameStats
}
