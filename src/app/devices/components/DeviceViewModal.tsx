'use client'

import Link from 'next/link'
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

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Device Details" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.deviceData.brand.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.deviceData.modelName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System on Chip (SoC)
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.deviceData.soc ? (
                <div>
                  <div className="font-medium">{props.deviceData.soc.name}</div>
                  {props.deviceData.soc.manufacturer && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Manufacturer: {props.deviceData.soc.manufacturer}
                    </div>
                  )}
                  {props.deviceData.soc.architecture && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Architecture: {props.deviceData.soc.architecture}
                    </div>
                  )}
                  {props.deviceData.soc.processNode && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Process: {props.deviceData.soc.processNode}
                    </div>
                  )}
                </div>
              ) : (
                'Not specified'
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compatibility Reports
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.deviceData._count?.listings ?? 0} compatibility report
              {(props.deviceData._count?.listings ?? 0) !== 1 ? 's' : ''}
              {(props.deviceData._count?.listings ?? 0) > 0 && (
                <div className="mt-2">
                  <Link
                    href={`/listings?deviceIds=${props.deviceData.id}`}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    onClick={props.onClose}
                  >
                    View Reports
                  </Link>
                </div>
              )}
            </div>
          </div>
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
