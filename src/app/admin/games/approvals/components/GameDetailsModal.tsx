import { Modal, Button, ApprovalStatusBadge } from '@/components/ui'
import { formatDate } from '@/utils/date'
import { type ProcessingAction } from '@/app/admin/games/approvals/page'
import { type Nullable } from '@/types/utils'
import { type RouterOutput } from '@/types/trpc'

type Game = RouterOutput['games']['getPendingGames']['games'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedGame: Game | null
  onShowConfirmation: (gameId: string, action: ProcessingAction) => void
  isProcessing: boolean
  processingAction: Nullable<ProcessingAction>
}

function GameDetailsModal(props: Props) {
  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Game Details">
      {props.selectedGame && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {props.selectedGame.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {props.selectedGame.system.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Submitter
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {props.selectedGame.submitter?.name ?? 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Submitted Date
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(props.selectedGame.submittedAt!)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Status
            </label>
            <ApprovalStatusBadge status={props.selectedGame.status} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="primary"
              onClick={() =>
                props.onShowConfirmation(props.selectedGame!.id, 'approve')
              }
              disabled={props.isProcessing}
              isLoading={props.processingAction === 'approve'}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                props.onShowConfirmation(props.selectedGame!.id, 'reject')
              }
              disabled={props.isProcessing}
              isLoading={props.processingAction === 'reject'}
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default GameDetailsModal
