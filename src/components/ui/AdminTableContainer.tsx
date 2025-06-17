import { type ReactNode } from 'react'

interface AdminTableContainerProps {
  children: ReactNode
  className?: string
}

function AdminTableContainer(props: AdminTableContainerProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${props.className ?? ''}`}
    >
      <div className="overflow-x-auto">
        <div className="[&>table]:rounded-none [&>table>thead>tr:first-child>th:first-child]:rounded-tl-lg [&>table>thead>tr:first-child>th:last-child]:rounded-tr-lg [&>table>tbody>tr:last-child>td:first-child]:rounded-bl-lg [&>table>tbody>tr:last-child>td:last-child]:rounded-br-lg [&>table>tbody>tr:last-child:hover>td:first-child]:rounded-bl-lg [&>table>tbody>tr:last-child:hover>td:last-child]:rounded-br-lg">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default AdminTableContainer
