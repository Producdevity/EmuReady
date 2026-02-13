'use client'

import { AlertTriangle, RotateCcw, Shield, ThumbsDown, ThumbsUp, TrendingDown } from 'lucide-react'
import { Badge, Button, LoadingSpinner, SeverityBadge, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import UserActivityMiniStat from './UserActivityMiniStat'

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
      <div className="flex justify-center py-6">
        <LoadingSpinner />
      </div>
    )
  }

  if (!patternsQuery.data) return null

  const isMutating = nullifyMutation.isPending || restoreMutation.isPending

  return (
    <div className="space-y-3">
      {/* Suspicious Flags */}
      {patternsQuery.data.flags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-red-800 dark:text-red-200">
              Suspicious Patterns Detected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patternsQuery.data.flags.map((flag, i) => (
              <SeverityBadge key={i} severity={flag.severity}>
                {flag.description}
              </SeverityBadge>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <UserActivityMiniStat label="Total" value={patternsQuery.data.summary.totalVotes} />
        <UserActivityMiniStat
          label="Upvotes"
          value={patternsQuery.data.summary.upvotes}
          icon={<ThumbsUp className="w-3 h-3 text-green-500" />}
        />
        <UserActivityMiniStat
          label="Downvotes"
          value={patternsQuery.data.summary.downvotes}
          icon={<ThumbsDown className="w-3 h-3 text-red-500" />}
        />
        <UserActivityMiniStat
          label="Down %"
          value={`${patternsQuery.data.summary.downvotePercentage}%`}
          icon={<TrendingDown className="w-3 h-3 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <UserActivityMiniStat label="Last 24h" value={patternsQuery.data.summary.votesLast24h} />
        <UserActivityMiniStat label="Last 7d" value={patternsQuery.data.summary.votesLast7d} />
        <UserActivityMiniStat
          label="Avg/Day"
          value={patternsQuery.data.summary.averageVotesPerDay}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {patternsQuery.data.summary.totalVotes > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleNullify}
            isLoading={nullifyMutation.isPending}
            disabled={isMutating}
            className="text-xs"
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Nullify All Votes ({patternsQuery.data.summary.totalVotes})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestore}
          isLoading={restoreMutation.isPending}
          disabled={isMutating}
          className="text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Restore Nullified
        </Button>
      </div>

      {/* Targeted Authors */}
      {patternsQuery.data.targetedAuthors.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Targeted Authors
          </h4>
          <div className="border dark:border-gray-700 rounded-md overflow-hidden">
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
                {patternsQuery.data.targetedAuthors.slice(0, 10).map((author) => (
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
        </div>
      )}
    </div>
  )
}

export default UserActivityVoteAnalysis
