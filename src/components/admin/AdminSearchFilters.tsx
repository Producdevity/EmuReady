import { Search } from 'lucide-react'
import { type PropsWithChildren } from 'react'
import { type UseAdminTableReturn } from '@/app/admin/hooks/useAdminTable'
import { ClearButton, Input } from '@/components/ui'

interface Props<TSortField extends string> extends PropsWithChildren {
  searchPlaceholder?: string
  onClear?: () => void
  className?: string
  table: UseAdminTableReturn<TSortField>
}

export function AdminSearchFilters<TSortField extends string>(props: Props<TSortField>) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4 ${props.className || ''}`}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder={props.searchPlaceholder || 'Search...'}
              value={props.table.search}
              onChange={(ev) => props.table.setSearch(ev.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        {props.children && <div className="flex gap-2 items-center">{props.children}</div>}
        <div className="flex items-center gap-2">
          <ClearButton
            title="Clear Search"
            onClick={() => {
              props.table.setSearch('')
              props.table.setPage(1)
              props.onClear?.()
            }}
          />
        </div>
      </div>
    </div>
  )
}
