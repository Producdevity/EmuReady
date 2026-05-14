import { z } from 'zod'
import { Severity } from './common'

export const SUBMISSION_RISK_SIGNAL_TYPES = {
  PLACEHOLDER_EMULATOR_VERSION: 'PLACEHOLDER_EMULATOR_VERSION',
} as const

export const EMULATOR_VERSION_FIELD_NAME = 'emulator_version'

export const REVIEW_RISK_FILTERS = {
  ALL: 'all',
  RISKY: 'risky',
} as const

export type SubmissionRiskSignalType =
  (typeof SUBMISSION_RISK_SIGNAL_TYPES)[keyof typeof SUBMISSION_RISK_SIGNAL_TYPES]
export type ReviewRiskFilter = (typeof REVIEW_RISK_FILTERS)[keyof typeof REVIEW_RISK_FILTERS]

const SubmissionRiskSignalTypeSchema = z.enum([
  SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
])

export const ReviewRiskFilterSchema = z.enum([REVIEW_RISK_FILTERS.ALL, REVIEW_RISK_FILTERS.RISKY])

export const SubmissionRiskSignalSchema = z.object({
  type: SubmissionRiskSignalTypeSchema,
  severity: Severity,
  label: z.string(),
  description: z.string(),
})
export type SubmissionRiskSignal = z.infer<typeof SubmissionRiskSignalSchema>

export const SubmissionRiskProfileSchema = z.object({
  listingId: z.string().uuid(),
  signals: z.array(SubmissionRiskSignalSchema),
  highestSeverity: Severity.nullable(),
})
export type SubmissionRiskProfile = z.infer<typeof SubmissionRiskProfileSchema>
