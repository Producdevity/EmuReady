import type { ApprovalStatus, CustomFieldType } from '@orm'

// Base mobile types
export interface MobileUser {
  id: string
  name: string | null
  role: string
  bio: string | null
  createdAt: Date
}

export interface MobileSystem {
  id: string
  name: string
  key?: string | null
}

export interface MobileBrand {
  id: string
  name: string
}

export interface MobileSoc {
  id: string
  name: string
  manufacturer: string
}

export interface MobileDevice {
  id: string
  modelName: string
  brand: MobileBrand
  soc?: MobileSoc | null
  _count: {
    listings: number
  }
}

export interface MobileEmulator {
  id: string
  name: string
  logo?: string | null
  androidGithubRepoUrl?: string | null
  repositoryUrl?: string | null
  officialUrl?: string | null
  systems?: MobileSystem[]
  _count: {
    listings: number
  }
}

export interface MobilePerformance {
  id: string
  label: string
  rank: number
}

export interface MobileGame {
  id: string
  title: string
  imageUrl?: string | null
  boxartUrl?: string | null
  bannerUrl?: string | null
  system: MobileSystem
  _count: {
    listings: number
  }
}

export interface MobileAuthor {
  id: string
  name: string | null
}

export interface MobileCustomFieldValue {
  id: string
  value: string
  customFieldDefinition: {
    id: string
    name: string
    label: string
    type: CustomFieldType
    options: unknown
    isRequired: boolean
  }
}

export interface MobileListing {
  id: string
  notes: string | null
  status: ApprovalStatus
  createdAt: Date
  updatedAt: Date
  game: MobileGame
  device: MobileDevice
  emulator: MobileEmulator
  performance: MobilePerformance
  author: MobileAuthor
  customFieldValues?: MobileCustomFieldValue[]
  _count: {
    votes: number
    comments: number
  }
  successRate: number
  userVote?: boolean | null // Only present when authenticated
}

export interface MobileListingsResponse {
  listings: MobileListing[]
  pagination: {
    total: number
    pages: number
    page: number
    limit: number
    offset: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface MobileUserProfile {
  id: string
  email: string | null
  name: string | null
  role: string
  bio: string | null
  createdAt: Date
  _count: {
    listings: number
    pcListings: number
    votes: number
    comments: number
  }
  devicePreferences: {
    id: string
    device: MobileDevice
  }[]
  socPreferences: {
    id: string
    soc: MobileSoc
  }[]
}

// API Response types
export interface MobileApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface MobileApiError {
  code: string
  message: string
  details?: unknown
}

// Filter types
export interface MobileListingFilters {
  page?: number
  limit?: number
  gameId?: string
  systemId?: string
  deviceId?: string
  emulatorId?: string
  search?: string
}

export interface MobileGameFilters {
  search?: string
  systemId?: string
  limit?: number
}

export interface MobileDeviceFilters {
  search?: string
  brandId?: string
  limit?: number
}

export interface MobileEmulatorFilters {
  systemId?: string
  search?: string
  limit?: number
}

// Vote types
export interface MobileVoteRequest {
  listingId: string
  value: boolean
}

export interface MobileVoteResponse {
  success: boolean
}

// Pagination helper
export interface MobilePagination {
  total: number
  pages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Auth types
export interface MobileAuthResponse {
  user: MobileUser
}

export interface MobileAuthError {
  error: string
}

// Search types
export interface MobileSearchSuggestion {
  id: string
  title: string
  type: 'game' | 'device' | 'emulator' | 'system'
  subtitle?: string
}

// Statistics types
export interface MobileStats {
  totalListings: number
  totalGames: number
  totalDevices: number
  totalEmulators: number
  totalUsers: number
}

// Notification types (for future use)
export interface MobileNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

// Deep linking types
export interface MobileDeepLink {
  type: 'listing' | 'game' | 'user' | 'system'
  id: string
  params?: Record<string, string>
}

// Cache types
export interface MobileCacheConfig {
  staleTime: number
  cacheTime: number
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
}

// Error boundary types
export interface MobileErrorInfo {
  componentStack: string
  errorBoundary?: string
}

export interface MobileErrorFallbackProps {
  error: Error
  errorInfo: MobileErrorInfo
  resetError: () => void
}

// Comment types
export interface MobileComment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  author: MobileAuthor
  _count: {
    votes: number
  }
  userVote?: boolean | null // Only present when authenticated
}

export interface MobileCommentsResponse {
  comments: MobileComment[]
  _count: {
    comments: number
  }
}

// PC Listing specific types
export interface MobileCpu {
  id: string
  name: string
  brand: MobileBrand
  _count: {
    pcListings: number
  }
}

export interface MobileGpu {
  id: string
  name: string
  brand: MobileBrand
  memorySize?: number | null
  _count: {
    pcListings: number
  }
}

export interface MobilePcListing {
  id: string
  notes: string | null
  status: ApprovalStatus
  memorySize: number
  os: string
  osVersion: string
  createdAt: Date
  updatedAt: Date
  game: MobileGame
  cpu: MobileCpu
  gpu: MobileGpu
  emulator: MobileEmulator
  performance: MobilePerformance
  author: MobileAuthor
  customFieldValues?: MobileCustomFieldValue[]
  _count: {
    votes: number
    comments: number
  }
  successRate: number
  userVote?: boolean | null // Only present when authenticated
}

export interface MobilePcListingsResponse {
  listings: MobilePcListing[]
  pagination: {
    total: number
    pages: number
    page: number
    limit: number
    offset: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface MobilePcPreset {
  id: string
  name: string
  memorySize: number
  os: string
  osVersion: string
  createdAt: Date
  cpu: MobileCpu
  gpu: MobileGpu
}

// Developer verification types
export interface MobileEmulatorVerification {
  id: string
  emulator: MobileEmulator
  isVerified: boolean
  verifiedAt?: Date
}

export interface MobileListingVerification {
  id: string
  notes: string | null
  createdAt: Date
  developer: MobileAuthor
  emulator: MobileEmulator
}

export interface MobileListingVerificationsResponse {
  verifications: MobileListingVerification[]
  _count: {
    verifications: number
  }
}

// Trust level types
export interface MobileTrustLevel {
  id: string
  name: string
  minScore: number
  maxScore: number
  color: string
  description: string
}
