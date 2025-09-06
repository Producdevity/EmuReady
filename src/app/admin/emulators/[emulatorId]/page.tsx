'use client'

import { ArrowLeft } from 'lucide-react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Button, PageSkeletonLoading } from '@/components/ui'
import { api } from '@/lib/api'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission as hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import EmulatorEditForm from './components/EmulatorEditForm'
import ManageSupportedSystems from './components/ManageSupportedSystems'

function EditEmulatorPage() {
  const router = useRouter()
  const params = useParams()
  const emulatorId = params.emulatorId as string

  const emulatorsQuery = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })
  const currentUser = api.users.me.useQuery()

  // Gate access using permission + verified for developers
  if (currentUser.data) {
    const role = currentUser.data.role
    const perms = currentUser.data.permissions
    const canManage = hasPermission(perms, PERMISSIONS.MANAGE_EMULATORS)
    const isModeratorOrHigher = hasRolePermission(role, Role.MODERATOR)
    if (!canManage) {
      router.replace('/admin/emulators')
      return null
    }
    if (!isModeratorOrHigher) {
      // Developers need to be verified for this emulator; reuse API: getVerifiedDeveloper
      // We can’t await here; rely on the Custom Fields page for developer flow
      router.replace(`/admin/emulators/${emulatorId}/custom-fields`)
      return null
    }
  }

  const systemsQuery = api.systems.get.useQuery({})

  if (emulatorsQuery.isPending || systemsQuery.isPending) return <PageSkeletonLoading />

  if (emulatorsQuery.error || systemsQuery.error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">
          Error loading data:{' '}
          {emulatorsQuery.error?.message ??
            systemsQuery.error?.message ??
            'An unknown error occurred'}
        </p>
      </div>
    )
  }

  if (!emulatorsQuery.data || !systemsQuery.data) return notFound()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Edit Emulator:{' '}
        <span className="text-blue-600 dark:text-blue-400">{emulatorsQuery.data.name}</span>
      </h1>

      <div className="space-y-10">
        {/* Section for Emulator Details */}
        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Emulator Details
          </h2>
          <EmulatorEditForm emulator={emulatorsQuery.data} />
        </section>

        {/* Section for Supported Systems */}
        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Supported Systems
          </h2>
          <ManageSupportedSystems
            emulatorId={emulatorsQuery.data.id}
            allSystems={systemsQuery.data}
            currentlySupportedSystems={emulatorsQuery.data.systems} // emulator.systems should be populated by the byId query
          />
        </section>

        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Custom Fields
          </h2>
          <Button onClick={() => router.push(`/admin/emulators/${emulatorId}/custom-fields`)}>
            Manage Custom Fields
          </Button>
        </section>
      </div>
    </div>
  )
}

export default EditEmulatorPage
