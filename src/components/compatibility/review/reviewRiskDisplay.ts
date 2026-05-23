import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'

export interface RiskSignalForDisplay {
  severity: Severity
  label: string
  description: string
}

export interface ReviewRiskGroupForDisplay {
  title: string
  signals: RiskSignalForDisplay[]
}

interface ReviewRiskProfilesForDisplay {
  authorRiskProfile: AuthorRiskProfile | null | undefined
  submissionRiskProfile: SubmissionRiskProfile | null | undefined
}

const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

export function getReviewRiskGroups(
  profiles: ReviewRiskProfilesForDisplay,
): ReviewRiskGroupForDisplay[] {
  const groups: ReviewRiskGroupForDisplay[] = []

  if (profiles.submissionRiskProfile && profiles.submissionRiskProfile.signals.length > 0) {
    groups.push({ title: 'Submission Risk', signals: profiles.submissionRiskProfile.signals })
  }

  if (profiles.authorRiskProfile && profiles.authorRiskProfile.signals.length > 0) {
    groups.push({ title: 'Author Risk', signals: profiles.authorRiskProfile.signals })
  }

  return groups
}

export function getHighestReviewRiskSeverity(
  groups: readonly ReviewRiskGroupForDisplay[],
): Severity | null {
  let max: Severity | null = null

  for (const group of groups) {
    for (const signal of group.signals) {
      if (!max || SEVERITY_ORDER[signal.severity] > SEVERITY_ORDER[max]) {
        max = signal.severity
      }
    }
  }

  return max
}

export function getReviewRiskSignalCount(groups: readonly ReviewRiskGroupForDisplay[]): number {
  return groups.reduce((total, group) => total + group.signals.length, 0)
}
