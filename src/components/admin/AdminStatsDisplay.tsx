interface StatItem {
  label: string
  value: number
  color: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'gray'
  description?: string
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
  className?: string
}

export function AdminStatsDisplay(props: Props) {
  if (props.isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${props.className || ''}`}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${props.className || ''}`}
    >
      {props.stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div
            className={`text-2xl font-bold ${colorClasses[stat.color] || colorClasses.gray}`}
            title={stat.description}
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
