import { Settings } from 'lucide-react'
import { TableButton, type TableButtonWrapperProps } from './TableButton'

export function SettingsButton(props: TableButtonWrapperProps) {
  return <TableButton {...props} icon={Settings} color="indigo" />
}
