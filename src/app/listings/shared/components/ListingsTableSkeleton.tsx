'use client'

import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  rowCount: number
  visibleColumns: string[]
  columnWidths?: Record<string, string>
}

const DEFAULT_COLUMN_WIDTHS: Record<string, string> = {
  game: 'w-32',
  system: 'w-20',
  device: 'w-28',
  emulator: 'w-24',
  performance: 'w-20',
  successRate: 'w-24',
  verified: 'w-24',
  author: 'w-24',
  posted: 'w-20',
  actions: 'w-16',
  cpu: 'w-28',
  gpu: 'w-28',
  memory: 'w-16',
  os: 'w-20',
}

export function ListingsTableSkeleton(props: Props) {
  const columnWidths = props.columnWidths ?? DEFAULT_COLUMN_WIDTHS

  return (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: props.rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {props.visibleColumns.map((column) => (
            <td key={column} className="px-4 py-3">
              {column === 'actions' ? (
                <div className="flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ) : column === 'performance' ? (
                <Skeleton className="h-6 w-20 rounded-full" />
              ) : column === 'successRate' || column === 'verified' ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-16 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ) : (
                <Skeleton className={`h-5 ${columnWidths[column] ?? 'w-24'}`} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
