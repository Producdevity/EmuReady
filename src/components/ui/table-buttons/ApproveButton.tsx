import { CheckCircle } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function ApproveButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={CheckCircle} color="green" />
}
