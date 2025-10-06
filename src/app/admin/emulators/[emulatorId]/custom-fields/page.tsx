'use client'

import { PlusCircle, Copy, FileJson, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import UnauthenticatedPage from '@/components/auth/UnauthenticatedPage'
import { Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import ApplyTemplatesModal from './components/ApplyTemplatesModal'
import CustomFieldFormModal from './components/CustomFieldFormModal'
import CustomFieldsDragAndDrop from './components/CustomFieldsDragAndDrop'
import CustomFieldsJsonModal from './components/CustomFieldsJsonModal'
import FeedbackCard from './components/FeedbackCard'

export default function EmulatorCustomFieldsPage() {
  const params = useParams()
  const emulatorId = params.emulatorId as string

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isApplyTemplatesModalOpen, setIsApplyTemplatesModalOpen] = useState(false)
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const userQuery = api.users.me.useQuery()
  const emulatorQuery = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })

  const customFieldDefinitionsQuery = api.customFieldDefinitions.getByEmulator.useQuery(
    { emulatorId },
    { enabled: !!emulatorId },
  )

  const categoriesQuery = api.customFieldCategories.getByEmulator.useQuery(
    { emulatorId },
    { enabled: !!emulatorId },
  )

  const user = userQuery.data
  const isLoading = userQuery.isPending && !userQuery.isError
  const isEmulatorLoading = emulatorQuery.isLoading
  const hasManagePermission = hasPermission(user?.permissions, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
  const isDeveloper = user?.role === Role.DEVELOPER
  const isVerifiedDeveloper = Boolean(
    emulatorQuery.data?.verifiedDevelopers?.some((developer) => developer.userId === user?.id),
  )
  const canAccess = Boolean(user && hasManagePermission && (!isDeveloper || isVerifiedDeveloper))

  const backToEmulatorsAction = (
    <Link href="/admin/emulators" className="inline-flex">
      <Button variant="outline">Back to Emulators</Button>
    </Link>
  )

  if (isLoading || isEmulatorLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading custom fields…" />
      </div>
    )
  }

  if (userQuery.isError || !user) {
    return (
      <UnauthenticatedPage
        icon={ShieldAlert}
        title="Admin Access Required"
        subtitle="Sign in to access the admin panel"
        description="This area is restricted to administrators. Please sign in with your admin account to manage custom fields."
        showSignUp={false}
      />
    )
  }

  if (!canAccess) {
    return (
      <FeedbackCard
        title="Access Denied"
        description="You do not have permission to manage custom fields for this emulator."
        actions={backToEmulatorsAction}
      />
    )
  }

  // Check if user can see Apply Templates button (only SUPER_ADMIN)
  const canApplyTemplates = hasRolePermission(user.role, Role.SUPER_ADMIN)

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

  function handleRefresh() {
    void customFieldDefinitionsQuery.refetch()
    void categoriesQuery.refetch()
  }

  function handleFieldDelete() {
    void customFieldDefinitionsQuery.refetch()
  }

  if (customFieldDefinitionsQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading custom fields…" />
      </div>
    )
  }

  if (emulatorQuery.error) {
    return (
      <FeedbackCard
        title="Failed to load emulator"
        description={emulatorQuery.error.message ?? 'Please try again later.'}
        actions={backToEmulatorsAction}
      />
    )
  }

  if (customFieldDefinitionsQuery.error) {
    return (
      <FeedbackCard
        title="Failed to load custom fields"
        description={customFieldDefinitionsQuery.error.message ?? 'Please try again later.'}
        actions={backToEmulatorsAction}
      />
    )
  }

  if (!emulatorQuery.data) {
    return (
      <FeedbackCard
        title="Emulator not found"
        description="The emulator you are trying to manage was not found or you no longer have access to it."
        actions={backToEmulatorsAction}
      />
    )
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

      <CustomFieldsDragAndDrop
        emulatorId={emulatorId}
        fields={customFieldDefinitionsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        onFieldEdit={handleOpenEditModal}
        onFieldDelete={handleFieldDelete}
        onRefresh={handleRefresh}
      />

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
