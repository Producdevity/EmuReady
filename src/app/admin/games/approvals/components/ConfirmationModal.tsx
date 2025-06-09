import { Modal, Button } from '@/components/ui'
import { type ProcessingAction } from '@/app/admin/games/approvals/page'
import { type Nullable } from '@/types/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  action: Nullable<ProcessingAction>
  gameTitle: string
  onConfirm: () => void
  isProcessing: boolean
}

function ConfirmationModal(props: Props) {
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={`Confirm ${props.action === 'approve' ? 'Approval' : 'Rejection'}`}
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to {props.action} the game{' '}
          <strong>&ldquo;{props.gameTitle}&rdquo;</strong>?
        </p>

        {props.action === 'reject' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">
              Rejecting this game will prevent it from being visible to users
              and cannot be undone easily.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={props.onClose}
            disabled={props.isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant={props.action === 'approve' ? 'primary' : 'danger'}
            onClick={props.onConfirm}
            disabled={props.isProcessing}
            isLoading={props.isProcessing}
          >
            Confirm {props.action === 'approve' ? 'Approval' : 'Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmationModal
