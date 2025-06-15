'use client'

import { Modal } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type SocData = RouterOutput['socs']['get']['socs'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  socData: SocData | null
}

function SocViewModal(props: Props) {
  if (!props.socData) return null

  const { socData } = props

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="SoC Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SoC ID
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md font-mono">
              {socData.id}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.manufacturer}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Architecture
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.architecture || 'Not specified'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Process Node
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.processNode || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPU Cores
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.cpuCores || 'Not specified'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GPU Model
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData.gpuModel || 'Not specified'}
              </div>
            </div>
          </div>

          {socData._count && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Devices Using This SoC
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                {socData._count.devices} device
                {socData._count.devices !== 1 ? 's' : ''}
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

export default SocViewModal
