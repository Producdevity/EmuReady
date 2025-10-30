import { logger } from '@/lib/logger'
import { prisma } from '@/server/db'

interface ConnectionStats {
  total: number
  active: number
  idle: number
  idleInTransaction: number
  waiting: number
}

interface DetailedConnection {
  pid: number
  username: string
  applicationName: string
  clientAddr: string | null
  state: string
  queryStart: Date | null
  stateChange: Date | null
  waitEventType: string | null
  waitEvent: string | null
  query: string | null
}

/**
 * Connection monitoring utility for tracking PostgreSQL connection health
 *
 * Use this to:
 * - Monitor active connections
 * - Identify connection leaks
 * - Track query performance
 * - Alert on connection exhaustion
 */
export class ConnectionMonitor {
  private static isMonitoring = false
  private static monitoringInterval: NodeJS.Timeout | null = null

  /**
   * Get current connection statistics
   */
  static async getConnectionStats(): Promise<ConnectionStats> {
    try {
      const result = await prisma.$queryRaw<
        {
          state: string
          count: bigint
        }[]
      >`
        SELECT
          state,
          COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `

      const stats: ConnectionStats = {
        total: 0,
        active: 0,
        idle: 0,
        idleInTransaction: 0,
        waiting: 0,
      }

      for (const row of result) {
        const count = Number(row.count)
        stats.total += count

        switch (row.state) {
          case 'active':
            stats.active = count
            break
          case 'idle':
            stats.idle = count
            break
          case 'idle in transaction':
            stats.idleInTransaction = count
            break
          case 'idle in transaction (aborted)':
            stats.idleInTransaction += count
            break
          default:
            stats.waiting += count
        }
      }

      return stats
    } catch (error) {
      logger.error('Failed to get connection stats', { error })
      throw error
    }
  }

  /**
   * Get detailed information about active connections
   */
  static async getActiveConnections(): Promise<DetailedConnection[]> {
    try {
      const result = await prisma.$queryRaw<
        {
          pid: number
          usename: string
          application_name: string
          client_addr: string | null
          state: string
          query_start: Date | null
          state_change: Date | null
          wait_event_type: string | null
          wait_event: string | null
          query: string | null
        }[]
      >`
        SELECT
          pid,
          usename,
          application_name,
          client_addr::text,
          state,
          query_start,
          state_change,
          wait_event_type,
          wait_event,
          query
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state != 'idle'
          AND pid != pg_backend_pid()
        ORDER BY query_start DESC
        LIMIT 50
      `

      return result.map((row) => ({
        pid: row.pid,
        username: row.usename,
        applicationName: row.application_name,
        clientAddr: row.client_addr,
        state: row.state,
        queryStart: row.query_start,
        stateChange: row.state_change,
        waitEventType: row.wait_event_type,
        waitEvent: row.wait_event,
        query: row.query,
      }))
    } catch (error) {
      logger.error('Failed to get active connections', { error })
      throw error
    }
  }

  /**
   * Get long-running queries (> 5 seconds)
   */
  static async getLongRunningQueries(): Promise<DetailedConnection[]> {
    try {
      const result = await prisma.$queryRaw<
        {
          pid: number
          usename: string
          application_name: string
          client_addr: string | null
          state: string
          query_start: Date | null
          state_change: Date | null
          wait_event_type: string | null
          wait_event: string | null
          query: string | null
          duration_seconds: number
        }[]
      >`
        SELECT
          pid,
          usename,
          application_name,
          client_addr::text,
          state,
          query_start,
          state_change,
          wait_event_type,
          wait_event,
          query,
          EXTRACT(EPOCH FROM (NOW() - query_start))::integer as duration_seconds
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state = 'active'
          AND query_start < NOW() - INTERVAL '5 seconds'
          AND pid != pg_backend_pid()
        ORDER BY query_start ASC
        LIMIT 20
      `

      const connections = result.map((row) => ({
        pid: row.pid,
        username: row.usename,
        applicationName: row.application_name,
        clientAddr: row.client_addr,
        state: row.state,
        queryStart: row.query_start,
        stateChange: row.state_change,
        waitEventType: row.wait_event_type,
        waitEvent: row.wait_event,
        query: row.query,
      }))

      if (connections.length > 0) {
        logger.warn('Long-running queries detected', {
          count: connections.length,
          queries: result.map((r) => ({
            pid: r.pid,
            duration: r.duration_seconds,
            query: r.query?.substring(0, 100),
          })),
        })
      }

      return connections
    } catch (error) {
      logger.error('Failed to get long-running queries', { error })
      throw error
    }
  }

  /**
   * Log current connection statistics
   */
  static async logConnectionStats(): Promise<void> {
    try {
      const stats = await this.getConnectionStats()

      logger.info('Database connection stats', {
        total: stats.total,
        active: stats.active,
        idle: stats.idle,
        idleInTransaction: stats.idleInTransaction,
        waiting: stats.waiting,
      })

      // Alert if too many active connections
      if (stats.active > 50) {
        logger.warn('High active connection count', {
          active: stats.active,
          threshold: 50,
        })
      }

      // Alert if connections stuck in transaction
      if (stats.idleInTransaction > 10) {
        logger.warn('High idle-in-transaction count', {
          idleInTransaction: stats.idleInTransaction,
          threshold: 10,
        })
      }

      // Check for long-running queries
      await this.getLongRunningQueries()
    } catch (error) {
      logger.error('Failed to log connection stats', { error })
    }
  }

  /**
   * Start monitoring connections at regular intervals
   *
   * @param intervalMs - Monitoring interval in milliseconds (default: 60000 = 1 minute)
   */
  static startMonitoring(intervalMs = 60000): void {
    if (this.isMonitoring) {
      logger.warn('Connection monitoring already started')
      return
    }

    logger.info('Starting connection monitoring', { intervalMs })

    // Log immediately
    void this.logConnectionStats()

    // Then log at intervals
    this.monitoringInterval = setInterval(() => {
      void this.logConnectionStats()
    }, intervalMs)

    this.isMonitoring = true
  }

  /**
   * Stop monitoring connections
   */
  static stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.warn('Connection monitoring not running')
      return
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.isMonitoring = false
    logger.info('Connection monitoring stopped')
  }

  /**
   * Check if database is a local development database
   */
  static isLocalDatabase(): boolean {
    const url = process.env.DATABASE_URL
    if (!url) return false

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1'
      )
    } catch {
      return false
    }
  }

  /**
   * Get connection pool configuration from DATABASE_URL
   */
  static getPoolConfig(): {
    hasConnectionLimit: boolean
    hasPgBouncer: boolean
    connectionLimit?: number
    isLocal: boolean
  } {
    const url = process.env.DATABASE_URL
    if (!url) {
      return { hasConnectionLimit: false, hasPgBouncer: false, isLocal: false }
    }

    try {
      const urlObj = new URL(url)
      const connectionLimit = urlObj.searchParams.get('connection_limit')
      const pgbouncer = urlObj.searchParams.get('pgbouncer')
      const isLocal = this.isLocalDatabase()

      return {
        hasConnectionLimit: connectionLimit !== null,
        hasPgBouncer: pgbouncer === 'true',
        connectionLimit: connectionLimit ? parseInt(connectionLimit, 10) : undefined,
        isLocal,
      }
    } catch {
      return { hasConnectionLimit: false, hasPgBouncer: false, isLocal: false }
    }
  }

  /**
   * Validate connection configuration
   */
  static validateConfig(): {
    isValid: boolean
    warnings: string[]
  } {
    const warnings: string[] = []
    const config = this.getPoolConfig()

    // Skip validation for local databases
    if (config.isLocal) {
      return { isValid: true, warnings: [] }
    }

    // Production/staging validation (Supabase, remote databases)
    if (!config.hasPgBouncer) {
      warnings.push(
        'DATABASE_URL missing pgbouncer=true parameter. Add it to prevent prepared statement issues.',
      )
    }

    // NOTE: We don't warn about missing connection_limit anymore since it's added automatically
    // by getOptimizedDatabaseUrl() in src/server/db.ts

    // Only warn if connection_limit is set but too high
    if (config.connectionLimit && config.connectionLimit > 5) {
      warnings.push(
        `connection_limit=${config.connectionLimit} is too high for serverless. Recommended: 1-2`,
      )
    }

    if (!process.env.DATABASE_DIRECT_URL) {
      warnings.push(
        'DATABASE_DIRECT_URL not set. Required for complex transactions and migrations.',
      )
    }

    const isValid = warnings.length === 0

    if (!isValid) {
      logger.warn('Database configuration issues detected', { warnings })
    }

    return { isValid, warnings }
  }
}
