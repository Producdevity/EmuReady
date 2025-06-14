import { createTRPCRouter } from '@/server/api/trpc'
import { customFieldDefinitionRouter } from './routers/customFieldDefinitions'
import { customFieldTemplateRouter } from './routers/customFieldTemplates'
import { deviceBrandsRouter } from './routers/deviceBrands'
import { devicesRouter } from './routers/devices'
import { emulatorsRouter } from './routers/emulators'
import { gamesRouter } from './routers/games'
import { listingsRouter } from './routers/listings'
import { mobileRouter } from './routers/mobile'
import { notificationsRouter } from './routers/notifications'
import { performanceScalesRouter } from './routers/performanceScales'
import { rawgRouter } from './routers/rawg'
import { socsRouter } from './routers/socs'
import { systemsRouter } from './routers/systems'
import { tgdbRouter } from './routers/tgdb'
import { userPreferencesRouter } from './routers/userPreferences'
import { usersRouter } from './routers/users'

export const appRouter = createTRPCRouter({
  listings: listingsRouter,
  devices: devicesRouter,
  deviceBrands: deviceBrandsRouter,
  socs: socsRouter,
  games: gamesRouter,
  systems: systemsRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
  userPreferences: userPreferencesRouter,
  notifications: notificationsRouter,
  customFieldDefinitions: customFieldDefinitionRouter,
  customFieldTemplates: customFieldTemplateRouter,
  performanceScales: performanceScalesRouter,
  rawg: rawgRouter,
  tgdb: tgdbRouter,
  mobile: mobileRouter,
})

export type AppRouter = typeof appRouter
