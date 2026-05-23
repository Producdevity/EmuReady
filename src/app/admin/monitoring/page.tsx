import { type Metadata } from 'next'
import { AdminPageLayout } from '@/components/admin'
import { BundleSizeMonitor } from './components/BundleSizeMonitor'
import { DatabaseConnectionMonitor } from './components/DatabaseConnectionMonitor'
import { PerformanceMetrics } from './components/PerformanceMetrics'

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system performance and bundle sizes',
}

export default function MonitoringDashboard() {
  return (
    <AdminPageLayout
      title="System Monitoring"
      description="Monitor system performance and bundle sizes"
    >
      <DatabaseConnectionMonitor />

      <PerformanceMetrics />

      <BundleSizeMonitor />
    </AdminPageLayout>
  )
}
