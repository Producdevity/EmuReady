import { Undo } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function UndoButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Undo} color="orange" />
}
