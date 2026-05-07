'use client'

import { Button, InputPlaceholder, Modal, PlatformsSummary } from '@/components/ui'
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
      ? `${props.deviceData.soc.manufacturer} ${props.deviceData.soc.name}`
      : 'Not specified'

  const supportedPlatforms = props.deviceData.platforms.map((dp) => dp.platform)

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

        <PlatformsSummary
          platforms={supportedPlatforms}
          defaultPlatform={props.deviceData.defaultPlatform ?? null}
        />

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DeviceViewModal
