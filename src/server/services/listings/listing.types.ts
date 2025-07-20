import type { BaseFindParams } from '../types'
import type { Listing, Device, DeviceBrand, SoC } from '@orm'

export interface ListingWithRelations extends Listing {
  device: Device & {
    brand: DeviceBrand
    soc: SoC | null
  }
  emulator: {
    id: string
    name: string
    logo: string | null
  }
  performance: {
    id: number
    label: string
    rank: number
  } | null
  author: {
    id: string
    name: string | null
  }
  _count: {
    votes: number
    comments: number
  }
}

export interface ListingWithStats extends ListingWithRelations {
  successRate: number
  upVotes: number
  downVotes: number
  totalVotes: number
  userVote: boolean | null
}

export interface FindListingsParams extends BaseFindParams {
  gameId?: string
  systemId?: string
  emulatorId?: string
  emulatorIds?: string[] | string
  deviceId?: string
  deviceIds?: string[] | string
  socId?: string
  socIds?: string[] | string
  performanceId?: number
}

export interface CreateListingParams {
  gameId: string
  deviceId: string
  emulatorId: string
  performanceId: number
  notes?: string
  customFieldValues?: Record<string, unknown>
  authorId: string
}

export interface UpdateListingParams {
  id: string
  performanceId?: number
  notes?: string
  customFieldValues?: Record<string, unknown>
  userId: string
}

export interface VoteListingParams {
  listingId: string
  value: boolean
  userId: string
}

export interface GetCommentsParams {
  listingId: string
  page?: number
  limit?: number
  userId?: string
}

export interface CreateCommentParams {
  listingId: string
  content: string
  userId: string
}

export interface UpdateCommentParams {
  id: string
  content: string
  userId: string
}

export interface DeleteCommentParams {
  id: string
  userId: string
}
