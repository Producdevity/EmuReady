'use client'

import { Button, InputPlaceholder, Modal } from '@/components/ui'
import type { GpuDetail } from '../../shared/gpu.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  gpuData: GpuDetail | null
}

export function GpuViewModal(props: Props) {
  if (!props.gpuData) return null

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="GPU Details" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="GPU ID" value={props.gpuData.id} mono />
          <InputPlaceholder label="Brand" value={props.gpuData.brand.name} />
          <InputPlaceholder label="Model Name" value={props.gpuData.modelName} />
          <InputPlaceholder
            label="Total PC Reports"
            value={`${props.gpuData.pcListingCount} PC report${props.gpuData.pcListingCount !== 1 ? 's' : ''}`}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
