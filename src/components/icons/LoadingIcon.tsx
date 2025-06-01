import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

function LoadingIcon(props: Props) {
  return (
    <div
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        props.className,
      )}
    />
  )
}

export default LoadingIcon
