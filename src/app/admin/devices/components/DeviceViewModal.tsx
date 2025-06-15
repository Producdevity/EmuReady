'use client'

import { Modal } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type DeviceData = RouterOutput['devices']['get']['devices'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  deviceData: DeviceData | null
}

function DeviceViewModal(props: Props) {
  if (!props.deviceData) return null

  const { deviceData } = props

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Device Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device ID
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md font-mono">
              {deviceData.id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {deviceData.brand.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {deviceData.modelName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System on Chip (SoC)
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {deviceData.soc?.name || 'Not specified'}
            </div>
          </div>

          {deviceData._count && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Listings
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {deviceData._count.listings} listing
                {deviceData._count.listings !== 1 ? 's' : ''}
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

export default DeviceViewModal
