import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

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

const gridColsMap: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'sm:grid-cols-2 md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-3 lg:grid-cols-6',
}

interface Props {
  stats: StatItem[]
  isLoading?: boolean
  className?: string
}

export function AdminStatsDisplay(props: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        gridColsMap[props.stats.length],
        props.className,
      )}
    >
      {props.isLoading
        ? [1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </Card>
          ))
        : props.stats.map((stat) => (
            <Card key={stat.label}>
              <div
                className={cn(
                  'text-2xl font-bold',
                  colorClasses[stat.color] || colorClasses.gray,
                )}
                title={stat.description}
              >
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </Card>
          ))}
    </div>
  )
}
