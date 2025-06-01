import { createTRPCRouter } from '@/server/api/trpc'
import { listingsRouter } from './routers/listings'
import { devicesRouter } from './routers/devices'
import { deviceBrandsRouter } from './routers/deviceBrands'
import { gamesRouter } from './routers/games'
import { systemsRouter } from './routers/systems'
import { emulatorsRouter } from './routers/emulators'
import { usersRouter } from './routers/users'
import { customFieldDefinitionRouter } from './routers/customFieldDefinitions'
import { performanceScalesRouter } from './routers/performanceScales'
import { rawgRouter } from './routers/rawg'

export const appRouter = createTRPCRouter({
  listings: listingsRouter,
  devices: devicesRouter,
  deviceBrands: deviceBrandsRouter,
  games: gamesRouter,
  systems: systemsRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
  customFieldDefinitions: customFieldDefinitionRouter,
  performanceScales: performanceScalesRouter,
  rawg: rawgRouter,
})

export type AppRouter = typeof appRouter
