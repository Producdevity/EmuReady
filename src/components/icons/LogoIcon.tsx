import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

function LogoIcon(props: Props) {
  return (
    <Image
      src="/logo/EmuReady_icon_logo.png"
      alt="EmuReady Logo"
      width={48}
      height={48}
      className={cn(
        'w-12 h-auto rounded-md shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
        props.className,
      )}
    />
  )
}

export default LogoIcon
