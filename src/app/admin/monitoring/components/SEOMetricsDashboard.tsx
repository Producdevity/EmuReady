'use client'

import { BarChart as BarChartIcon, Clock, Database, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, Button, LineChart, DonutChart } from '@/components/ui'
import { exportMetrics, seoMetrics } from '@/lib/monitoring/seo-metrics'
import { cn } from '@/lib/utils'
import { ms } from '@/utils/time'

export function SEOMetricsDashboard() {
  const [metrics, setMetrics] = useState(seoMetrics.getAggregatedMetrics())
  const [exportData, setExportData] = useState(exportMetrics())
  const [timeSeriesData, setTimeSeriesData] = useState<{ x: number; y: number; label: string }[]>(
    [],
  )

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = seoMetrics.getAggregatedMetrics()
      const newExportData = exportMetrics()

      setMetrics(newMetrics)
      setExportData(newExportData)

      // Update time series data for response time chart
      setTimeSeriesData((prev) => {
        const now = Date.now()
        const newPoint = {
          x: now,
          y: newMetrics.avgTotalTime,
          label: `${formatMs(newMetrics.avgTotalTime)} at ${new Date(now).toLocaleTimeString()}`,
        }

        // Keep only last 20 points
        return [...prev, newPoint].slice(-20)
      })
    }

    updateMetrics()

    const interval = setInterval(updateMetrics, ms.seconds(30))

    return () => {
      clearInterval(interval)
    }
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
            <p className="text-sm text-muted-foreground">Real-time performance monitoring</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => seoMetrics.reset()}>
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
            <p className="text-2xl font-bold">{formatMs(metrics.avgTotalTime)}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Cache: {formatMs(metrics.avgCacheLookupTime)}</span>
              <span>DB: {formatMs(metrics.avgDatabaseQueryTime)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChartIcon className="h-4 w-4" />
              <span>Cache Performance</span>
            </div>
            <div className="flex items-center gap-4">
              <DonutChart
                data={[
                  {
                    label: 'Cache Hits',
                    value: metrics.cacheHitRate,
                    color: '#10b981',
                  },
                  {
                    label: 'Cache Misses',
                    value: 100 - metrics.cacheHitRate,
                    color: '#ef4444',
                  },
                ]}
                size={80}
                strokeWidth={8}
                showLabels={false}
                centerText={`${metrics.cacheHitRate.toFixed(1)}%`}
              />
              <div className="space-y-1">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Stale: {metrics.staleServeRate.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">Sample: {metrics.sampleSize}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Trend */}
        {timeSeriesData.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Response Time Trend (Last 10 minutes)</span>
            </div>
            <div className="rounded-lg border p-4">
              <LineChart
                data={timeSeriesData}
                width={400}
                height={120}
                color="#3b82f6"
                showGrid={true}
                yAxisLabel="Time (ms)"
              />
            </div>
          </div>
        )}

        {/* Cache Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Cache Storage Details</span>
          </div>
          <div className="rounded-lg border p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Size</span>
                <span>{formatBytes(exportData.cache.totalSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Entries</span>
                <span>{exportData.cache.totalEntries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Average Entry Size</span>
                <span>{formatBytes(exportData.cache.averageSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Oldest Entry Age</span>
                <span>{formatMs(exportData.cache.oldestEntry)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Response Time Distribution</span>
          </div>
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Average</div>
                  <div className="text-lg font-bold">{formatMs(metrics.avgTotalTime)}</div>
                </div>
                <div>
                  <div className="font-medium">Median</div>
                  <div className="text-lg font-bold">{formatMs(metrics.medianResponseTime)}</div>
                </div>
                <div>
                  <div className="font-medium">P95</div>
                  <div className="text-lg font-bold">{formatMs(metrics.p95ResponseTime)}</div>
                </div>
                <div>
                  <div className="font-medium">Max</div>
                  <div className="text-lg font-bold">{formatMs(metrics.maxResponseTime)}</div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="grid gap-2">
                <PerformanceIndicator
                  label="Cache Efficiency"
                  value={metrics.cacheHitRate}
                  threshold={80}
                />
                <PerformanceIndicator
                  label="P95 Performance"
                  value={Math.max(0, 100 - metrics.p95ResponseTime / 10)}
                  threshold={70}
                />
                <PerformanceIndicator
                  label="Stale Serve Rate"
                  value={100 - metrics.staleServeRate}
                  threshold={90}
                />
              </div>
            </div>
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
            className={cn('h-full transition-all', isGood ? 'bg-green-500' : 'bg-amber-500')}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">{value.toFixed(0)}%</span>
      </div>
    </div>
  )
}
