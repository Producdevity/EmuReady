import { createTRPCRouter } from "@/server/api/trpc";
import { listingsRouter } from "./routers/listings";
import { devicesRouter } from "./routers/devices";
import { systemsRouter } from "./routers/systems";
import { gamesRouter } from "./routers/games";
import { emulatorsRouter } from "./routers/emulators";
import { usersRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  listings: listingsRouter,
  devices: devicesRouter,
  systems: systemsRouter,
  games: gamesRouter,
  emulators: emulatorsRouter,
  users: usersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 