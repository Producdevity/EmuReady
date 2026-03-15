import { z } from 'zod'
import { Severity } from './common'

export const RISK_SIGNAL_TYPES = {
  ACTIVE_BAN: 'ACTIVE_BAN',
  SUSPICIOUS_VOTING: 'SUSPICIOUS_VOTING',
  ACTIVE_REPORTS: 'ACTIVE_REPORTS',
  NEW_AUTHOR: 'NEW_AUTHOR',
  NEGATIVE_TRUST_SCORE: 'NEGATIVE_TRUST_SCORE',
  PREVIOUSLY_REJECTED: 'PREVIOUSLY_REJECTED',
} as const

export type RiskSignalType = (typeof RISK_SIGNAL_TYPES)[keyof typeof RISK_SIGNAL_TYPES]

const RiskSignalTypeSchema = z.enum([
  RISK_SIGNAL_TYPES.ACTIVE_BAN,
  RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING,
  RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
  RISK_SIGNAL_TYPES.NEW_AUTHOR,
  RISK_SIGNAL_TYPES.NEGATIVE_TRUST_SCORE,
  RISK_SIGNAL_TYPES.PREVIOUSLY_REJECTED,
])

export const AuthorRiskSignalSchema = z.object({
  type: RiskSignalTypeSchema,
  severity: Severity,
  label: z.string(),
  description: z.string(),
})
export type AuthorRiskSignal = z.infer<typeof AuthorRiskSignalSchema>

export const AuthorRiskProfileSchema = z.object({
  authorId: z.string().uuid(),
  signals: z.array(AuthorRiskSignalSchema),
  highestSeverity: Severity.nullable(),
})
export type AuthorRiskProfile = z.infer<typeof AuthorRiskProfileSchema>
