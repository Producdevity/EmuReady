import { type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  className?: string
}

function Code(props: Props) {
  return (
    <code
      className={cn(
        'text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded',
        props.className,
      )}
    >
      {props.children}
    </code>
  )
}

export default Code
