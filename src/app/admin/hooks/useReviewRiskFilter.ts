import { useState } from 'react'
import { REVIEW_RISK_FILTERS, type ReviewRiskFilter } from '@/schemas/submissionRisk'

interface Options {
  clearSelection: () => void
  resetPage: () => void
}

interface ReviewRiskFilterState {
  isRiskOnly: boolean
  riskFilter: ReviewRiskFilter
  toggleRiskFilter: () => void
}

export function useReviewRiskFilter(options: Options): ReviewRiskFilterState {
  const [isRiskOnly, setIsRiskOnly] = useState(false)

  const toggleRiskFilter = () => {
    setIsRiskOnly((current) => !current)
    options.clearSelection()
    options.resetPage()
  }

  return {
    isRiskOnly,
    riskFilter: isRiskOnly ? REVIEW_RISK_FILTERS.RISKY : REVIEW_RISK_FILTERS.ALL,
    toggleRiskFilter,
  }
}
