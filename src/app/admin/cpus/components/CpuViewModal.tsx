'use client'

import { Modal, InputPlaceholder } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type CpuData = RouterOutput['cpus']['get']['cpus'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  cpuData: CpuData | null
}

function CpuViewModal(props: Props) {
  if (!props.cpuData) return null

  const { cpuData } = props

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="CPU Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="CPU ID" value={cpuData.id} mono />
          <InputPlaceholder label="Brand" value={cpuData.brand.name} />
          <InputPlaceholder label="Model Name" value={cpuData.modelName} />

          {cpuData._count && (
            <InputPlaceholder
              label="Total PC Listings"
              value={`${cpuData._count.pcListings} PC listing${cpuData._count.pcListings !== 1 ? 's' : ''}`}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CpuViewModal
