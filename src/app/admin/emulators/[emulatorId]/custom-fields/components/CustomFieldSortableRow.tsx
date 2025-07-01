import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { type CSSProperties, Fragment, type ReactNode } from 'react'
import { Badge, DeleteButton, EditButton } from '@/components/ui'
import { type Maybe } from '@/types/utils'
import { type CustomFieldDefinition, CustomFieldType, type Prisma } from '@orm'

interface Props {
  field: CustomFieldDefinition
  onEdit: (fieldId: string) => void
  handleDelete: (fieldId: string) => void
  isReorderMode: boolean
  renderOptionsPreview: (optionsAsJson: Maybe<Prisma.JsonValue>) => ReactNode
}

function CustomFieldSortableRow(props: Props) {
  const sortable = useSortable({ id: props.field.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.8 : 1,
    zIndex: sortable.isDragging ? 1 : 0,
    position: 'relative' as const,
  }

  return (
    <Fragment>
      <tr
        ref={sortable.setNodeRef}
        style={style}
        {...(props.isReorderMode ? sortable.attributes : {})}
        {...(props.isReorderMode ? sortable.listeners : {})}
      >
        {props.isReorderMode && (
          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-grab">
            <GripVertical className="h-5 w-5" />
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {props.field.label}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {props.field.name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          <Badge
            variant={
              props.field.type === CustomFieldType.SELECT
                ? 'primary'
                : 'default'
            }
          >
            {props.field.type}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {props.field.isRequired ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="default">No</Badge>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {props.field.type === CustomFieldType.SELECT ? (
            props.renderOptionsPreview(props.field.options)
          ) : (
            <span className="text-gray-500 italic">N/A</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {props.field.displayOrder}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          {!props.isReorderMode && (
            <>
              <EditButton
                title="Edit Custom Field"
                onClick={() => props.onEdit(props.field.id)}
              />
              <DeleteButton
                onClick={() => props.handleDelete(props.field.id)}
                title="Delete Custom Field"
              />
            </>
          )}
        </td>
      </tr>
    </Fragment>
  )
}

export default CustomFieldSortableRow
