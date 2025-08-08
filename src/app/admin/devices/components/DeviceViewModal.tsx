'use client'

import { Modal, InputPlaceholder } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'
import { formatCountLabel } from '@/utils/text'

type DeviceData = RouterOutput['devices']['get']['devices'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  deviceData: DeviceData | null
}

function DeviceViewModal(props: Props) {
  if (!props.deviceData) return null

  const deviceSoc =
    props.deviceData.soc?.manufacturer && props.deviceData.soc?.name
      ? `${props.deviceData.soc?.manufacturer} ${props.deviceData.soc?.name}`
      : 'Not specified'

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Device Details" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="Device ID" value={props.deviceData.id} mono />
          <InputPlaceholder label="Brand" value={props.deviceData.brand.name} />
          <InputPlaceholder label="Model Name" value={props.deviceData.modelName} />
          <InputPlaceholder label="System on Chip (SoC)" value={deviceSoc} />

          {props.deviceData._count && (
            <InputPlaceholder
              label="Total Listings"
              value={formatCountLabel('listing', props.deviceData._count.listings)}
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

export default DeviceViewModal
