import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type Maybe } from '@/types/utils'
import getSystemIcon from './systems/getSystemIcon'

type Size = NonNullable<Props['size']>

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
}

interface Props {
  systemKey: Maybe<string>
  className?: string
  size?: 'sm' | 'md' | 'lg'
  name: string
}

export function SystemIcon(props: Props) {
  const IconComponent = getSystemIcon(props.systemKey)

  return IconComponent ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <div
            className={cn(
              'flex items-center justify-center dark:bg-gray-200 dark:rounded-2xl dark:p-1 overflow-hidden',
              props.size ? sizeClasses[props.size] : sizeClasses.md,
              props.className,
            )}
          >
            <IconComponent />
          </div>
          <span className="sr-only">{props.name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{props.name}</TooltipContent>
    </Tooltip>
  ) : (
    props.name
  )
}
