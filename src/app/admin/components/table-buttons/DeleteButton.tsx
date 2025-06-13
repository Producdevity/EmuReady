import { Trash2 } from 'lucide-react'
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'

interface Props {
  onClick: () => void
  entityName?: string
}

function DeleteButton(props: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
          onClick={props.onClick}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {props.entityName ? `Delete ${props.entityName}` : 'Delete'}
      </TooltipContent>
    </Tooltip>
  )
}

export default DeleteButton
