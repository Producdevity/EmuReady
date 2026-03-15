import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface UnderlineTab {
  id: string
  label: string
  count?: number
  icon?: LucideIcon
}

interface Props {
  tabs: UnderlineTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function UnderlineTabBar(props: Props) {
  const size = props.size ?? 'sm'

  return (
    <div
      className={cn('flex gap-1 border-b border-gray-200 dark:border-gray-700', props.className)}
    >
      {props.tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = props.activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => props.onTabChange(tab.id)}
            className={cn(
              'flex items-center font-medium border-b-2 transition-colors -mb-px',
              size === 'sm' ? 'gap-1.5 px-3 py-2 text-xs' : 'gap-2 px-4 py-2.5 text-sm',
              isActive
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center font-semibold rounded-full',
                  size === 'sm'
                    ? 'min-w-[18px] h-4 px-1 text-[10px]'
                    : 'min-w-[20px] h-5 px-1.5 text-xs',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
