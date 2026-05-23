import { ArrowDown, ArrowUp } from 'lucide-react'

interface Props {
  value: boolean
}

export function VoteDirectionIcon(props: Props) {
  const label = props.value ? 'Upvote' : 'Downvote'
  return props.value ? (
    <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" aria-label={label} role="img" />
  ) : (
    <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" aria-label={label} role="img" />
  )
}
