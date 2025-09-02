import { cn } from '@/lib/utils'

interface Props {
  text?: string
  className?: string
}

export function Divider(props: Props) {
  if (props.text) {
    return (
      <div className={cn('flex items-center', props.className)}>
        <div className="flex-1 border-t border-gray-600" />
        <span className="px-2 text-sm text-gray-400">{props.text}</span>
        <div className="flex-1 border-t border-gray-600" />
      </div>
    )
  }

  return <div className={cn('border-t border-gray-600', props.className)} />
}
