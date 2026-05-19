'use client'

import { CompatibilityReportReviewModal } from './CompatibilityReportReviewModal'
import {
  type CompatibilityReportReviewDecision,
  type CompatibilityReportReviewSource,
  toCompatibilityReportReviewItem,
} from './reviewItem'

interface Props {
  isOpen: boolean
  onClose: () => void
  decision: CompatibilityReportReviewDecision
  reportLabel: string
  report: CompatibilityReportReviewSource
  rejectionNotes: string
  onRejectionNotesChange: (notes: string) => void
  onSubmit: () => void | Promise<void>
  isSubmitting: boolean
}

export function CompatibilityReportReviewModalAdapter(props: Props) {
  return (
    <CompatibilityReportReviewModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      decision={props.decision}
      reportLabel={props.reportLabel}
      report={toCompatibilityReportReviewItem(props.report)}
      rejectionNotes={props.rejectionNotes}
      onRejectionNotesChange={props.onRejectionNotesChange}
      onSubmit={props.onSubmit}
      isSubmitting={props.isSubmitting}
    />
  )
}
