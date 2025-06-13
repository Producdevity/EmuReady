import { Pencil } from 'lucide-react'
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

function EditButton(props: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-600 border-gray-400 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-500 dark:hover:bg-gray-700/20"
          onClick={props.onClick}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {props.entityName ? `Edit ${props.entityName}` : 'Edit'}
      </TooltipContent>
    </Tooltip>
  )
}

export default EditButton
