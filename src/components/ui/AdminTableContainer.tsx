import { type ReactNode } from 'react'

interface AdminTableContainerProps {
  children: ReactNode
  className?: string
}

function AdminTableContainer(props: AdminTableContainerProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 ${props.className ?? ''}`}
    >
      <div className="overflow-x-auto">{props.children}</div>
    </div>
  )
}

export default AdminTableContainer
