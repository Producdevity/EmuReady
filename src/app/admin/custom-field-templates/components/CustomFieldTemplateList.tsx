'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button, Card } from '@/components/ui'
import { Edit, Trash2, Eye } from 'lucide-react'
import { CustomFieldType } from '@orm'
import type { JsonValue } from '@prisma/client/runtime/library'

interface CustomFieldTemplateWithFields {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  fields: {
    id: string
    name: string
    label: string
    type: CustomFieldType
    options: JsonValue
    isRequired: boolean
    displayOrder: number
  }[]
}

interface Props {
  templates: CustomFieldTemplateWithFields[]
  onEdit: (templateId: string) => void
  onDeleteSuccess: () => void
}

function CustomFieldTemplateList(props: Props) {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  
  const deleteTemplateMutation = api.customFieldTemplates.delete.useMutation({
    onSuccess: () => {
      props.onDeleteSuccess()
    },
    onError: (error) => {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template. Please try again.')
    },
  })

  function handleDelete(templateId: string, templateName: string) {
    const confirmed = confirm(
      `Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`
    )
    if (confirmed) {
      deleteTemplateMutation.mutate({ id: templateId })
    }
  }

  function toggleExpanded(templateId: string) {
    const newExpanded = new Set(expandedTemplates)
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId)
    } else {
      newExpanded.add(templateId)
    }
    setExpandedTemplates(newExpanded)
  }

  function getFieldTypeDisplayName(type: CustomFieldType) {
    const typeMap: Record<CustomFieldType, string> = {
      [CustomFieldType.TEXT]: 'Text',
      [CustomFieldType.TEXTAREA]: 'Long Text',
      [CustomFieldType.URL]: 'URL',
      [CustomFieldType.BOOLEAN]: 'Yes/No',
      [CustomFieldType.SELECT]: 'Dropdown',
    }
    return typeMap[type] || type
  }

  function getOptionsDisplay(options: JsonValue): string {
    if (!options || !Array.isArray(options)) return ''
    return options
      .filter((opt): opt is { label: string } => 
        typeof opt === 'object' && opt !== null && 'label' in opt
      )
      .map((opt) => opt.label)
      .join(', ')
  }

  return (
    <div className="space-y-4">
      {props.templates.map((template) => (
        <Card key={template.id} className="w-full">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                  {' • '}
                  Created {template.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(template.id)}
                >
                  <Eye className="h-4 w-4" />
                  {expandedTemplates.has(template.id) ? 'Hide' : 'Show'} Fields
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.onEdit(template.id)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.name)}
                  disabled={deleteTemplateMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
          
          {expandedTemplates.has(template.id) && (
            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  Template Fields:
                </h4>
                {template.fields.length > 0 ? (
                  <div className="grid gap-3">
                    {template.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{field.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {field.name} • {getFieldTypeDisplayName(field.type)}
                            {field.isRequired && ' • Required'}
                          </div>
                          {field.type === CustomFieldType.SELECT && field.options && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Options: {getOptionsDisplay(field.options)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No fields defined for this template.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export default CustomFieldTemplateList 