'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CustomFieldType } from '@orm'

interface Props {
  emulatorId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ApplyTemplatesModal(props: Props) {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [applyResult, setApplyResult] = useState<{
    success: boolean
    message: string
    details?: {
      createdFields: number
      skippedFields: number
      templateNames: string[]
    }
  } | null>(null)

  const { data: templates, isLoading: isLoadingTemplates } =
    api.customFieldTemplates.getAll.useQuery()

  const applyTemplatesMutation =
    api.customFieldTemplates.applyToEmulator.useMutation({
      onSuccess: (result) => {
        setApplyResult({
          success: true,
          message: `Successfully applied ${result.createdFields} field${result.createdFields !== 1 ? 's' : ''} from ${result.templateNames.join(', ')}`,
          details: result,
        })
        if (result.createdFields > 0) {
          props.onSuccess()
        }
      },
      onError: (error) => {
        setApplyResult({
          success: false,
          message: error.message,
        })
      },
    })

  function handleTemplateToggle(templateId: string) {
    setSelectedTemplateIds((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    )
  }

  function handleApplyTemplates() {
    if (selectedTemplateIds.length === 0) return

    setApplyResult(null)
    applyTemplatesMutation.mutate({
      emulatorId: props.emulatorId,
      templateIds: selectedTemplateIds,
    })
  }

  function handleClose() {
    setSelectedTemplateIds([])
    setApplyResult(null)
    props.onClose()
  }

  function getFieldTypeDisplayName(type: CustomFieldType) {
    switch (type) {
      case CustomFieldType.TEXT:
        return 'Text'
      case CustomFieldType.TEXTAREA:
        return 'Long Text'
      case CustomFieldType.URL:
        return 'URL'
      case CustomFieldType.BOOLEAN:
        return 'Yes/No'
      case CustomFieldType.SELECT:
        return 'Dropdown'
      default:
        return type
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Apply Field Templates"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      size="lg"
    >
      <div className="space-y-6">
        {applyResult && (
          <div
            className={cn(
              'p-4 rounded-lg',
              applyResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
            )}
          >
            <p className="font-medium">{applyResult.message}</p>
            {applyResult.details && applyResult.details.skippedFields > 0 && (
              <p className="text-sm mt-2">
                {applyResult.details.skippedFields} field
                {applyResult.details.skippedFields !== 1 ? 's' : ''} skipped
                (already exist)
              </p>
            )}
          </div>
        )}

        {isLoadingTemplates ? (
          <div>Loading templates...</div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No custom field templates available.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Create templates first in the Custom Field Templates section.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-medium mb-4">
                Select Templates to Apply
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose one or more templates to add their fields to this
                emulator. Fields that already exist will be skipped.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-colors',
                    selectedTemplateIds.includes(template.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                  )}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedTemplateIds.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                          Fields ({template.fields.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.map((field) => (
                            <span
                              key={field.name}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {field.label}
                              <span className="ml-1 text-gray-500 dark:text-gray-400">
                                ({getFieldTypeDisplayName(field.type)})
                              </span>
                              {field.isRequired && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {applyResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!applyResult?.success && (
            <Button
              onClick={handleApplyTemplates}
              disabled={
                selectedTemplateIds.length === 0 ||
                applyTemplatesMutation.isPending
              }
            >
              Apply Selected Templates
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
