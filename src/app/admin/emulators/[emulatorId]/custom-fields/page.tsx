'use client'

import { PlusCircle, Copy } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import { CustomFieldList } from '@/lib/dynamic-imports'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission as hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import ApplyTemplatesModal from './components/ApplyTemplatesModal'
import CustomFieldFormModal from './components/CustomFieldFormModal'

export default function EmulatorCustomFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const emulatorId = params.emulatorId as string

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isApplyTemplatesModalOpen, setIsApplyTemplatesModalOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const { data: currentUser } = api.users.me.useQuery()
  const { data: verifiedDev } = api.emulators.getVerifiedDeveloper.useQuery(
    { emulatorId },
    { enabled: !!emulatorId && !!currentUser },
  )

  const {
    data: emulator,
    isLoading: isLoadingEmulator,
    error: emulatorError,
  } = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })

  const {
    data: customFields,
    isLoading: isLoadingCustomFields,
    error: customFieldsError,
    refetch: refetchCustomFields,
  } = api.customFieldDefinitions.getByEmulator.useQuery({ emulatorId }, { enabled: !!emulatorId })

  // Redirect access using permission + verified for developers
  if (currentUser) {
    const perms = currentUser.permissions
    const canManageCF = hasPermission(perms, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    if (!canManageCF) {
      router.replace('/admin/emulators')
      return null
    }
    const isAdminOrHigher = hasRolePermission(currentUser.role, Role.ADMIN)
    if (!isAdminOrHigher) {
      const isVerified = Boolean(verifiedDev)
      if (!isVerified) {
        router.replace('/admin/emulators')
        return null
      }
    }
  }

  // Check if user can see Apply Templates button (only SUPER_ADMIN)
  const canApplyTemplates = currentUser && hasRolePermission(currentUser.role, Role.SUPER_ADMIN)

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
    refetchCustomFields()
  }

  function handleOpenApplyTemplatesModal() {
    setIsApplyTemplatesModalOpen(true)
  }

  function handleCloseApplyTemplatesModal() {
    setIsApplyTemplatesModalOpen(false)
  }

  function handleTemplateApplySuccess() {
    refetchCustomFields()
  }

  if (isLoadingEmulator || isLoadingCustomFields) {
    return <div>Loading...</div>
  }

  if (emulatorError) {
    return <div>Error loading emulator: {emulatorError.message}</div>
  }

  if (customFieldsError) {
    return <div>Error loading custom fields: {customFieldsError.message}</div>
  }

  if (!emulator) {
    return <div>Emulator not found.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Custom Fields for {emulator.name}</h1>
        <div className="flex space-x-3">
          {canApplyTemplates && (
            <Button variant="outline" onClick={handleOpenApplyTemplatesModal}>
              <Copy className="mr-2 h-4 w-4" /> Apply Templates
            </Button>
          )}
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field
          </Button>
        </div>
      </div>

      {customFields && customFields.length > 0 ? (
        <CustomFieldList
          customFields={customFields}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={refetchCustomFields}
          emulatorId={emulatorId}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No custom fields defined for this emulator yet.
          </p>
          <div className="mt-4 flex justify-center space-x-3">
            {canApplyTemplates && (
              <Button variant="outline" onClick={handleOpenApplyTemplatesModal}>
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
          onClose={handleCloseApplyTemplatesModal}
          onSuccess={handleTemplateApplySuccess}
        />
      )}
    </div>
  )
}
