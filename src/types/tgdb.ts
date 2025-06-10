export interface TGDBBaseApiResponse {
  code: number
  status: string
  remaining_monthly_allowance: number
  extra_allowance: number
}

export interface TGDBPaginatedApiResponse extends TGDBBaseApiResponse {
  pages: {
    previous: string
    current: string
    next: string
  }
}

export interface TGDBPlatform {
  id: number
  name: string
  alias: string
  icon?: string
  console?: string
  controller?: string
  developer?: string
  overview?: string
}

export interface TGDBGame {
  id: number
  game_title: string
  release_date?: string
  platform?: number
  players?: number
  overview?: string
  last_updated?: string
  rating?: string
  coop?: string
  youtube?: string
  os?: string
  processor?: string
  ram?: string
  hdd?: string
  video?: string
  sound?: string
  developers?: number[]
  genres?: number[]
  publishers?: number[]
  alternates?: string[]
}

export interface TGDBGameImage {
  id: number
  type: string
  side?: string
  filename: string
  resolution?: string
}

export interface TGDBImageBaseUrlMeta {
  original: string
  small: string
  thumb: string
  cropped_center_thumb: string
  medium: string
  large: string
}

export interface TGDBGamesByNameResponse extends TGDBPaginatedApiResponse {
  data: {
    count: number
    games: TGDBGame[]
  }
  include?: {
    boxart?: {
      base_url: TGDBImageBaseUrlMeta
      data: Record<string, TGDBGameImage[]>
    }
    platform?: {
      data: Record<string, TGDBPlatform>
    }
  }
}

export interface TGDBGamesImagesResponse extends TGDBPaginatedApiResponse {
  data: {
    count: number
    base_url: TGDBImageBaseUrlMeta
    images: Record<string, TGDBGameImage[]>
  }
}

export interface TGDBPlatformsResponse extends TGDBBaseApiResponse {
  data: {
    count: number
    platforms: Record<string, TGDBPlatform>
  }
}

export interface GameImageOption {
  id: string
  url: string
  type:
    | 'boxart'
    | 'fanart'
    | 'banner'
    | 'screenshot'
    | 'clearlogo'
    | 'titlescreen'
  source: 'tgdb' | 'custom'
  gameId: number
  gameName: string
  width?: number
  height?: number
}
