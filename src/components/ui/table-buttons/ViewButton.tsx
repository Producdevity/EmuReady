import { Eye } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function ViewButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Eye} color="purple" />
}
