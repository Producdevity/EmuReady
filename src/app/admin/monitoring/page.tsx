import { type Metadata } from 'next'
import { AdminPageLayout } from '@/components/admin'
import { CacheMetrics } from '@/components/admin/CacheMetrics'
import { BundleSizeMonitor } from './components/BundleSizeMonitor'
import { DatabaseConnectionMonitor } from './components/DatabaseConnectionMonitor'
import { MonitoringOverview } from './components/MonitoringOverview'
import { PerformanceMetrics } from './components/PerformanceMetrics'
import { SEOMetricsDashboard } from './components/SEOMetricsDashboard'

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system performance, cache metrics, and bundle sizes',
}

export default function MonitoringDashboard() {
  return (
    <AdminPageLayout
      title="System Monitoring"
      description="Monitor system performance, cache metrics, and bundle sizes"
    >
      <MonitoringOverview />

      <DatabaseConnectionMonitor />

      {/* Main Dashboard Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SEOMetricsDashboard />
        <CacheMetrics />
      </div>

      <PerformanceMetrics />

      <BundleSizeMonitor />
    </AdminPageLayout>
  )
}
