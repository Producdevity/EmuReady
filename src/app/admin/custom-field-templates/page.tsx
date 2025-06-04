'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button, LoadingSpinner } from '@/components/ui'
import { PlusCircle } from 'lucide-react'
import CustomFieldTemplateList from './components/CustomFieldTemplateList'
import CustomFieldTemplateFormModal from './components/CustomFieldTemplateFormModal'

function CustomFieldTemplatesPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const {
    data: templates,
    isLoading,
    error,
    refetch,
  } = api.customFieldTemplates.getAll.useQuery()

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

  if (isLoading) {
    return <LoadingSpinner text="Loading templates..." />
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading templates: {error.message}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Custom Field Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create reusable templates for custom fields that can be applied to multiple emulators
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <CustomFieldTemplateList
          templates={templates}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={refetch}
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
    </div>
  )
}

export default CustomFieldTemplatesPage 