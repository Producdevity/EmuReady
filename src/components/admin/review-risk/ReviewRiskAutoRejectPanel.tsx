import { ShieldAlert } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { formatCountLabel } from '@/utils/text'

interface Props {
  reportLabel: 'handheld' | 'PC'
  eligibleCount: number | undefined
  reviewRiskQueueCount: number | undefined
  isCountLoading: boolean
  hasCountError: boolean
  isSubmitting: boolean
  onAutoReject: () => void
}

export function ReviewRiskAutoRejectPanel(props: Props) {
  const singularReportLabel = props.reportLabel === 'PC' ? 'PC report' : 'handheld report'
  const pluralReportLabel = `${singularReportLabel}s`
  const eligibleCount = props.eligibleCount ?? 0
  const canReject = !props.isCountLoading && !props.hasCountError && eligibleCount > 0
  const eligibleCountLabel = props.hasCountError
    ? 'Unavailable'
    : props.isCountLoading
      ? 'Checking...'
      : formatCountLabel(singularReportLabel, eligibleCount)
  const queueCountLabel =
    props.reviewRiskQueueCount === undefined
      ? '...'
      : formatCountLabel(singularReportLabel, props.reviewRiskQueueCount)
  const buttonLabel = props.hasCountError
    ? 'Count Unavailable'
    : props.isCountLoading
      ? 'Checking Reports'
      : eligibleCount === 0
        ? 'No Matching Reports'
        : `Reject ${eligibleCount.toLocaleString()} Report${eligibleCount === 1 ? '' : 's'}`

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-md bg-red-100 p-2 text-red-700 dark:bg-red-900/50 dark:text-red-300">
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">
              Auto-reject matching review-risk reports
            </h2>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Scans all pending {pluralReportLabel} and matches high author risk, or high submission
              risk plus at least one author risk signal.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="danger" size="md">
                Eligible: {eligibleCountLabel}
              </Badge>
              <Badge variant="warning" size="md">
                All pending review-risk queue: {queueCountLabel}
              </Badge>
              <Badge variant="default" size="md">
                Notes generated per report
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={ShieldAlert}
          onClick={props.onAutoReject}
          disabled={!canReject || props.isSubmitting}
          isLoading={props.isSubmitting}
          className="w-full shrink-0 sm:w-auto"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
