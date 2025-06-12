import Image from 'next/image'
import { cn } from '@/lib/utils'
import { type Maybe } from '@/types/utils'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
}

interface Props {
  logo: Maybe<string>
  name: string
  className?: string
  size?: Size
  showLogo?: boolean
}

function EmulatorIcon(props: Props) {
  const sizeClass = props.size ? sizeClasses[props.size] : sizeClasses.md

  // If showLogo is false or no logo is available, show the name
  if (!props.showLogo || !props.logo) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300',
          sizeClass,
          props.className,
        )}
      >
        {props.name}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-1',
        sizeClass,
        props.className,
      )}
    >
      <Image
        src={`/assets/emulators/${props.logo}`}
        alt={props.name}
        width={32}
        height={32}
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
        }}
      />
    </div>
  )
}

export default EmulatorIcon
