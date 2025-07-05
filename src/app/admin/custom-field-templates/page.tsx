'use client'

import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import {
  AdminPageLayout,
  // AdminSearchFilters,
  AdminStatsDisplay,
} from '@/components/admin'
import { Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import CustomFieldTemplateFormModal from './components/CustomFieldTemplateFormModal'
import CustomFieldTemplateList from './components/CustomFieldTemplateList'

function CustomFieldTemplatesPage() {
  const [searchQuery, _setSearchQuery] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  )

  const customFieldTemplatesQuery = api.customFieldTemplates.getAll.useQuery()

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
          <Button
            onClick={() => customFieldTemplatesQuery.refetch()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const templates = customFieldTemplatesQuery.data ?? []
  const totalTemplates = templates.length
  const templatesWithFields = templates.filter(
    (t) => t.fields.length > 0,
  ).length
  const templatesWithoutFields = totalTemplates - templatesWithFields

  return (
    <AdminPageLayout
      title="Custom Field Templates"
      description="Create reusable templates for custom fields that can be applied to multiple emulators"
      headerActions={
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Template
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

      {/*TODO: fix this, AdminSearchFilters requires a table property, we need to convert this component to work like the other admin pages*/}
      {/*<AdminSearchFilters*/}
      {/*  searchValue={searchQuery}*/}
      {/*  onSearchChange={setSearchQuery}*/}
      {/*  searchPlaceholder="Search templates..."*/}
      {/*  onClear={() => setSearchQuery('')}*/}
      {/*/>*/}

      {templates.length > 0 ? (
        <CustomFieldTemplateList
          templates={templates.filter((template) =>
            template.name
              .toLowerCase()
              .includes(searchQuery.trim().toLowerCase()),
          )}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={customFieldTemplatesQuery.refetch}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No custom field templates created yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Create your first template to get started.
          </p>
          <Button onClick={handleOpenCreateModal} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Template
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
