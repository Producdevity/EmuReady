import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface AdminStatItem {
  label: string
  value: number
  color:
    | 'yellow'
    | 'green'
    | 'red'
    | 'blue'
    | 'purple'
    | 'gray'
    | 'orange'
    | 'cyan'
    | 'pink'
    | 'rose'
  description?: string
}

const colorClasses: Record<AdminStatItem['color'], string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  gray: 'text-gray-600 dark:text-gray-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  pink: 'text-pink-600 dark:text-pink-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
  rose: 'text-rose-600 dark:text-rose-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
}

const gridColsMap: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'sm:grid-cols-2 md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-3 lg:grid-cols-6',
  8: 'md:grid-cols-4 lg:grid-cols-8',
}

interface Props {
  stats: AdminStatItem[]
  isLoading?: boolean
  className?: string
}

export function AdminStatsDisplay(props: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 mb-6',
        props.isLoading ? gridColsMap[3] : gridColsMap[props.stats.length],
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
