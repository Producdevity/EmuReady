import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui'

// Loading component for dynamic imports
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner />
  </div>
)

/**
 * Dynamic imports for components with large dependencies or admin-only usage
 */

// Editor components with large dependencies
export const MarkdownEditor = dynamic(
  () =>
    import('@/components/ui/form/MarkdownEditor').then((mod) => ({
      default: mod.MarkdownEditor,
    })),
  {
    loading: LoadingFallback,
    ssr: false,
  },
)

export const TranslatableMarkdown = dynamic(
  () =>
    import('@/components/ui/form/TranslatableMarkdown').then((mod) => ({
      default: mod.TranslatableMarkdown,
    })),
  {
    loading: LoadingFallback,
    ssr: false,
  },
)

// Admin components
export const CustomFieldList = dynamic(
  () =>
    import(
      '@/app/admin/emulators/[emulatorId]/custom-fields/components/CustomFieldList'
    ),
  { loading: LoadingFallback },
)

export const RolePermissionMatrix = dynamic(
  () => import('@/app/admin/permissions/components/RolePermissionMatrix'),
  { loading: LoadingFallback },
)

export const TrustStatsOverview = dynamic(
  () => import('@/app/admin/trust-logs/components/TrustStatsOverview'),
  { loading: LoadingFallback },
)
