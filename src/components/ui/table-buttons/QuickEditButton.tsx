import { TextCursorInput } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function QuickEditButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={TextCursorInput} color="blue" />
}
