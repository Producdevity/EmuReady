'use client'

import { Button, Modal, InputPlaceholder } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type GpuData = RouterOutput['gpus']['get']['gpus'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  gpuData: GpuData | null
}

function GpuViewModal(props: Props) {
  if (!props.gpuData) return null

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="GPU Details" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="GPU ID" value={props.gpuData.id} mono />
          <InputPlaceholder label="Brand" value={props.gpuData.brand.name} />
          <InputPlaceholder label="Model Name" value={props.gpuData.modelName} />

          {props.gpuData._count && (
            <InputPlaceholder
              label="Total PC Listings"
              value={`${props.gpuData._count.pcListings} PC listing${props.gpuData._count.pcListings !== 1 ? 's' : ''}`}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default GpuViewModal
