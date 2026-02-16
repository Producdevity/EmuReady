import { cn } from '@/lib/utils'

interface Props {
  name: string
  color: string
  icon?: string | null
  description?: string | null
  size?: 'sm' | 'md'
}

const sizeConfig = {
  sm: { circle: 'w-4 h-4 text-[10px]', text: 'text-xs' },
  md: { circle: 'w-5 h-5 text-[11px]', text: 'text-xs' },
} as const

export function UserBadgeItem(props: Props) {
  const size = props.size ?? 'sm'
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm border transition-shadow duration-200 hover:shadow-md',
        'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
        size === 'md' && 'gap-2 px-3 py-1.5 dark:bg-gray-800 dark:border-gray-700',
      )}
      title={props.description || props.name}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-bold',
          config.circle,
        )}
        style={{ backgroundColor: props.color }}
      >
        {props.icon?.charAt(0) || props.name.charAt(0).toUpperCase()}
      </div>
      <span className={cn('font-medium text-gray-700 dark:text-gray-300', config.text)}>
        {props.name}
      </span>
    </div>
  )
}
