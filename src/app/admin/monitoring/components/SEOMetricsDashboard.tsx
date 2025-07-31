'use client'

import { BarChart, Clock, Database, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { exportMetrics, seoMetrics } from '@/lib/monitoring/seo-metrics'
import { cn } from '@/lib/utils'
import { ms } from '@/utils/time'

export function SEOMetricsDashboard() {
  const [metrics, setMetrics] = useState(seoMetrics.getAggregatedMetrics())
  const [exportData, setExportData] = useState(exportMetrics())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(seoMetrics.getAggregatedMetrics())
      setExportData(exportMetrics())
    }, ms.seconds(30))

    return () => clearInterval(interval)
  }, [])

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">SEO Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time performance monitoring
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => seoMetrics.reset()}
          >
            Reset Metrics
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Average Response Time</span>
            </div>
            <p className="text-2xl font-bold">
              {formatMs(metrics.avgTotalTime)}
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Cache: {formatMs(metrics.avgCacheLookupTime)}</span>
              <span>DB: {formatMs(metrics.avgDatabaseQueryTime)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart className="h-4 w-4" />
              <span>Cache Performance</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics.cacheHitRate.toFixed(1)}%
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Stale: {metrics.staleServeRate.toFixed(1)}%</span>
              <span>Sample: {metrics.sampleSize}</span>
            </div>
          </div>
        </div>

        {/* Cache Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Cache Storage</span>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total Size</span>
              <span className="text-sm">
                {formatBytes(exportData.cache.totalSize)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Entries</span>
              <span className="text-sm">{exportData.cache.entries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Oldest Entry</span>
              <span className="text-sm">
                {formatMs(exportData.cache.oldestEntry)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Performance Indicators</span>
          </div>
          <div className="grid gap-2">
            <PerformanceIndicator
              label="Cache Efficiency"
              value={metrics.cacheHitRate}
              threshold={80}
            />
            <PerformanceIndicator
              label="Response Time"
              value={100 - metrics.avgTotalTime / 10}
              threshold={50}
            />
            <PerformanceIndicator
              label="Stale Serve Rate"
              value={100 - metrics.staleServeRate}
              threshold={90}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

function PerformanceIndicator({
  label,
  value,
  threshold,
}: {
  label: string
  value: number
  threshold: number
}) {
  const isGood = value >= threshold

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              isGood ? 'bg-green-500' : 'bg-amber-500',
            )}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
