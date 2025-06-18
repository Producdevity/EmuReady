interface StatItem {
  label: string
  value: number
  color: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'gray'
}

const colorClasses: Record<StatItem['color'], string> = {
  yellow: 'text-yellow-600 dark:text-yellow-400',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  gray: 'text-gray-600 dark:text-gray-400',
}

interface Props {
  stats: StatItem[]
  isLoading?: boolean
}

function AdminStatsBar(props: Props) {
  if (props.isLoading) {
    return (
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {props.stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div
            className={`text-2xl font-bold ${colorClasses[stat.color] || colorClasses.gray}`}
          >
            {stat.value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminStatsBar
