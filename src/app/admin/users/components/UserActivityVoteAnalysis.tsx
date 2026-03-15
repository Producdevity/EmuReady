'use client'

import { AlertTriangle, RotateCcw, Shield, ThumbsDown, ThumbsUp } from 'lucide-react'
import {
  Badge,
  Button,
  LoadingSpinner,
  severityBadgeVariant,
  useConfirmDialog,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  userId: string
}

function UserActivityVoteAnalysis(props: Props) {
  const confirm = useConfirmDialog()

  const patternsQuery = api.voteInvestigation.analyzePatterns.useQuery(
    { userId: props.userId },
    { enabled: !!props.userId },
  )

  const nullifyMutation = api.voteInvestigation.nullifyVotes.useMutation({
    onSuccess: (result) => {
      const total =
        result.handheldVotesNullified +
        result.pcVotesNullified +
        result.commentVotesNullified +
        result.pcCommentVotesNullified
      toast.success(
        `Nullified ${total} votes, recalculated ${result.listingsRecalculated} listings`,
      )
      void patternsQuery.refetch()
    },
    onError: (err) => toast.error(`Failed to nullify votes: ${getErrorMessage(err)}`),
  })

  const restoreMutation = api.voteInvestigation.restoreVotes.useMutation({
    onSuccess: (result) => {
      const total =
        result.handheldVotesRestored +
        result.pcVotesRestored +
        result.commentVotesRestored +
        result.pcCommentVotesRestored
      toast.success(`Restored ${total} votes, recalculated ${result.listingsRecalculated} listings`)
      void patternsQuery.refetch()
    },
    onError: (err) => toast.error(`Failed to restore votes: ${getErrorMessage(err)}`),
  })

  const handleNullify = async () => {
    if (!patternsQuery.data) return
    const confirmed = await confirm({
      title: 'Nullify All Votes',
      description: `This will nullify ${patternsQuery.data.summary.totalVotes} active votes, recalculate all affected listing scores, and reverse trust impacts. This action can be undone with "Restore Votes".`,
      confirmText: 'Nullify Votes',
    })
    if (!confirmed) return
    nullifyMutation.mutate({
      userId: props.userId,
      reason: 'Vote manipulation investigation',
      includeCommentVotes: true,
    })
  }

  const handleRestore = async () => {
    const confirmed = await confirm({
      title: 'Restore Nullified Votes',
      description:
        'This will restore all previously nullified votes, recalculate listing scores, and re-apply trust impacts.',
      confirmText: 'Restore Votes',
    })
    if (!confirmed) return
    restoreMutation.mutate({
      userId: props.userId,
      reason: 'Vote restoration after investigation',
    })
  }

  if (patternsQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (!patternsQuery.data) return null

  const { summary, flags, targetedAuthors } = patternsQuery.data
  const isMutating = nullifyMutation.isPending || restoreMutation.isPending

  return (
    <div className="space-y-2">
      {/* Suspicious Flags */}
      {flags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-red-800 dark:text-red-200">
              Suspicious Patterns Detected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {flags.map((flag, i) => (
              <Badge key={i} variant={severityBadgeVariant[flag.severity]} size="sm">
                {flag.description}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Compact Stats + Actions Row */}
      <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-green-500" />
            {summary.upvotes}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="w-3 h-3 text-red-500" />
            {summary.downvotes}
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span>{summary.downvotePercentage}% down</span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span>24h: {summary.votesLast24h}</span>
          <span>7d: {summary.votesLast7d}</span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span>avg: {summary.averageVotesPerDay}/day</span>
          <span className="font-medium text-gray-900 dark:text-white">
            Total: {summary.totalVotes}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {summary.totalVotes > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={Shield}
              onClick={handleNullify}
              isLoading={nullifyMutation.isPending}
              disabled={isMutating}
              className="text-xs"
            >
              Nullify ({summary.totalVotes})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleRestore}
            isLoading={restoreMutation.isPending}
            disabled={isMutating}
            className="text-xs"
          >
            Restore
          </Button>
        </div>
      </div>

      {/* Targeted Authors — collapsible, default open when suspicious flags present */}
      {targetedAuthors.length > 0 && (
        <details open={flags.length > 0 || undefined}>
          <summary className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-gray-900 dark:hover:text-white py-1">
            Targeted Authors ({targetedAuthors.length})
          </summary>
          <div className="border dark:border-gray-700 rounded-md overflow-hidden mt-1">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">
                    Author
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">
                    Votes
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">
                    Down
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">
                    Conc.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {targetedAuthors.slice(0, 10).map((author) => (
                  <tr key={author.authorId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 text-gray-900 dark:text-white truncate max-w-[140px]">
                      {author.authorName ?? 'Unknown'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-400">
                      {author.totalVotes}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <span
                        className={
                          author.downvotes > 0
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {author.downvotes}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-400">
                      <Badge
                        variant={author.concentration > 50 ? 'danger' : 'default'}
                        size="sm"
                        className="text-xs"
                      >
                        {author.concentration}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}

export default UserActivityVoteAnalysis
