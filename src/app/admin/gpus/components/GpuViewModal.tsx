'use client'

import { Modal } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type GpuData = RouterOutput['gpus']['get']['gpus'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  gpuData: GpuData | null
}

function GpuViewModal(props: Props) {
  if (!props.gpuData) return null

  const { gpuData } = props

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="GPU Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GPU ID
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md font-mono">
              {gpuData.id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {gpuData.brand.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {gpuData.modelName}
            </div>
          </div>

          {gpuData._count && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total PC Listings
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {gpuData._count.pcListings} PC listing
                {gpuData._count.pcListings !== 1 ? 's' : ''}
              </div>
            </div>
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

export default GpuViewModal
