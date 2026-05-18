import { LoadingSpinner } from '@/components/ui'

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner text="Loading admin panel..." />
    </div>
  )
}
