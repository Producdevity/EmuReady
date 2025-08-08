'use client'

import { Loader2, Activity, TrendingUp, Database, Timer } from 'lucide-react'
import { Card, DonutChart, BarChart } from '@/components/ui'
import { POLLING_INTERVALS } from '@/data/constants'
import { api } from '@/lib/api'

export function CacheMetrics() {
  const {
    data: metrics,
    isLoading,
    error,
  } = api.cache.getMetrics.useQuery(undefined, {
    refetchInterval: POLLING_INTERVALS.DEFAULT,
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    )
  }

  if (error || !metrics) {
    return (
      <Card className="py-8">
        <p className="text-center text-muted-foreground">
          {error?.message || 'Unable to load cache metrics'}
        </p>
      </Card>
    )
  }

  const cacheMetrics = metrics.cache
  const cacheUsagePercent = (cacheMetrics.size / cacheMetrics.maxSize) * 100
  const totalRequests = cacheMetrics.hits + cacheMetrics.misses

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            SEO Cache Performance
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time cache metrics and performance indicators
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Hit Rate
            </div>
            <div className="text-2xl font-bold">{cacheMetrics.hitRate}</div>
            <p className="text-xs text-muted-foreground">
              {totalRequests.toLocaleString()} total requests
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              Cache Size
            </div>
            <div className="text-2xl font-bold">
              {cacheMetrics.size} / {cacheMetrics.maxSize}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(cacheUsagePercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              Stale Hits
            </div>
            <div className="text-2xl font-bold">{cacheMetrics.staleHits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Served while revalidating</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Cache Performance</p>
            <DonutChart
              data={[
                { label: 'Hits', value: cacheMetrics.hits, color: '#10b981' },
                {
                  label: 'Misses',
                  value: cacheMetrics.misses,
                  color: '#ef4444',
                },
                {
                  label: 'Stale Hits',
                  value: cacheMetrics.staleHits,
                  color: '#f59e0b',
                },
              ]}
              size={120}
              strokeWidth={12}
              showLabels={false}
            />
          </div>
        </div>

        {/* Cache Distribution Chart */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Cache Request Distribution</p>
          <div className="rounded-lg border p-4">
            <BarChart
              data={[
                {
                  label: 'Cache Hits',
                  value: cacheMetrics.hits,
                  color: '#10b981',
                },
                {
                  label: 'Cache Misses',
                  value: cacheMetrics.misses,
                  color: '#ef4444',
                },
                {
                  label: 'Stale Hits',
                  value: cacheMetrics.staleHits,
                  color: '#f59e0b',
                },
              ]}
              width={350}
              height={200}
              showGrid={true}
              showValues={true}
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  )
}
