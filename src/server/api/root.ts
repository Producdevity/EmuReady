import { createTRPCRouter } from '@/server/api/trpc'
import { activityRouter } from './routers/admin/activity'
import { adminEntitlementsRouter } from './routers/admin/entitlements'
import { adminReleasesRouter } from './routers/admin/releases'
import { titleIdToolsRouter } from './routers/admin/titleIdTools'
import { apiKeysRouter } from './routers/apiKeys'
import { auditLogsRouter } from './routers/auditLogs'
import { badgesRouter } from './routers/badges'
import { cacheRouter } from './routers/cache'
import { cpusRouter } from './routers/cpus'
import { customFieldCategoryRouter } from './routers/customFieldCategories'
import { customFieldDefinitionRouter } from './routers/customFieldDefinitions'
import { customFieldTemplateRouter } from './routers/customFieldTemplates'
import { deviceBrandsRouter } from './routers/deviceBrands'
import { devicesRouter } from './routers/devices'
import { emulatorsRouter } from './routers/emulators'
import { entitlementsRouter } from './routers/entitlements'
import { gamesRouter } from './routers/games'
import { gpusRouter } from './routers/gpus'
import { igdbRouter } from './routers/igdb'
import { listingReportsRouter } from './routers/listingReports'
import { listingsRouter } from './routers/listings'
import { listingVerificationsRouter } from './routers/listingVerifications'
import { mobileRouter } from './routers/mobile'
import { notificationsRouter } from './routers/notifications'
import { pcListingsRouter } from './routers/pcListings'
import { performanceScalesRouter } from './routers/performanceScales'
import { permissionLogsRouter } from './routers/permissionLogs'
import { permissionsRouter } from './routers/permissions'
import { rawgRouter } from './routers/rawg'
import { releasesRouter } from './routers/releases'
import { socsRouter } from './routers/socs'
import { systemRouter } from './routers/system'
import { systemsRouter } from './routers/systems'
import { tgdbRouter } from './routers/tgdb'
import { trustRouter } from './routers/trust'
import { userBansRouter } from './routers/userBans'
import { userPreferencesRouter } from './routers/userPreferences'
import { usersRouter } from './routers/users'
import { verifiedDevelopersRouter } from './routers/verifiedDevelopers'

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  listings: listingsRouter,
  pcListings: pcListingsRouter,
  apiKeys: apiKeysRouter,
  devices: devicesRouter,
  cpus: cpusRouter,
  gpus: gpusRouter,
  deviceBrands: deviceBrandsRouter,
  socs: socsRouter,
  games: gamesRouter,
  system: systemRouter,
  systems: systemsRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
  userPreferences: userPreferencesRouter,
  userBans: userBansRouter,
  badges: badgesRouter,
  cache: cacheRouter,
  notifications: notificationsRouter,
  customFieldCategories: customFieldCategoryRouter,
  customFieldDefinitions: customFieldDefinitionRouter,
  customFieldTemplates: customFieldTemplateRouter,
  performanceScales: performanceScalesRouter,
  permissions: permissionsRouter,
  permissionLogs: permissionLogsRouter,
  auditLogs: auditLogsRouter,
  trust: trustRouter,
  rawg: rawgRouter,
  tgdb: tgdbRouter,
  igdb: igdbRouter,
  mobile: mobileRouter,
  verifiedDevelopers: verifiedDevelopersRouter,
  listingVerifications: listingVerificationsRouter,
  listingReports: listingReportsRouter,
  titleIdTools: titleIdToolsRouter,
  releases: releasesRouter,
  entitlements: entitlementsRouter,
  adminReleases: adminReleasesRouter,
  adminEntitlements: adminEntitlementsRouter,
})

export type AppRouter = typeof appRouter
