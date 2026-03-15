import { type ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  icon?: ReactNode
}

function VoteStatCard(props: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {props.icon}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {props.label}
        </span>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{props.value}</span>
    </div>
  )
}

export default VoteStatCard
