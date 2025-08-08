'use client'

import { Modal, InputPlaceholder } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type SocData = RouterOutput['socs']['get']['socs'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  socData: SocData | null
}

function SocViewModal(props: Props) {
  if (!props.socData) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="SoC Details"
      closeOnBackdropClick={false}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="SoC ID" value={props.socData.id} mono />

          <div className="grid grid-cols-2 gap-4">
            <InputPlaceholder label="Name" value={props.socData.name} />
            <InputPlaceholder
              label="Manufacturer"
              value={props.socData.manufacturer}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputPlaceholder
              label="Architecture"
              value={props.socData.architecture || 'Not specified'}
            />
            <InputPlaceholder
              label="Process Node"
              value={props.socData.processNode || 'Not specified'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputPlaceholder
              label="CPU Cores"
              value={props.socData.cpuCores?.toString() || 'Not specified'}
            />
            <InputPlaceholder
              label="GPU Model"
              value={props.socData.gpuModel || 'Not specified'}
            />
          </div>

          {props.socData._count && (
            <InputPlaceholder
              label="Devices Using This SoC"
              value={`${props.socData._count.devices} device${props.socData._count.devices !== 1 ? 's' : ''}`}
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

export default SocViewModal
