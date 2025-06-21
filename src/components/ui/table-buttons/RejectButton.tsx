import { XCircle } from 'lucide-react'
import TableButton, { type TableButtonWrapperProps } from './TableButton'

function RejectButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={XCircle} color="red" />
}

export default RejectButton
