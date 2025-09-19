import { RefreshCcwDot } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function RefreshButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={RefreshCcwDot} color="yellow" />
}
