import { type Metadata } from 'next'
import { CacheMetrics } from '@/components/admin/CacheMetrics'
import { BundleSizeMonitor } from './components/BundleSizeMonitor'
import { MonitoringOverview } from './components/MonitoringOverview'
import { PerformanceMetrics } from './components/PerformanceMetrics'
import { SEOMetricsDashboard } from './components/SEOMetricsDashboard'

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system performance, cache metrics, and bundle sizes',
}

export default function MonitoringDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance, cache metrics, and bundle sizes
        </p>
      </div>

      <div className="space-y-6">
        {/* Overview Cards */}
        <MonitoringOverview />

        {/* Main Dashboard Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SEOMetricsDashboard />
          <CacheMetrics />
        </div>

        <PerformanceMetrics />

        <BundleSizeMonitor />
      </div>
    </div>
  )
}
