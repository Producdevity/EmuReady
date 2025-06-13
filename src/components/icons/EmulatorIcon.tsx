import Image from 'next/image'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type Maybe } from '@/types/utils'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
}

const fontSizeClasses: Record<Size, string> = {
  sm: 'text-xs font-medium',
  md: 'text-sm font-medium',
  lg: 'text-base font-medium',
}

interface Props {
  logo: Maybe<string>
  name: string
  className?: string
  textClassName?: string
  size?: Size
  fontSize?: Size
  showLogo?: boolean
}

function EmulatorIcon(props: Props) {
  const sizeClass = props.size ? sizeClasses[props.size] : sizeClasses.md

  if (!props.showLogo || !props.logo) {
    return (
      <span
        className={cn(
          fontSizeClasses[props.fontSize ?? 'md'],
          props.textClassName,
        )}
      >
        {props.name}
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-1',
            sizeClass,
            props.className,
          )}
        >
          <Image
            src={`/assets/emulators/${props.logo}`}
            alt={`${props.name} emulator logo`}
            width={32}
            height={32}
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            }}
            priority={false}
            unoptimized
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{props.name}</TooltipContent>
    </Tooltip>
  )
}

export default EmulatorIcon
