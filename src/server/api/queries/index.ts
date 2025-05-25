// Domain-organized query exports
// This provides a clean API for importing query fragments and helpers

// Users
export * as UserQueries from './users'

// Listings
export * as ListingQueries from './listings'

// Comments
export * as CommentQueries from './comments'

// Games
export * as GameQueries from './games'

// Devices
export * as DeviceQueries from './devices'

// Emulators
export * as EmulatorQueries from './emulators'

// Systems
export * as SystemQueries from './systems'

// Performance
export * as PerformanceQueries from './performance'

// Votes
export * as VoteQueries from './votes'

// For backwards compatibility and convenience, also export commonly used items directly
export {
  userBasicSelect,
  userPublicSelect,
  userProfileSelect,
} from './users/fragments'

export {
  listingBasicInclude,
  getListingWithStats,
  getListingsWithStats,
} from './listings'

export { getCommentsWithVotes } from './comments'

export { getUserProfile, getPublicUserData } from './users'
