import { type Severity } from '@/schemas/common'

const SEVERITY_ORDER: Record<Severity, number> = { low: 1, medium: 2, high: 3 }

interface RiskProfileSummary {
  highestSeverity: Severity | null
}

interface ListingWithRiskProfile {
  id: string
  author?: { name: string | null } | null
  authorRiskProfile?: RiskProfileSummary | null
  submissionRiskProfile?: RiskProfileSummary | null
}

interface ConfirmFn {
  (opts: { title: string; description: string; confirmText: string }): Promise<boolean>
}

function getHighestRiskSeverity(listing: ListingWithRiskProfile): Severity | null {
  const severities = [
    listing.submissionRiskProfile?.highestSeverity,
    listing.authorRiskProfile?.highestSeverity,
  ].filter((severity): severity is Severity => Boolean(severity))

  return severities.reduce<Severity | null>((highest, severity) => {
    if (!highest) return severity
    return SEVERITY_ORDER[severity] > SEVERITY_ORDER[highest] ? severity : highest
  }, null)
}

export async function confirmBulkApproval<T extends ListingWithRiskProfile>(
  allListings: T[],
  selectedIds: string[],
  confirm: ConfirmFn,
  entityLabel: string,
): Promise<boolean> {
  const selectedListings = allListings.filter((listing) => selectedIds.includes(listing.id))
  const riskyListings = selectedListings.filter((listing) => getHighestRiskSeverity(listing))

  if (riskyListings.length > 0) {
    const riskyAuthors = [...new Set(riskyListings.map((l) => l.author?.name || 'Unknown'))]
    const highestRisk = riskyListings.reduce<Severity | null>((highest, listing) => {
      const severity = getHighestRiskSeverity(listing)
      if (!severity) return highest
      if (!highest) return severity
      return SEVERITY_ORDER[severity] > SEVERITY_ORDER[highest] ? severity : highest
    }, null)

    return confirm({
      title: 'Bulk Approval Warning',
      description: `You are about to approve ${selectedIds.length} ${entityLabel}, including ${riskyListings.length} with review risk signals (highest: ${highestRisk}).\n\nFlagged authors:\n${riskyAuthors.map((name) => `  ${name}`).join('\n')}\n\nAre you sure you want to proceed?`,
      confirmText: 'Approve Selected',
    })
  }

  return confirm({
    title: 'Bulk Approval Confirmation',
    description: `You are about to approve ${selectedIds.length} ${entityLabel}. Are you sure you want to proceed?`,
    confirmText: 'Approve Selected',
  })
}
