import { User } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function ViewUserButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={User} color="purple" />
}
