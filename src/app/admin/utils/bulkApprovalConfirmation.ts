type RiskSeverity = 'low' | 'medium' | 'high'

interface ListingWithRiskProfile {
  id: string
  author?: { name: string | null } | null
  authorRiskProfile?: { highestSeverity: string | null } | null
}

interface ConfirmFn {
  (opts: { title: string; description: string; confirmText: string }): Promise<boolean>
}

/**
 * Analyzes risk profiles in a selection of listings and prompts the admin
 * for confirmation before bulk approval. Returns true if the admin confirmed.
 */
export async function confirmBulkApproval<T extends ListingWithRiskProfile>(
  allListings: T[],
  selectedIds: string[],
  confirm: ConfirmFn,
  entityLabel: string,
): Promise<boolean> {
  const selectedListings = allListings.filter((listing) => selectedIds.includes(listing.id))
  const riskyListings = selectedListings.filter(
    (listing) => listing.authorRiskProfile?.highestSeverity !== null,
  )

  if (riskyListings.length > 0) {
    const riskyAuthors = [...new Set(riskyListings.map((l) => l.author?.name || 'Unknown'))]
    const severityOrder: Record<RiskSeverity, number> = { low: 1, medium: 2, high: 3 }
    const highestRisk = riskyListings.reduce<string | null>((max, l) => {
      const severity = l.authorRiskProfile?.highestSeverity as RiskSeverity | null
      if (!severity) return max
      if (!max) return severity
      return severityOrder[severity] > severityOrder[max as RiskSeverity] ? severity : max
    }, null)

    return confirm({
      title: 'Bulk Approval Warning',
      description: `You are about to approve ${selectedIds.length} ${entityLabel}, including ${riskyListings.length} from authors with risk signals (highest: ${highestRisk}).\n\nFlagged authors:\n${riskyAuthors.map((name) => `  ${name}`).join('\n')}\n\nAre you sure you want to proceed?`,
      confirmText: 'Approve Selected',
    })
  }

  return confirm({
    title: 'Bulk Approval Confirmation',
    description: `You are about to approve ${selectedIds.length} ${entityLabel}. Are you sure you want to proceed?`,
    confirmText: 'Approve Selected',
  })
}
