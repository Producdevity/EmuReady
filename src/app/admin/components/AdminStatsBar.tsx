interface StatItem {
  label: string
  value: number
  color: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'gray'
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

  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'green':
        return 'text-green-600 dark:text-green-400'
      case 'red':
        return 'text-red-600 dark:text-red-400'
      case 'blue':
        return 'text-blue-600 dark:text-blue-400'
      case 'purple':
        return 'text-purple-600 dark:text-purple-400'
      case 'gray':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="flex items-center gap-4">
      {props.stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className={`text-2xl font-bold ${getColorClasses(stat.color)}`}>
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
