'use client'

import { PlusCircle, Copy, FileJson } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import { CustomFieldList } from '@/lib/dynamic-imports'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import ApplyTemplatesModal from './components/ApplyTemplatesModal'
import CustomFieldFormModal from './components/CustomFieldFormModal'
import CustomFieldsJsonModal from './components/CustomFieldsJsonModal'

export default function EmulatorCustomFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const emulatorId = params.emulatorId as string

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isApplyTemplatesModalOpen, setIsApplyTemplatesModalOpen] = useState(false)
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const userQuery = api.users.me.useQuery()
  const verifiedDeveloperQuery = api.emulators.getVerifiedDeveloper.useQuery(
    { emulatorId },
    { enabled: !!emulatorId && !!userQuery.data },
  )

  const emulatorQuery = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })

  const customFieldDefinitionsQuery = api.customFieldDefinitions.getByEmulator.useQuery(
    { emulatorId },
    { enabled: !!emulatorId },
  )

  // Redirect access using permission + verified for developers
  if (userQuery.data) {
    const perms = userQuery.data.permissions
    const isVerifiedDeveloper = Boolean(verifiedDeveloperQuery.data)
    const canManageCF = hasPermission(perms, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    if (!canManageCF) {
      router.replace('/admin/emulators')
      return null
    }
    const isAdminOrHigher = hasRolePermission(userQuery.data.role, Role.ADMIN)
    if (!isAdminOrHigher || isVerifiedDeveloper) {
      router.replace('/admin/emulators')
      return null
    }
  }

  // Check if user can see Apply Templates button (only SUPER_ADMIN)
  const canApplyTemplates = hasRolePermission(userQuery.data?.role, Role.SUPER_ADMIN)

  function handleOpenCreateModal() {
    setEditingFieldId(null)
    setIsFormModalOpen(true)
  }

  function handleOpenEditModal(fieldId: string) {
    setEditingFieldId(fieldId)
    setIsFormModalOpen(true)
  }

  function handleCloseModal() {
    setIsFormModalOpen(false)
    setEditingFieldId(null)
    void customFieldDefinitionsQuery.refetch()
  }

  if (emulatorQuery.isLoading || customFieldDefinitionsQuery.isLoading) {
    return <div>Loading...</div>
  }

  if (emulatorQuery.error) {
    return <div>Error loading emulator: {emulatorQuery.error.message}</div>
  }

  if (customFieldDefinitionsQuery.error) {
    return <div>Error loading custom fields: {customFieldDefinitionsQuery.error.message}</div>
  }

  if (!emulatorQuery.data) {
    return <div>Emulator not found.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Custom Fields for {emulatorQuery.data.name}</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setIsJsonModalOpen(true)}>
            <FileJson className="mr-2 h-4 w-4" /> View JSON
          </Button>
          {canApplyTemplates && (
            <Button variant="outline" onClick={() => setIsApplyTemplatesModalOpen(true)}>
              <Copy className="mr-2 h-4 w-4" /> Apply Templates
            </Button>
          )}
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field
          </Button>
        </div>
      </div>

      {customFieldDefinitionsQuery.data && customFieldDefinitionsQuery.data.length > 0 ? (
        <CustomFieldList
          customFields={customFieldDefinitionsQuery.data}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={customFieldDefinitionsQuery.refetch}
          emulatorId={emulatorId}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No custom fields defined for this emulator yet.
          </p>
          <div className="mt-4 flex justify-center space-x-3">
            {canApplyTemplates && (
              <Button variant="outline" onClick={() => setIsApplyTemplatesModalOpen(true)}>
                <Copy className="mr-2 h-4 w-4" /> Apply Templates
              </Button>
            )}
            <Button onClick={handleOpenCreateModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field
            </Button>
          </div>
        </div>
      )}

      {isFormModalOpen && (
        <CustomFieldFormModal
          emulatorId={emulatorId}
          fieldIdToEdit={editingFieldId}
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {isApplyTemplatesModalOpen && (
        <ApplyTemplatesModal
          emulatorId={emulatorId}
          isOpen={isApplyTemplatesModalOpen}
          onClose={() => setIsApplyTemplatesModalOpen(false)}
          onSuccess={() => customFieldDefinitionsQuery.refetch()}
        />
      )}

      {isJsonModalOpen && emulatorQuery.data && customFieldDefinitionsQuery.data && (
        <CustomFieldsJsonModal
          isOpen={isJsonModalOpen}
          onClose={() => setIsJsonModalOpen(false)}
          emulator={{ id: emulatorQuery.data.id, name: emulatorQuery.data.name }}
          customFields={customFieldDefinitionsQuery.data}
        />
      )}
    </div>
  )
}
