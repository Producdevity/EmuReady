import { type RouterOutput } from '@/types/trpc'
import { VoteRow } from './VoteRow'

type ModeratorInfo = NonNullable<RouterOutput['listings']['moderatorInfo']>

interface Props {
  votes: ModeratorInfo['votes']
  voteCounts: ModeratorInfo['voteCounts']
}

export function VotesSection(props: Props) {
  const { up, down, nullified } = props.voteCounts

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Votes ({up} up, {down} down{nullified > 0 && `, ${nullified} nullified`})
      </h4>
      {props.votes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No votes yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-3 w-8" />
                <th className="pb-2 pr-3">User</th>
                <th className="pb-2 pr-3">Trust</th>
                <th className="pb-2 pr-3">When</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {props.votes.map((vote) => (
                <VoteRow key={vote.id} vote={vote} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
