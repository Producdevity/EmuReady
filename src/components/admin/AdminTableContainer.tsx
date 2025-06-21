import { type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  className?: string
}

export function AdminTableContainer(props: Props) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        props.className,
      )}
    >
      <div className="overflow-x-auto">
        <div className="[&>table]:rounded-none [&>table>thead>tr:first-child>th:first-child]:rounded-tl-lg [&>table>thead>tr:first-child>th:last-child]:rounded-tr-lg [&>table>tbody>tr:last-child>td:first-child]:rounded-bl-lg [&>table>tbody>tr:last-child>td:last-child]:rounded-br-lg [&>table>tbody>tr:last-child:hover>td:first-child]:rounded-bl-lg [&>table>tbody>tr:last-child:hover>td:last-child]:rounded-br-lg">
          {props.children}
        </div>
      </div>
    </div>
  )
}
