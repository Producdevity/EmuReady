import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  message: string
  onRetry: () => void
  title?: string
  retryLabel?: string
}

export function AdminErrorState(props: Props) {
  return (
    <div className="container mx-auto px-2 md:px-4 mb-8">
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-800 dark:bg-red-900/20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-red-500 dark:text-red-400"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">
                {props.title ?? 'Unable to load admin data'}
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">{props.message}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={props.onRetry}
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/30"
          >
            {props.retryLabel ?? 'Try Again'}
          </Button>
        </div>
      </div>
    </div>
  )
}
