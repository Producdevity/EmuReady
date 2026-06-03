import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  reportLabel: 'handheld' | 'PC'
  isSubmitting: boolean
  onAutoReject: () => void
}

export function ReviewRiskAutoRejectPanel(props: Props) {
  const reportLabel = props.reportLabel === 'PC' ? 'PC reports' : 'handheld reports'

  return (
    <div className="mb-4 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">
              Auto-reject matching review-risk reports
            </h2>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Applies to all pending {reportLabel} with high submission risk or any author risk
              signal.
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={ShieldAlert}
          onClick={props.onAutoReject}
          disabled={props.isSubmitting}
          isLoading={props.isSubmitting}
          className="w-full sm:w-auto"
        >
          Reject Matching Reports
        </Button>
      </div>
    </div>
  )
}
