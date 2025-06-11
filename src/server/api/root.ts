import { createTRPCRouter } from '@/server/api/trpc'
import { listingsRouter } from './routers/listings'
import { devicesRouter } from './routers/devices'
import { deviceBrandsRouter } from './routers/deviceBrands'
import { socsRouter } from './routers/socs'
import { gamesRouter } from './routers/games'
import { systemsRouter } from './routers/systems'
import { emulatorsRouter } from './routers/emulators'
import { usersRouter } from './routers/users'
import { customFieldDefinitionRouter } from './routers/customFieldDefinitions'
import { customFieldTemplateRouter } from './routers/customFieldTemplates'
import { performanceScalesRouter } from './routers/performanceScales'
import { rawgRouter } from './routers/rawg'
import { tgdbRouter } from './routers/tgdb'

export const appRouter = createTRPCRouter({
  listings: listingsRouter,
  devices: devicesRouter,
  deviceBrands: deviceBrandsRouter,
  socs: socsRouter,
  games: gamesRouter,
  systems: systemsRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
  customFieldDefinitions: customFieldDefinitionRouter,
  customFieldTemplates: customFieldTemplateRouter,
  performanceScales: performanceScalesRouter,
  rawg: rawgRouter,
  tgdb: tgdbRouter,
})

export type AppRouter = typeof appRouter
