'use client'

import { Activity, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Metric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'error'
  description: string
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real performance metrics from browser Performance API
    const fetchMetrics = async () => {
      try {
        const navigation = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')

        const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')

        const newMetrics: Metric[] = [
          {
            name: 'First Contentful Paint',
            value: fcp ? fcp.startTime / 1000 : 0,
            unit: 's',
            status: 'good',
            description: 'Time until first content is rendered',
          },
          {
            name: 'DOM Content Loaded',
            value: navigation.domContentLoadedEventEnd / 1000,
            unit: 's',
            status: getStatus('DOM Content Loaded', navigation.domContentLoadedEventEnd / 1000),
            description: 'Time until DOM is fully loaded',
          },
          {
            name: 'Page Load Time',
            value: navigation.loadEventEnd / 1000,
            unit: 's',
            status: getStatus('Page Load Time', navigation.loadEventEnd / 1000),
            description: 'Total page load time',
          },
          {
            name: 'Time to First Byte',
            value: navigation.responseStart - navigation.requestStart,
            unit: 'ms',
            status: getStatus(
              'Time to First Byte',
              navigation.responseStart - navigation.requestStart,
            ),
            description: 'Server response time',
          },
        ]

        setMetrics(newMetrics)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatus = (name: string, value: number): 'good' | 'warning' | 'error' => {
    const thresholds: Record<string, { good: number; warning: number }> = {
      'First Contentful Paint': { good: 1.8, warning: 3.0 },
      'Largest Contentful Paint': { good: 2.5, warning: 4.0 },
      'Time to Interactive': { good: 3.8, warning: 7.3 },
      'Total Blocking Time': { good: 150, warning: 350 },
      'Cumulative Layout Shift': { good: 0.1, warning: 0.25 },
      'Speed Index': { good: 3.4, warning: 5.8 },
    }

    const threshold = thresholds[name]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'warning'
    return 'error'
  }

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return 'text-green-500'
      case 'warning':
        return 'text-amber-500'
      case 'error':
        return 'text-red-500'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-semibold">Core Web Vitals</h3>
          <p className="text-sm text-muted-foreground">Real user performance metrics</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.name} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{metric.name}</h4>
              {getStatusIcon(metric.status)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold', getStatusColor(metric.status))}>
                {metric.value.toFixed(metric.unit === '' ? 2 : 1)}
              </span>
              {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        ))}
      </div>

      {!loading && metrics.length > 0 && (
        <div className="mt-6 rounded-lg bg-muted p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4" />
            <h4 className="font-medium">Performance Summary</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on real browser performance data. Metrics update every 10 seconds.
          </p>
        </div>
      )}
    </Card>
  )
}
