import { Search } from 'lucide-react'
import { type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'

interface Props {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
  onClear?: () => void
  className?: string
}

function AdminSearchFilters(props: Props) {
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
              value={props.searchValue}
              onChange={(e) => props.onSearchChange(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        {props.children && (
          <div className="flex gap-2 items-center">{props.children}</div>
        )}
        {props.onClear && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-full"
              onClick={props.onClear}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSearchFilters
