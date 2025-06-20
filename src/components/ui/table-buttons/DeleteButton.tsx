import { Trash2 } from 'lucide-react'
import TableButton, { type TableButtonWrapperProps } from './TableButton'

function DeleteButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Trash2} color="red" />
}

export default DeleteButton
