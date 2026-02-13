import { type ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  icon?: ReactNode
}

function UserActivityMiniStat(props: Props) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
      <div className="flex items-center gap-1 mb-0.5">
        {props.icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{props.label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{props.value}</span>
    </div>
  )
}

export default UserActivityMiniStat
