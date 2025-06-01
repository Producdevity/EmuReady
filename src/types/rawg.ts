export interface RawgGame {
  id: number
  name: string
  slug: string
  background_image: string | null
  released: string | null
  rating: number
  ratings_count: number
  description_raw: string | null
  genres: RawgGenre[]
  platforms: RawgPlatformWrapper[]
}

export interface RawgGenre {
  id: number
  name: string
  slug: string
}

export interface RawgPlatformWrapper {
  platform: RawgPlatform
}

export interface RawgPlatform {
  id: number
  name: string
  slug: string
}

export interface RawgGameResponse {
  count: number
  next: string | null
  previous: string | null
  results: RawgGame[]
}

export interface RawgGameDetails extends RawgGame {
  description: string | null
  website: string | null
  metacritic: number | null
  stores: RawgStoreWrapper[]
}

export interface RawgStoreWrapper {
  store: RawgStore
  url: string
}

export interface RawgStore {
  id: number
  name: string
  slug: string
}

export interface RawgScreenshot {
  id: number
  image: string
  width: number
  height: number
}

export interface RawgScreenshotsResponse {
  count: number
  next: string | null
  previous: string | null
  results: RawgScreenshot[]
}

export interface GameImageOption {
  id: string
  url: string
  type: 'background' | 'screenshot'
  source: 'rawg'
  gameId: number
  gameName: string
  width?: number
  height?: number
} 