import { createMobileTRPCRouter } from '@/server/api/mobileContext'
import { mobileAuthRouter } from './mobile/auth'
import { mobileDevelopersRouter } from './mobile/developers'
import { mobileDevicesRouter } from './mobile/devices'
import { mobileEmulatorsRouter } from './mobile/emulators'
import { mobileGamesRouter } from './mobile/games'
import { mobileGeneralRouter } from './mobile/general'
import { mobileListingsRouter } from './mobile/listings'
import { mobileNotificationsRouter } from './mobile/notifications'
import { mobilePcListingsRouter } from './mobile/pcListings'
import { mobilePreferencesRouter } from './mobile/preferences'

export const mobileRouter = createMobileTRPCRouter({
  auth: mobileAuthRouter,
  listings: mobileListingsRouter,
  pcListings: mobilePcListingsRouter,
  games: mobileGamesRouter,
  devices: mobileDevicesRouter,
  emulators: mobileEmulatorsRouter,
  notifications: mobileNotificationsRouter,
  preferences: mobilePreferencesRouter,
  developers: mobileDevelopersRouter,
  general: mobileGeneralRouter,
  getListings: mobileListingsRouter.getListings,
  getFeaturedListings: mobileListingsRouter.getFeaturedListings,
  getListingsByGame: mobileListingsRouter.getListingsByGame,
  getListingById: mobileListingsRouter.getListingById,
  getUserListings: mobileListingsRouter.getUserListings,
  createListing: mobileListingsRouter.createListing,
  updateListing: mobileListingsRouter.updateListing,
  deleteListing: mobileListingsRouter.deleteListing,
  voteListing: mobileListingsRouter.voteListing,
  getUserVote: mobileListingsRouter.getUserVote,
  getListingComments: mobileListingsRouter.getListingComments,
  createComment: mobileListingsRouter.createComment,
  updateComment: mobileListingsRouter.updateComment,
  deleteComment: mobileListingsRouter.deleteComment,
  getGames: mobileGamesRouter.getGames,
  getPopularGames: mobileGamesRouter.getPopularGames,
  searchGames: mobileGamesRouter.searchGames,
  getGameById: mobileGamesRouter.getGameById,
  getAppStats: mobileGeneralRouter.getAppStats,
  getSystems: mobileGeneralRouter.getSystems,
  getPerformanceScales: mobileGeneralRouter.getPerformanceScales,
  getSearchSuggestions: mobileGeneralRouter.getSearchSuggestions,
  getTrustLevels: mobileGeneralRouter.getTrustLevels,
  getEmulators: mobileEmulatorsRouter.getEmulators,
  getEmulatorById: mobileEmulatorsRouter.getEmulatorById,
  getDevices: mobileDevicesRouter.getDevices,
  getDeviceBrands: mobileDevicesRouter.getDeviceBrands,
  getSocs: mobileDevicesRouter.getSocs,
  getNotifications: mobileNotificationsRouter.getNotifications,
  getUnreadNotificationCount:
    mobileNotificationsRouter.getUnreadNotificationCount,
  markNotificationAsRead: mobileNotificationsRouter.markNotificationAsRead,
  markAllNotificationsAsRead:
    mobileNotificationsRouter.markAllNotificationsAsRead,
  getUserPreferences: mobilePreferencesRouter.getUserPreferences,
  updateUserPreferences: mobilePreferencesRouter.updateUserPreferences,
  addDevicePreference: mobilePreferencesRouter.addDevicePreference,
  removeDevicePreference: mobilePreferencesRouter.removeDevicePreference,
  bulkUpdateDevicePreferences:
    mobilePreferencesRouter.bulkUpdateDevicePreferences,
  bulkUpdateSocPreferences: mobilePreferencesRouter.bulkUpdateSocPreferences,
  getUserProfile: mobilePreferencesRouter.getUserProfile,
  updateProfile: mobilePreferencesRouter.updateProfile,
  getMyVerifiedEmulators: mobileDevelopersRouter.getMyVerifiedEmulators,
  isVerifiedDeveloper: mobileDevelopersRouter.isVerifiedDeveloper,
  verifyListing: mobileDevelopersRouter.verifyListing,
  removeVerification: mobileDevelopersRouter.removeVerification,
  getListingVerifications: mobileDevelopersRouter.getListingVerifications,
  getMyVerifications: mobileDevelopersRouter.getMyVerifications,
  // PC Listings endpoints
  getPcListings: mobilePcListingsRouter.getPcListings,
  createPcListing: mobilePcListingsRouter.createPcListing,
  updatePcListing: mobilePcListingsRouter.updatePcListing,
  getCpus: mobilePcListingsRouter.getCpus,
  getGpus: mobilePcListingsRouter.getGpus,
  getPcPresets: mobilePcListingsRouter.presets.get,
  createPcPreset: mobilePcListingsRouter.presets.create,
  updatePcPreset: mobilePcListingsRouter.presets.update,
  deletePcPreset: mobilePcListingsRouter.presets.delete,
})
