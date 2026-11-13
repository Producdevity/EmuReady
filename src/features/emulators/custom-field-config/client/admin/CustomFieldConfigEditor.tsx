'use client'

import { Copy, FileJson, Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Input, Modal, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { copyToClipboard } from '@/utils/copyToClipboard'
import getErrorMessage from '@/utils/getErrorMessage'
import { parseConfigJson, type CustomFieldConfigSnapshot } from '../../shared/config.schemas'

interface Props {
  emulator: { id: string; name: string }
  snapshot: CustomFieldConfigSnapshot
  onClose: () => void
  onSaved: () => void
}

export function CustomFieldConfigEditor(props: Props) {
  const [baseline, setBaseline] = useState(props.snapshot)
  const [json, setJson] = useState(() => JSON.stringify(props.snapshot.configuration, null, 2))
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState('')
  const confirm = useConfirmDialog()
  const saveConfig = api.customFieldConfigs.save.useMutation()
  const parsed = parseConfigJson(json)
  const hasChanges = parsed.success
    ? JSON.stringify(parsed.data) !== JSON.stringify(baseline.configuration)
    : json !== JSON.stringify(baseline.configuration, null, 2)
  const busy = saveConfig.isPending || isConfirming

  async function ask(options: Parameters<typeof confirm>[0]) {
    setIsConfirming(true)
    try {
      return await confirm(options)
    } finally {
      setIsConfirming(false)
    }
  }

  async function close() {
    if (busy) return
    if (
      hasChanges &&
      !(await ask({
        title: 'Discard the JSON draft?',
        description: 'Your unsaved configuration changes will be discarded.',
        confirmText: 'Discard draft',
      }))
    )
      return
    props.onClose()
  }

  async function save() {
    if (!parsed.success || !hasChanges || busy) return
    const approved = await ask({
      title: `Save JSON for ${props.emulator.name}?`,
      description:
        'The JSON replaces this emulator’s field and category setup. Omitted items will be removed. Fields used by reports cannot be removed or changed incompatibly.',
      details: [
        { label: 'Categories', value: String(parsed.data.categories.length) },
        { label: 'Fields', value: String(parsed.data.fields.length) },
      ],
      confirmText: 'Save JSON',
    })
    if (!approved) return
    setError('')
    try {
      const saved = await saveConfig.mutateAsync({
        emulatorId: props.emulator.id,
        configuration: parsed.data,
        expectedRevision: baseline.revision,
      })
      setBaseline(saved)
      setJson(JSON.stringify(saved.configuration, null, 2))
      toast.success('Custom field configuration saved')
      props.onSaved()
    } catch (error) {
      setError(getErrorMessage(error, 'Could not save the configuration.'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={close}
      title={`Custom field configuration: ${props.emulator.name}`}
      size="3xl"
      closeOnBackdropClick={false}
      closeOnEscape={!busy}
      hideCloseButton={busy}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paste a setup or edit the JSON to change fields, attributes, categories and ordering. Keep
          existing IDs when renaming items to preserve report values. Omitted items are removed;
          fields used by reports are protected.
        </p>
        <div>
          <label htmlFor="custom-field-config-json" className="block text-sm font-medium mb-1">
            Configuration JSON
          </label>
          <Input
            as="textarea"
            id="custom-field-config-json"
            value={json}
            rows={18}
            spellCheck={false}
            disabled={busy}
            aria-invalid={!parsed.success}
            aria-describedby={!parsed.success ? 'config-validation-error' : undefined}
            inputClassName="font-mono text-xs leading-5"
            onChange={(event) => {
              setJson(event.target.value)
              setError('')
            }}
          />
        </div>
        {!parsed.success && (
          <p
            id="config-validation-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap"
          >
            {parsed.error}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => copyToClipboard(json, 'configuration JSON')}
            >
              Copy JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileJson}
              disabled={!parsed.success || busy}
              onClick={() => {
                if (parsed.success) setJson(JSON.stringify(parsed.data, null, 2))
              }}
            >
              Format JSON
            </Button>
          </div>
          <Button
            icon={Save}
            disabled={!parsed.success || !hasChanges || busy}
            isLoading={saveConfig.isPending}
            onClick={save}
          >
            Save JSON
          </Button>
        </div>
      </div>
    </Modal>
  )
}
