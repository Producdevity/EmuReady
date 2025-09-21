'use client'

import { Copy, Check, FileJson } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import { solarizedDarkAtom, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button, Modal } from '@/components/ui'
import { copyToClipboard } from '@/utils/copyToClipboard'
import { parseCustomFieldOptions } from '@/utils/custom-fields'
import { CustomFieldType, type CustomFieldDefinition } from '@orm'

// Register the JSON language once in this module
SyntaxHighlighter.registerLanguage('json', jsonLang)

interface Props {
  isOpen: boolean
  onClose: () => void
  emulator: { id: string; name: string }
  customFields: CustomFieldDefinition[]
}

function valueTypeFor(fieldType: CustomFieldType): 'string' | 'boolean' | 'number' {
  switch (fieldType) {
    case CustomFieldType.BOOLEAN:
      return 'boolean'
    case CustomFieldType.RANGE:
      return 'number'
    default:
      return 'string'
  }
}

export default function CustomFieldsJsonModal(props: Props) {
  const { resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const exportObject = useMemo(() => {
    const fields = (props.customFields ?? [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type, // enum value (string) for readability
        valueType: valueTypeFor(f.type),
        required: !!f.isRequired,
        defaultValue: f.defaultValue ?? null,
        placeholder: f.placeholder ?? undefined,
        options: parseCustomFieldOptions(f),
        range:
          f.type === CustomFieldType.RANGE
            ? {
                min: f.rangeMin ?? 0,
                max: f.rangeMax ?? 100,
                unit: f.rangeUnit ?? undefined,
                decimals: f.rangeDecimals ?? 0,
              }
            : undefined,
        displayOrder: f.displayOrder ?? 0,
      }))

    return {
      emulator: {
        id: props.emulator.id,
        name: props.emulator.name,
      },
      fields,
      notes:
        'valueType indicates the expected JSON type for values when building converters from customFieldValues.',
    }
  }, [props.customFields, props.emulator.id, props.emulator.name])

  const jsonString = useMemo(() => JSON.stringify(exportObject, null, 2), [exportObject])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      copyToClipboard(jsonString, 'custom fields JSON')
    }
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Custom Fields JSON" size="2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>
              Emulator: <span className="font-medium">{props.emulator.name}</span>
            </div>
            <div className="mt-1">Fields: {props.customFields?.length ?? 0}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FileJson className="w-4 h-4" /> custom-fields.json
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <SyntaxHighlighter
              language="json"
              style={resolvedTheme === 'dark' ? solarizedDarkAtom : solarizedlight}
              customStyle={{ margin: 0, padding: '1rem' }}
            >
              {jsonString}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </Modal>
  )
}
