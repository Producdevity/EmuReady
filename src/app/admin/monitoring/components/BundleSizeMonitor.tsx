'use client'

import { Package, FileText, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface BundleInfo {
  name: string
  size: number
  gzipSize: number
  category: 'page' | 'component' | 'library'
}

export function BundleSizeMonitor() {
  const [bundles, setBundles] = useState<BundleInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get  bundle information from Next.js build output
    const fetchBundleInfo = async () => {
      try {
        // In production, this would connect to your build analytics
        // For now, we'll use performance.getEntriesByType to get script sizes
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

        const scripts = resources
          .filter((resource) => resource.name.includes('.js') || resource.name.includes('.css'))
          .map((resource) => ({
            name: resource.name.split('/').pop() || 'unknown',
            size: resource.transferSize || 0,
            gzipSize: resource.encodedBodySize || 0,
            category: resource.name.includes('_app')
              ? 'page'
              : resource.name.includes('node_modules')
                ? 'library'
                : ('component' as 'page' | 'component' | 'library'),
          }))
          .filter((bundle) => bundle.size > 0)
          .sort((a, b) => b.size - a.size)
          .slice(0, 10) // Top 10 largest bundles

        setBundles(scripts)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch bundle info:', error)
        setLoading(false)
      }
    }

    fetchBundleInfo()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'page':
        return <FileText className="h-4 w-4" />
      case 'library':
        return <Package className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'page':
        return 'text-blue-500'
      case 'library':
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0)
  const totalGzipSize = bundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Bundle Size Monitor</h3>
          <p className="text-sm text-muted-foreground">Track JavaScript and CSS bundle sizes</p>
        </div>
        {totalSize > 0 && (
          <div className="text-right">
            <p className="text-sm font-medium">Total Size</p>
            <p className="text-2xl font-bold">{formatBytes(totalGzipSize)}</p>
            <p className="text-xs text-muted-foreground">gzipped</p>
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading bundle information...</div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>No bundle information available</p>
          <p className="text-xs mt-1">Run a production build to see bundle sizes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map((bundle, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(getCategoryColor(bundle.category))}>
                    {getCategoryIcon(bundle.category)}
                  </span>
                  <span className="font-medium text-sm truncate max-w-[300px]">{bundle.name}</span>
                </div>
                <span className="text-sm font-medium">{formatBytes(bundle.gzipSize)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        bundle.gzipSize > 100 * 1024
                          ? 'bg-red-500'
                          : bundle.gzipSize > 50 * 1024
                            ? 'bg-amber-500'
                            : 'bg-green-500',
                      )}
                      style={{
                        width: `${(bundle.gzipSize / totalGzipSize) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {((bundle.gzipSize / totalGzipSize) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Bundle sizes are measured from loaded resources. For detailed analysis, run{' '}
          <code className="px-1 py-0.5 bg-muted rounded">npm run analyze</code>
        </p>
      </div>
    </Card>
  )
}
