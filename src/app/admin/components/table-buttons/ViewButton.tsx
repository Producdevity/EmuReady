import { Eye } from 'lucide-react'
import TableButton, { type TableButtonWrapperProps } from './TableButton'

function ViewButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Eye} color="purple" />
}

export default ViewButton
