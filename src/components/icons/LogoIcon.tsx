import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  animation?: boolean
}

export function LogoIcon(props: Props) {
  return (
    <Image
      src="/logo/460x460_rounded.png"
      alt="EmuReady Logo"
      width={48}
      height={48}
      className={cn(
        'w-12 h-auto shadow-lg',
        props.animation
          ? 'transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3'
          : '',
        props.className,
      )}
      unoptimized
    />
  )
}
