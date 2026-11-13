'use client'

import { Button, LoadingSpinner, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { CustomFieldConfigEditor } from './CustomFieldConfigEditor'

interface Props {
  emulator: { id: string; name: string }
  onClose: () => void
  onSaved: () => void
}

export function CustomFieldConfigModal(props: Props) {
  const config = api.customFieldConfigs.get.useQuery(
    { emulatorId: props.emulator.id },
    {
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const isLoading = config.isPending || (!config.isFetchedAfterMount && !config.isError)

  if (!isLoading && config.data && !config.isError) {
    return (
      <CustomFieldConfigEditor
        key={props.emulator.id}
        emulator={props.emulator}
        snapshot={config.data}
        onSaved={props.onSaved}
        onClose={props.onClose}
      />
    )
  }

  return (
    <Modal
      isOpen
      onClose={props.onClose}
      title={`Custom field configuration: ${props.emulator.name}`}
      size="3xl"
      closeOnBackdropClick={false}
    >
      {isLoading ? (
        <LoadingSpinner text="Loading configuration..." />
      ) : config.isError ? (
        <div className="space-y-3">
          <p role="alert">Could not load the configuration. {config.error.message}</p>
          <Button variant="outline" onClick={() => config.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
    </Modal>
  )
}
