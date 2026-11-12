'use client'

import { Copy, Download, FileJson, Save } from 'lucide-react'
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
  const [sourceId, setSourceId] = useState('')
  const [isLoadingSource, setIsLoadingSource] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState('')
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const sources = api.customFieldConfigs.sources.useQuery()
  const apply = api.customFieldConfigs.save.useMutation()
  const parsed = parseConfigJson(json)
  const hasChanges = parsed.success
    ? JSON.stringify(parsed.data) !== JSON.stringify(baseline.configuration)
    : json !== JSON.stringify(baseline.configuration, null, 2)
  const busy = apply.isPending || isLoadingSource || isConfirming

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

  async function loadSource() {
    if (!sourceId || busy) return
    if (
      hasChanges &&
      !(await ask({
        title: 'Replace the JSON draft?',
        description:
          'Your unsaved draft will be replaced with the selected emulator’s configuration. No configuration is saved yet.',
        confirmText: 'Load configuration',
      }))
    )
      return
    setIsLoadingSource(true)
    setError('')
    try {
      const source = await utils.customFieldConfigs.get.fetch({ emulatorId: sourceId })
      setJson(JSON.stringify(source.configuration, null, 2))
    } catch (error) {
      setError(getErrorMessage(error, 'Could not load the source configuration.'))
    } finally {
      setIsLoadingSource(false)
    }
  }

  async function save() {
    if (!parsed.success || !hasChanges || busy) return
    const approved = await ask({
      title: `Apply configuration to ${props.emulator.name}?`,
      description:
        'Matching field and category names will be updated. New names will be added. Omitted items and existing report values will be kept.',
      details: [
        { label: 'Categories', value: String(parsed.data.categories.length) },
        { label: 'Fields', value: String(parsed.data.fields.length) },
      ],
      confirmText: 'Apply configuration',
    })
    if (!approved) return
    setError('')
    try {
      const saved = await apply.mutateAsync({
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
          Copy fields and categories from another emulator, or edit the JSON directly. Names
          identify matching items. Omitted items and report values are kept. Use the field and
          category controls to delete items.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label htmlFor="config-source" className="block text-sm font-medium mb-1">
              Copy from emulator
            </label>
            <Input
              as="select"
              id="config-source"
              value={sourceId}
              disabled={busy || sources.isPending || sources.isError}
              onChange={(event) => setSourceId(event.target.value)}
            >
              <option value="">Select an emulator</option>
              {sources.data
                ?.filter((source) => source.id !== props.emulator.id)
                .map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
            </Input>
          </div>
          <Button
            variant="outline"
            icon={Download}
            disabled={!sourceId || busy}
            isLoading={isLoadingSource}
            onClick={loadSource}
          >
            Load into editor
          </Button>
        </div>
        {sources.isError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Could not load emulator choices. You can still paste JSON.
          </p>
        )}
        <div>
          <label htmlFor="custom-field-config-json" className="block text-sm font-medium mb-1">
            Configuration JSON
          </label>
          <Input
            as="textarea"
            id="custom-field-config-json"
            value={json}
            rows={18}
            maxLength={1_000_000}
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
            isLoading={apply.isPending}
            onClick={save}
          >
            Apply to {props.emulator.name}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
