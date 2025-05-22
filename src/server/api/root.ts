import { createTRPCRouter } from '@/server/api/trpc'
import { listingsRouter } from './routers/listings'
import { devicesRouter } from './routers/devices'
import { deviceBrandsRouter } from './routers/deviceBrands'
import { systemsRouter } from './routers/systems'
import { gamesRouter } from './routers/games'
import { emulatorsRouter } from './routers/emulators'
import { usersRouter } from './routers/users'
import { customFieldDefinitionRouter } from './routers/customFieldDefinitions'
import type { inferRouterOutputs } from '@trpc/server'

export const appRouter = createTRPCRouter({
  listings: listingsRouter,
  devices: devicesRouter,
  deviceBrands: deviceBrandsRouter,
  systems: systemsRouter,
  games: gamesRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
  customFieldDefinitions: customFieldDefinitionRouter,
})

export type AppRouter = typeof appRouter

/**
 * Inference helper for outputs.
 *
 * @example type AuthOutput = RouterOutputs['auth']['getSession']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>
