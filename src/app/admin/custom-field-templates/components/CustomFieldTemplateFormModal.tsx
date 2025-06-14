'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useState, useEffect, type FormEvent } from 'react'
import { toSnakeCase } from 'remeda'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { CustomFieldType } from '@orm'

interface TemplateField {
  name: string
  label: string
  type: CustomFieldType
  options: { value: string; label: string }[]
  defaultValue?: string | boolean | null
  isRequired: boolean
  displayOrder: number
}

interface Props {
  templateIdToEdit?: string | null
  isOpen: boolean
  onClose: () => void
}

const FIELD_TYPES = [
  { value: CustomFieldType.TEXT, label: 'Text' },
  { value: CustomFieldType.TEXTAREA, label: 'Long Text' },
  { value: CustomFieldType.URL, label: 'URL' },
  { value: CustomFieldType.BOOLEAN, label: 'Yes/No' },
  { value: CustomFieldType.SELECT, label: 'Dropdown' },
]

function CustomFieldTemplateFormModal(props: Props) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const customFieldTemplateQuery = api.customFieldTemplates.getById.useQuery(
    { id: props.templateIdToEdit! },
    { enabled: !!props.templateIdToEdit },
  )

  const utils = api.useUtils()

  const createMutation = api.customFieldTemplates.create.useMutation({
    onSuccess: () => {
      utils.customFieldTemplates.getAll.invalidate().catch(console.error)
      utils.customFieldTemplates.getById
        .invalidate({ id: props.templateIdToEdit! })
        .catch(console.error)
      resetForm()
      props.onClose()
    },
    onError: (error) => {
      setErrors({ general: error.message })
      setIsSubmitting(false)
    },
  })

  const updateMutation = api.customFieldTemplates.update.useMutation({
    onSuccess: () => {
      utils.customFieldTemplates.getAll.invalidate().catch(console.error)
      utils.customFieldTemplates.getById
        .invalidate({ id: props.templateIdToEdit! })
        .catch(console.error)
      resetForm()
      props.onClose()
    },
    onError: (error) => {
      setErrors({ general: error.message })
      setIsSubmitting(false)
    },
  })

  function resetForm() {
    setTemplateName('')
    setTemplateDescription('')
    setFields([])
    setErrors({})
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (props.isOpen && !props.templateIdToEdit) {
      resetForm()
    }
  }, [props.isOpen, props.templateIdToEdit])

  useEffect(() => {
    if (!customFieldTemplateQuery.data) return setErrors({})
    setTemplateName(customFieldTemplateQuery.data.name)
    setTemplateDescription(customFieldTemplateQuery.data.description ?? '')
    setFields(
      customFieldTemplateQuery.data.fields.map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        options: (field.options as { value: string; label: string }[]) || [],
        defaultValue: field.defaultValue as string | boolean | null | undefined,
        isRequired: field.isRequired,
        displayOrder: field.displayOrder,
      })),
    )
    setErrors({})
  }, [customFieldTemplateQuery.data])

  function validateForm() {
    const newErrors: { [key: string]: string } = {}

    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required'
    } else if (templateName.length > 100) {
      newErrors.templateName = 'Template name must be 100 characters or less'
    }

    if (templateDescription.length > 500) {
      newErrors.templateDescription =
        'Description must be 500 characters or less'
    }

    if (fields.length === 0) {
      newErrors.fields = 'At least one field is required'
    } else if (fields.length > 50) {
      newErrors.fields = 'Maximum 50 fields allowed per template'
    }

    const fieldNames = new Set<string>()
    fields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field-${index}-name`] = 'Field name is required'
      } else if (field.name.length > 50) {
        newErrors[`field-${index}-name`] =
          'Field name must be 50 characters or less'
      } else if (!/^[a-z0-9_]+$/.test(field.name)) {
        newErrors[`field-${index}-name`] =
          'Field name must be lowercase alphanumeric with underscores only'
      } else if (fieldNames.has(field.name)) {
        newErrors[`field-${index}-name`] = 'Field names must be unique'
      } else {
        fieldNames.add(field.name)
      }

      if (!field.label.trim()) {
        newErrors[`field-${index}-label`] = 'Field label is required'
      } else if (field.label.length > 100) {
        newErrors[`field-${index}-label`] =
          'Field label must be 100 characters or less'
      }

      if (field.type === CustomFieldType.SELECT) {
        if (field.options.length === 0) {
          newErrors[`field-${index}-options`] =
            'Dropdown fields must have at least one option'
        } else if (field.options.length > 50) {
          newErrors[`field-${index}-options`] = 'Maximum 50 options allowed'
        } else {
          field.options.forEach((option, optionIndex) => {
            if (!option.value.trim()) {
              newErrors[`field-${index}-option-${optionIndex}-value`] =
                'Option value is required'
            } else if (option.value.length > 50) {
              newErrors[`field-${index}-option-${optionIndex}-value`] =
                'Option value must be 50 characters or less'
            }
            if (!option.label.trim()) {
              newErrors[`field-${index}-option-${optionIndex}-label`] =
                'Option label is required'
            } else if (option.label.length > 100) {
              newErrors[`field-${index}-option-${optionIndex}-label`] =
                'Option label must be 100 characters or less'
            }
          })
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault()

    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    const templateData = {
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      fields: fields.map((field, index) => ({
        name: field.name.trim().toLowerCase(),
        label: field.label.trim(),
        type: field.type,
        options:
          field.type === CustomFieldType.SELECT
            ? field.options.filter(
                (opt) => opt.value.trim() && opt.label.trim(),
              )
            : undefined,
        defaultValue: field.defaultValue || undefined,
        isRequired: field.isRequired,
        displayOrder: index,
      })),
    }

    if (props.templateIdToEdit) {
      updateMutation.mutate({
        id: props.templateIdToEdit,
        ...templateData,
      })
    } else {
      createMutation.mutate(templateData)
    }
  }

  function addField() {
    if (fields.length >= 50) {
      setErrors({ fields: 'Maximum 50 fields allowed per template' })
      return
    }

    setFields([
      ...fields,
      {
        name: '',
        label: '',
        type: CustomFieldType.TEXT,
        options: [],
        defaultValue: null,
        isRequired: false,
        displayOrder: fields.length,
      },
    ])
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`field-${index}-`)) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
  }

  function updateField(index: number, updates: Partial<TemplateField>) {
    setFields(
      fields.map((field, i) =>
        i === index
          ? {
              ...field,
              ...updates,
              options:
                updates.type === CustomFieldType.SELECT
                  ? (updates.options ?? field.options)
                  : updates.type
                    ? []
                    : (updates.options ?? field.options),
            }
          : field,
      ),
    )

    if (updates.type && updates.type !== CustomFieldType.SELECT) {
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`field-${index}-option`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  function addOptionToField(fieldIndex: number) {
    const field = fields[fieldIndex]
    if (field && field.options.length < 50) {
      updateField(fieldIndex, {
        options: [...field.options, { value: '', label: '' }],
      })
    }
  }

  function removeOptionFromField(fieldIndex: number, optionIndex: number) {
    const field = fields[fieldIndex]
    if (field) {
      updateField(fieldIndex, {
        options: field.options.filter((_, i) => i !== optionIndex),
      })

      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`field-${fieldIndex}-option-${optionIndex}-`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  function updateFieldOption(
    fieldIndex: number,
    optionIndex: number,
    updates: Partial<{ value: string; label: string }>,
  ) {
    const field = fields[fieldIndex]
    if (field) {
      updateField(fieldIndex, {
        options: field.options.map((option, i) =>
          i === optionIndex ? { ...option, ...updates } : option,
        ),
      })
    }
  }

  if (!props.isOpen) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.templateIdToEdit ? 'Edit Template' : 'Create Template'}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      size="3xl"
    >
      {customFieldTemplateQuery.isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div
              className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <div>
            <label
              htmlFor="templateName"
              className="block text-sm font-medium mb-2"
            >
              Template Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(ev) => setTemplateName(ev.target.value)}
              placeholder="e.g., X86 Emulator Fields"
              maxLength={100}
              className={
                errors.templateName ? 'border-red-300 dark:border-red-600' : ''
              }
              aria-invalid={!!errors.templateName}
              aria-describedby={
                errors.templateName ? 'templateName-error' : undefined
              }
            />
            {errors.templateName && (
              <p
                id="templateName-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {errors.templateName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="templateDescription"
              className="block text-sm font-medium mb-2"
            >
              Description (Optional)
            </label>
            <Input
              id="templateDescription"
              as="textarea"
              value={templateDescription}
              onChange={(ev) => setTemplateDescription(ev.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              maxLength={500}
              className={
                errors.templateDescription
                  ? 'border-red-300 dark:border-red-600'
                  : ''
              }
              aria-invalid={!!errors.templateDescription}
              aria-describedby={
                errors.templateDescription
                  ? 'templateDescription-error'
                  : undefined
              }
            />
            {errors.templateDescription && (
              <p
                id="templateDescription-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {errors.templateDescription}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Template Fields <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={addField}
                disabled={fields.length >= 50}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {errors.fields && (
              <div className="text-red-600 text-sm mb-4" role="alert">
                {errors.fields}
              </div>
            )}

            <div className="space-y-6">
              {fields.map((field, fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">
                        Field {fieldIndex + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeField(fieldIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Field Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={field.name}
                        onChange={(ev) =>
                          updateField(fieldIndex, { name: ev.target.value })
                        }
                        placeholder="e.g., driver_version"
                        maxLength={50}
                        className={
                          errors[`field-${fieldIndex}-name`]
                            ? 'border-red-300 dark:border-red-600'
                            : ''
                        }
                      />
                      {errors[`field-${fieldIndex}-name`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`field-${fieldIndex}-name`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Display Label <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={field.label}
                        onChange={(ev) => {
                          if (field.name.trim() === '') {
                            updateField(fieldIndex, {
                              name: toSnakeCase(ev.target.value),
                            })
                          }
                          updateField(fieldIndex, { label: ev.target.value })
                        }}
                        placeholder="e.g., Driver Version"
                        maxLength={100}
                        className={
                          errors[`field-${fieldIndex}-label`]
                            ? 'border-red-300 dark:border-red-600'
                            : ''
                        }
                      />
                      {errors[`field-${fieldIndex}-label`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`field-${fieldIndex}-label`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Field Type
                      </label>
                      <Input
                        as="select"
                        value={field.type}
                        onChange={(ev) =>
                          updateField(fieldIndex, {
                            type: ev.target.value as CustomFieldType,
                            defaultValue: null, // Reset default value when type changes
                          })
                        }
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Input>
                    </div>
                    <div className="flex items-center pt-8">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(ev) =>
                            updateField(fieldIndex, {
                              isRequired: ev.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        Required field
                      </label>
                    </div>
                  </div>

                  {/* Default Value Section */}
                  {(field.type === CustomFieldType.BOOLEAN ||
                    field.type === CustomFieldType.SELECT) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Default Value (Optional)
                      </label>
                      {field.type === CustomFieldType.BOOLEAN ? (
                        <Input
                          as="select"
                          value={
                            field.defaultValue === null
                              ? ''
                              : String(field.defaultValue)
                          }
                          onChange={(ev) =>
                            updateField(fieldIndex, {
                              defaultValue:
                                ev.target.value === ''
                                  ? null
                                  : ev.target.value === 'true',
                            })
                          }
                        >
                          <option value="">No default</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Input>
                      ) : field.type === CustomFieldType.SELECT &&
                        field.options.length > 0 ? (
                        <Input
                          as="select"
                          value={
                            field.defaultValue === null
                              ? ''
                              : String(field.defaultValue)
                          }
                          onChange={(ev) =>
                            updateField(fieldIndex, {
                              defaultValue:
                                ev.target.value === '' ? null : ev.target.value,
                            })
                          }
                        >
                          <option value="">No default</option>
                          {field.options
                            .filter(
                              (opt) => opt.value.trim() && opt.label.trim(),
                            )
                            .map((option, optIndex) => (
                              <option key={optIndex} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </Input>
                      ) : field.type === CustomFieldType.SELECT ? (
                        <p className="text-sm text-gray-500 italic">
                          Add options first to set a default value
                        </p>
                      ) : null}
                    </div>
                  )}

                  {field.type === CustomFieldType.SELECT && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOptionToField(fieldIndex)}
                          disabled={field.options.length >= 50}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>

                      {errors[`field-${fieldIndex}-options`] && (
                        <div className="text-red-600 text-sm mb-2">
                          {errors[`field-${fieldIndex}-options`]}
                        </div>
                      )}

                      <div className="space-y-2">
                        {field.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                value={option.value}
                                onChange={(ev) =>
                                  updateFieldOption(fieldIndex, optionIndex, {
                                    value: ev.target.value,
                                  })
                                }
                                placeholder="Value"
                                maxLength={50}
                                className={
                                  errors[
                                    `field-${fieldIndex}-option-${optionIndex}-value`
                                  ]
                                    ? 'border-red-300 dark:border-red-600'
                                    : ''
                                }
                              />
                              {errors[
                                `field-${fieldIndex}-option-${optionIndex}-value`
                              ] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors[
                                      `field-${fieldIndex}-option-${optionIndex}-value`
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex-1">
                              <Input
                                type="text"
                                value={option.label}
                                onChange={(ev) => {
                                  if (option.value.trim() === '') {
                                    updateFieldOption(fieldIndex, optionIndex, {
                                      value: toSnakeCase(ev.target.value),
                                    })
                                  }
                                  updateFieldOption(fieldIndex, optionIndex, {
                                    label: ev.target.value,
                                  })
                                }}
                                placeholder="Label"
                                maxLength={100}
                                className={
                                  errors[
                                    `field-${fieldIndex}-option-${optionIndex}-label`
                                  ]
                                    ? 'border-red-300 dark:border-red-600'
                                    : ''
                                }
                              />
                              {errors[
                                `field-${fieldIndex}-option-${optionIndex}-label`
                              ] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors[
                                      `field-${fieldIndex}-option-${optionIndex}-label`
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                removeOptionFromField(fieldIndex, optionIndex)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={props.onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || customFieldTemplateQuery.isLoading}
            >
              {isSubmitting
                ? 'Saving...'
                : props.templateIdToEdit
                  ? 'Update Template'
                  : 'Create Template'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default CustomFieldTemplateFormModal
