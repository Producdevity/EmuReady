import { Button } from '@/components/ui'

interface Props {
  message: string
  onRetry: () => void
  retryLabel?: string
}

export function AdminErrorState(props: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg">{props.message}</p>
        <Button onClick={props.onRetry} className="mt-4">
          {props.retryLabel ?? 'Try Again'}
        </Button>
      </div>
    </div>
  )
}
