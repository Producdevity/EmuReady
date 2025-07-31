'use client'

import { Activity, Database, Gauge, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import { seoMetrics, exportMetrics } from '@/lib/monitoring/seo-metrics'

export function MonitoringOverview() {
  const [metrics, setMetrics] = useState({
    cacheHitRate: 0,
    avgResponseTime: 0,
    bundleSize: 0,
    performanceScore: 0,
  })

  useEffect(() => {
    const updateMetrics = () => {
      const seoData = seoMetrics.getAggregatedMetrics()
      const exportData = exportMetrics()

      setMetrics({
        cacheHitRate: seoData.cacheHitRate,
        avgResponseTime: seoData.avgTotalTime,
        bundleSize: exportData.cache.totalSize,
        performanceScore: Math.round(100 - seoData.avgTotalTime / 10), // Simple calculation for now
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Cache Hit Rate</h3>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">
          {metrics.cacheHitRate.toFixed(1)}%
        </div>
        <p className="text-xs text-muted-foreground">Real-time data</p>
      </Card>

      <Card className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Avg Response Time</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
        <p className="text-xs text-muted-foreground">Real-time data</p>
      </Card>

      <Card className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Cache Size</h3>
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">
          {(metrics.bundleSize / 1024).toFixed(1)} KB
        </div>
        <p className="text-xs text-muted-foreground">Total cache storage</p>
      </Card>

      <Card className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Performance Score</h3>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{metrics.performanceScore}/100</div>
        <p className="text-xs text-muted-foreground">Based on response time</p>
      </Card>
    </div>
  )
}
