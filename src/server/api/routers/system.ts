import { adminProcedure, createTRPCRouter } from '@/server/api/trpc'
import { ConnectionMonitor } from '@/server/utils/connection-monitor'

/**
 * System monitoring and diagnostics router
 * Admin-only endpoints for database and application health monitoring
 */
export const systemRouter = createTRPCRouter({
  /**
   * Get current database connection statistics
   */
  getConnectionStats: adminProcedure.query(async () => {
    return await ConnectionMonitor.getConnectionStats()
  }),

  /**
   * Get detailed information about active database connections
   */
  getActiveConnections: adminProcedure.query(async () => {
    return await ConnectionMonitor.getActiveConnections()
  }),

  /**
   * Get long-running queries (> 5 seconds)
   */
  getLongRunningQueries: adminProcedure.query(async () => {
    return await ConnectionMonitor.getLongRunningQueries()
  }),

  /**
   * Get database configuration validation
   */
  validateDatabaseConfig: adminProcedure.query(() => {
    return ConnectionMonitor.validateConfig()
  }),

  /**
   * Get connection pool configuration
   */
  getPoolConfig: adminProcedure.query(() => {
    return ConnectionMonitor.getPoolConfig()
  }),

  /**
   * Manually trigger connection stats logging
   */
  logConnectionStats: adminProcedure.mutation(async () => {
    await ConnectionMonitor.logConnectionStats()
    return { success: true }
  }),
})
