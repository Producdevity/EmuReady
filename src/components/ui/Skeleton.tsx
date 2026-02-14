import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function Skeleton(props: Props) {
  return (
    <div
      className={cn('animate-pulse rounded bg-gray-200 dark:bg-gray-700', props.className)}
      aria-hidden="true"
    />
  )
}
