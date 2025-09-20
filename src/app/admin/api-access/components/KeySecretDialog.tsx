import {
  Button,
  Code,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { type KeyDialogState } from './types'

interface Props {
  state: KeyDialogState | null
  onClose: () => void
}

export function KeySecretDialog(props: Props) {
  return (
    <Dialog open={Boolean(props.state)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>{props.state?.title}</DialogTitle>
          <DialogDescription>
            Copy this secret now. It will not be shown again after closing this dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Code
            label={props.state?.plaintext ?? ''}
            value={props.state?.plaintext ?? ''}
            className="block w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words text-sm font-mono bg-gray-900 text-white dark:bg-gray-950"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Masked preview:</span>
            <Code
              label={props.state?.masked ?? ''}
              value={props.state?.masked ?? ''}
              hideTooltip
              className="max-w-full overflow-x-auto whitespace-pre bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={props.onClose}>I have saved it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
