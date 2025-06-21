import { Trash2 } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function DeleteButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Trash2} color="red" />
}
