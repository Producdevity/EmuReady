import { ReportReason } from '@orm'

export const REPORT_REASON_OPTIONS = [
  { value: ReportReason.SPAM, label: 'Spam or repetitive content' },
  {
    value: ReportReason.INAPPROPRIATE_CONTENT,
    label: 'Inappropriate or offensive content',
  },
  {
    value: ReportReason.MISLEADING_INFORMATION,
    label: 'Misleading or false information',
  },
  { value: ReportReason.FAKE_LISTING, label: 'Fake or fabricated report' },
  { value: ReportReason.COPYRIGHT_VIOLATION, label: 'Copyright violation' },
  { value: ReportReason.OTHER, label: 'Other (please specify)' },
] as const

export type ReportReasonOptionValue = (typeof REPORT_REASON_OPTIONS)[number]['value']

export function isReportReasonOptionValue(value: string): value is ReportReasonOptionValue {
  return REPORT_REASON_OPTIONS.some((reason) => reason.value === value)
}
