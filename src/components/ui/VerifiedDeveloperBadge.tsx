import { CheckCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md'
  showText?: boolean
}

export function VerifiedDeveloperBadge(props: Props) {
  const size = props.size ?? 'md'
  const showText = props.showText ?? false

  const BadgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'text-xs' : 'text-sm',
        props.className,
      )}
      title="Verified Developer"
    >
      <CheckCircle
        className={cn(
          'text-blue-500 dark:text-blue-400',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
        )}
      />
      {showText && (
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          Verified Developer
        </span>
      )}
    </div>
  )

  return showText ? (
    BadgeContent
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
      <TooltipContent>Verified Developer</TooltipContent>
    </Tooltip>
  )
}
