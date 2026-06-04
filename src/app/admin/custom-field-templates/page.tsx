'use client'

import { PlusCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import { AdminPageLayout, AdminSearchFilters, AdminStatsDisplay } from '@/components/admin'
import { Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import CustomFieldTemplateFormModal from './components/CustomFieldTemplateFormModal'
import CustomFieldTemplateList from './components/CustomFieldTemplateList'

type CustomFieldTemplate = RouterOutput['customFieldTemplates']['get'][number]
type CustomFieldTemplateSortField = 'name'

const EMPTY_TEMPLATES: CustomFieldTemplate[] = []

function customFieldTemplateMatchesSearch(template: CustomFieldTemplate, searchTerm: string) {
  if (!searchTerm) return true

  const searchableValues = [
    template.name,
    template.description ?? '',
    ...template.fields.flatMap((field) => [field.name, field.label]),
  ]

  return searchableValues.some((value) => value.toLowerCase().includes(searchTerm))
}

function CustomFieldTemplatesPage() {
  const table = useAdminTable<CustomFieldTemplateSortField>()
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const customFieldTemplatesQuery = api.customFieldTemplates.get.useQuery()
  const templates = customFieldTemplatesQuery.data ?? EMPTY_TEMPLATES
  const totalTemplates = templates.length
  const templatesWithFields = templates.filter((t) => t.fields.length > 0).length
  const templatesWithoutFields = totalTemplates - templatesWithFields
  const searchTerm = table.search.trim().toLowerCase()
  const filteredTemplates = useMemo(
    () => templates.filter((template) => customFieldTemplateMatchesSearch(template, searchTerm)),
    [templates, searchTerm],
  )
  const hasActiveSearch = searchTerm.length > 0

  function handleOpenCreateModal() {
    setEditingTemplateId(null)
    setIsFormModalOpen(true)
  }

  function handleOpenEditModal(templateId: string) {
    setEditingTemplateId(templateId)
    setIsFormModalOpen(true)
  }

  function handleCloseModal() {
    setIsFormModalOpen(false)
    setEditingTemplateId(null)
  }

  if (customFieldTemplatesQuery.isPending) {
    return <LoadingSpinner text="Loading templates..." />
  }

  if (customFieldTemplatesQuery.error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading templates: {customFieldTemplatesQuery.error.message}
          </p>
          <Button onClick={() => customFieldTemplatesQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Custom Field Templates"
      description="Create reusable templates for custom fields that can be applied to multiple emulators"
      headerActions={
        <Button icon={PlusCircle} onClick={handleOpenCreateModal}>
          Create Template
        </Button>
      }
    >
      <AdminStatsDisplay
        stats={[
          { label: 'Total Templates', value: totalTemplates, color: 'blue' },
          { label: 'With Fields', value: templatesWithFields, color: 'green' },
          {
            label: 'Empty Templates',
            value: templatesWithoutFields,
            color: 'gray',
          },
        ]}
        isLoading={customFieldTemplatesQuery.isPending}
      />

      <AdminSearchFilters<CustomFieldTemplateSortField>
        table={table}
        searchPlaceholder="Search templates..."
      />

      {filteredTemplates.length > 0 ? (
        <CustomFieldTemplateList
          templates={filteredTemplates}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={customFieldTemplatesQuery.refetch}
        />
      ) : hasActiveSearch ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No custom field templates match your search.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Try a different template name, description, or field label.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No custom field templates created yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Create your first template to get started.
          </p>
          <Button icon={PlusCircle} onClick={handleOpenCreateModal} className="mt-4">
            Create Your First Template
          </Button>
        </div>
      )}

      <CustomFieldTemplateFormModal
        templateIdToEdit={editingTemplateId}
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
      />
    </AdminPageLayout>
  )
}

export default CustomFieldTemplatesPage
