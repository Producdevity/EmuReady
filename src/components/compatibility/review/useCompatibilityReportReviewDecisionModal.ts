'use client'

import { useState } from 'react'
import {
  type CompatibilityReportReviewDecision,
  type CompatibilityReportReviewSource,
} from './reviewItem'

interface ReviewDecisionModalState<TReport extends CompatibilityReportReviewSource> {
  isOpen: boolean
  selectedReport: TReport | null
  decision: CompatibilityReportReviewDecision | null
  notes: string
  open: (report: TReport, decision: CompatibilityReportReviewDecision) => void
  close: () => void
  setNotes: (notes: string) => void
}

export function useCompatibilityReportReviewDecisionModal<
  TReport extends CompatibilityReportReviewSource,
>(): ReviewDecisionModalState<TReport> {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<TReport | null>(null)
  const [decision, setDecision] = useState<CompatibilityReportReviewDecision | null>(null)
  const [notes, setNotes] = useState('')

  const open = (report: TReport, nextDecision: CompatibilityReportReviewDecision) => {
    setSelectedReport(report)
    setDecision(nextDecision)
    setNotes('')
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setSelectedReport(null)
    setDecision(null)
    setNotes('')
  }

  return {
    isOpen,
    selectedReport,
    decision,
    notes,
    open,
    close,
    setNotes,
  }
}
