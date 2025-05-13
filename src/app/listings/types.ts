/**
 * Type definitions for the listings page and related components
 */

export interface System {
  id: string
  name: string
  _count: {
    games: number
  }
}

export interface Device {
  id: string
  brand: string
  modelName: string
}

export interface Emulator {
  id: string
  name: string
  _count?: {
    listings: number
  }
}

export interface PerformanceScale {
  id: number
  label: string
  rank: number
}

export interface Author {
  id: string
  name: string | null
  email?: string | null
}

export interface Game {
  id: string
  title: string
  system?: System
  systemId: string
  _count?: {
    listings: number
  }
}

export interface Listing {
  id: string
  gameId: string
  game: Game
  deviceId: string
  device?: Device
  emulatorId: string
  emulator?: Emulator
  performanceId: number
  performance?: PerformanceScale
  authorId: string
  author?: Author
  notes?: string | null
  createdAt: string | Date
  _count: {
    votes: number
    comments: number
  }
  successRate: number
  userVote: boolean | null
  votes?: undefined
}

export interface Pagination {
  page: number
  pages: number
  total: number
  limit: number
}

export interface ListingsResponse {
  listings: Listing[]
  pagination: Pagination
}

export interface ListingsFilter {
  systemId?: string
  deviceId?: string
  emulatorId?: string
  performanceId?: number
  searchTerm?: string
  page: number
  limit: number
}
