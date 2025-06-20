import { Pencil } from 'lucide-react'
import TableButton, { type TableButtonWrapperProps } from './TableButton'

function EditButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Pencil} color="gray" />
}

export default EditButton
