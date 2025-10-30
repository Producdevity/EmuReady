'use client'

import { AlertTriangle, CheckCircle, Database, Loader2, Server, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
import { api } from '@/lib/api'

export function DatabaseConnectionMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  const {
    data: connectionStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = api.system.getConnectionStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  const {
    data: activeConnections,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = api.system.getActiveConnections.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  })

  const {
    data: longRunningQueries,
    isLoading: isLoadingLong,
    refetch: refetchLong,
  } = api.system.getLongRunningQueries.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  })

  const { data: configValidation } = api.system.validateDatabaseConfig.useQuery()
  const { data: poolConfig } = api.system.getPoolConfig.useQuery()

  const handleRefreshAll = () => {
    void refetchStats()
    void refetchActive()
    void refetchLong()
  }

  // Calculate connection health
  const getConnectionHealth = () => {
    if (!connectionStats) return 'unknown'
    const activePercent = (connectionStats.active / connectionStats.total) * 100
    if (connectionStats.idleInTransaction > 10) return 'critical'
    if (activePercent > 80) return 'warning'
    return 'healthy'
  }

  const health = getConnectionHealth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="mt-4">
          <h2 className="text-2xl font-bold">Database Connections</h2>
          <p className="text-muted-foreground text-sm">
            Monitor PostgreSQL connection pool and query performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Auto-refresh On
              </>
            ) : (
              'Auto-refresh Off'
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Configuration Status */}
      {configValidation && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 font-semibold">Configuration Status</h3>
              {configValidation.isValid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Configuration is valid</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Configuration Issues Detected</span>
                  </div>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    {configValidation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {poolConfig && (
              <div className="text-right text-sm">
                <div className="text-muted-foreground">
                  {poolConfig.isLocal ? 'Local Database' : 'Pool Configuration'}
                </div>
                <div className="mt-1 space-y-1">
                  {poolConfig.isLocal ? (
                    <div>
                      <Badge variant="info">Local Development</Badge>
                    </div>
                  ) : (
                    <>
                      <div>
                        pgBouncer:{' '}
                        <Badge variant={poolConfig.hasPgBouncer ? 'success' : 'danger'}>
                          {poolConfig.hasPgBouncer ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {poolConfig.connectionLimit && (
                        <div>
                          Limit:{' '}
                          <Badge
                            variant={
                              poolConfig.connectionLimit <= 2
                                ? 'success'
                                : poolConfig.connectionLimit <= 5
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {poolConfig.connectionLimit}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Connection Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Connections</h3>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              (connectionStats?.total ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">All database connections</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active</h3>
            <Server className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              (connectionStats?.active ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Executing queries</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Idle</h3>
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              (connectionStats?.idle ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Available connections</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">In Transaction</h3>
            <Server className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              (connectionStats?.idleInTransaction ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">May be stuck</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Health Status</h3>
            {health === 'healthy' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {health === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            {health === 'critical' && <XCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="text-2xl font-bold capitalize">{health}</div>
          <p className="text-xs text-muted-foreground">Overall connection health</p>
        </Card>
      </div>

      {/* Long-Running Queries */}
      {longRunningQueries && longRunningQueries.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-red-600">
            Long-Running Queries ({longRunningQueries.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">PID</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Application</th>
                  <th className="pb-2">State</th>
                  <th className="pb-2">Started</th>
                  <th className="pb-2">Query</th>
                </tr>
              </thead>
              <tbody>
                {longRunningQueries.map((conn) => (
                  <tr key={conn.pid} className="border-b">
                    <td className="py-2">{conn.pid}</td>
                    <td className="py-2">{conn.username}</td>
                    <td className="py-2 text-muted-foreground">{conn.applicationName}</td>
                    <td className="py-2">
                      <Badge variant="danger">{conn.state}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {conn.queryStart ? new Date(conn.queryStart).toLocaleTimeString() : 'Unknown'}
                    </td>
                    <td className="max-w-md truncate py-2 font-mono text-xs">
                      {conn.query ?? 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Active Connections */}
      {activeConnections && activeConnections.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Active Connections ({activeConnections.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">PID</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Application</th>
                  <th className="pb-2">State</th>
                  <th className="pb-2">Wait Event</th>
                  <th className="pb-2">Query</th>
                </tr>
              </thead>
              <tbody>
                {activeConnections.map((conn) => (
                  <tr key={conn.pid} className="border-b">
                    <td className="py-2">{conn.pid}</td>
                    <td className="py-2">{conn.username}</td>
                    <td className="py-2 text-muted-foreground">{conn.applicationName}</td>
                    <td className="py-2">
                      <Badge variant={conn.state === 'active' ? 'success' : 'info'}>
                        {conn.state}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{conn.waitEvent ?? 'None'}</td>
                    <td className="max-w-md truncate py-2 font-mono text-xs">
                      {conn.query ?? 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoadingActive &&
        !isLoadingLong &&
        (!activeConnections || activeConnections.length === 0) &&
        (!longRunningQueries || longRunningQueries.length === 0) && (
          <Card className="p-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h3 className="mb-2 text-lg font-semibold">All Clear!</h3>
            <p className="text-muted-foreground">
              No active connections or long-running queries detected.
            </p>
          </Card>
        )}
    </div>
  )
}
