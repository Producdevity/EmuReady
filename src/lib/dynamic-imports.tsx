import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui'

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner />
  </div>
)

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
    import('@/components/ui/markdown/TranslatableMarkdown').then((mod) => ({
      default: mod.TranslatableMarkdown,
    })),
  {
    loading: LoadingFallback,
    ssr: false,
  },
)

// Admin components
export const RolePermissionMatrix = dynamic(
  () => import('@/app/admin/permissions/components/RolePermissionMatrix'),
  { loading: LoadingFallback },
)
