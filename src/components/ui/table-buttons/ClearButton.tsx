import { SearchX } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function ClearButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={SearchX} color="clear" />
}
