import { createMobileTRPCRouter } from '@/server/api/mobileContext'
import { mobileAdminRouter } from './mobile/admin'
import { mobileAuthRouter } from './mobile/auth'
import { mobileCpusRouter } from './mobile/cpus'
import { mobileCustomFieldDefinitionsRouter } from './mobile/customFieldDefinitions'
import { mobileDevelopersRouter } from './mobile/developers'
import { mobileDeviceBrandsRouter } from './mobile/deviceBrands'
import { mobileDevicesRouter } from './mobile/devices'
import { mobileEmulatorsRouter } from './mobile/emulators'
import { mobileGamesRouter } from './mobile/games'
import { mobileGeneralRouter } from './mobile/general'
import { mobileGpusRouter } from './mobile/gpus'
import { mobileListingReportsRouter } from './mobile/listingReports'
import { mobileListingsRouter } from './mobile/listings'
import { mobileNotificationsRouter } from './mobile/notifications'
import { mobilePcListingsRouter } from './mobile/pcListings'
import { mobilePcPresetsRouter } from './mobile/pcPresets'
import { mobilePreferencesRouter } from './mobile/preferences'
import { mobileRawgRouter } from './mobile/rawg'
import { mobileSocsRouter } from './mobile/socs'
import { mobileTgdbRouter } from './mobile/tgdb'
import { mobileTrustRouter } from './mobile/trust'
import { mobileUsersRouter } from './mobile/users'

export const mobileRouter = createMobileTRPCRouter({
  admin: mobileAdminRouter,
  auth: mobileAuthRouter,
  listings: mobileListingsRouter,
  pcListings: mobilePcListingsRouter,
  pcPresets: mobilePcPresetsRouter,
  games: mobileGamesRouter,
  devices: mobileDevicesRouter,
  emulators: mobileEmulatorsRouter,
  notifications: mobileNotificationsRouter,
  preferences: mobilePreferencesRouter,
  developers: mobileDevelopersRouter,
  general: mobileGeneralRouter,
  listingReports: mobileListingReportsRouter,
  trust: mobileTrustRouter,
  customFieldDefinitions: mobileCustomFieldDefinitionsRouter,
  cpus: mobileCpusRouter,
  gpus: mobileGpusRouter,
  socs: mobileSocsRouter,
  deviceBrands: mobileDeviceBrandsRouter,
  rawg: mobileRawgRouter,
  tgdb: mobileTgdbRouter,
  users: mobileUsersRouter,
})
