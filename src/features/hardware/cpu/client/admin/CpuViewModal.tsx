'use client'

import { Button, InputPlaceholder, Modal } from '@/components/ui'
import type { CpuDetail } from '../../shared/cpu.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  cpuData: CpuDetail | null
}

export function CpuViewModal(props: Props) {
  if (!props.cpuData) return null

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="CPU Details" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <InputPlaceholder label="CPU ID" value={props.cpuData.id} mono />
          <InputPlaceholder label="Brand" value={props.cpuData.brand.name} />
          <InputPlaceholder label="Model Name" value={props.cpuData.modelName} />
          <InputPlaceholder
            label="Total PC Reports"
            value={`${props.cpuData.pcListingCount} PC report${props.cpuData.pcListingCount !== 1 ? 's' : ''}`}
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
