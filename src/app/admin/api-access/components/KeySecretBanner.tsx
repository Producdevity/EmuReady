import { Button, Card, Code } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type KeyDialogState } from './types'

interface Props {
  state: KeyDialogState
  description: string
  onDismiss: () => void
  tone: 'amber' | 'blue'
}

const toneStyles: Record<
  Props['tone'],
  { container: string; heading: string; text: string; code: string; masked: string; button: string }
> = {
  amber: {
    container: 'border-amber-200 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20',
    heading: 'text-amber-900 dark:text-amber-200',
    text: 'text-amber-800 dark:text-amber-200',
    code: 'bg-amber-900/90 text-white',
    masked: 'bg-amber-200/80 text-amber-900 dark:bg-amber-800/40 dark:text-amber-100',
    button: 'border-amber-400 text-amber-800 dark:border-amber-500 dark:text-amber-100',
  },
  blue: {
    container: 'border-blue-200 bg-blue-50 dark:border-blue-700/60 dark:bg-blue-900/20',
    heading: 'text-blue-900 dark:text-blue-200',
    text: 'text-blue-800 dark:text-blue-200',
    code: 'bg-blue-900/90 text-white',
    masked: 'bg-blue-200/80 text-blue-900 dark:bg-blue-800/40 dark:text-blue-100',
    button: 'border-blue-400 text-blue-800 dark:border-blue-500 dark:text-blue-100',
  },
}

export function KeySecretBanner(props: Props) {
  const styles = toneStyles[props.tone]

  return (
    <Card className={cn('mb-6 p-4', styles.container)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className={cn('text-sm font-semibold', styles.heading)}>{props.state.title}</h3>
          <p className={cn('text-xs', styles.text)}>{props.description}</p>
          <Code
            label={props.state.plaintext}
            value={props.state.plaintext}
            className={cn('block w-full break-all text-sm font-mono', styles.code)}
          />
          <div className={cn('flex items-center gap-2 text-xs', styles.text)}>
            <span>Masked preview:</span>
            <Code
              label={props.state.masked}
              value={props.state.masked}
              hideTooltip
              className={cn(styles.masked)}
            />
          </div>
        </div>
        <Button size="sm" variant="outline" className={styles.button} onClick={props.onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  )
}
