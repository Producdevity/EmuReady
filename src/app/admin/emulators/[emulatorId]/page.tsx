'use client'

import { ArrowLeft } from 'lucide-react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { AdminPageLayout, AdminSection } from '@/components/admin'
import { Button, PageSkeletonLoading } from '@/components/ui'
import { api } from '@/lib/api'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import EmulatorEditForm from './components/EmulatorEditForm'
import ManageSupportedPlatforms from './components/ManageSupportedPlatforms'
import ManageSupportedSystems from './components/ManageSupportedSystems'

function EditEmulatorPage() {
  const router = useRouter()
  const params = useParams()
  const emulatorId = params.emulatorId as string

  const emulatorsQuery = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })
  const currentUser = api.users.me.useQuery()
  const verifiedDeveloperQuery = api.emulators.getVerifiedDeveloper.useQuery(
    { emulatorId },
    {
      enabled: !!emulatorId && currentUser.data?.role === Role.DEVELOPER,
    },
  )

  const user = currentUser.data
  const hasManagePermission = hasPermission(user?.permissions, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
  const isDeveloper = user?.role === Role.DEVELOPER
  const isVerifiedDeveloper = Boolean(verifiedDeveloperQuery.data)
  const hasAccess = Boolean(user && hasManagePermission && (!isDeveloper || isVerifiedDeveloper))

  const systemsQuery = api.systems.get.useQuery({}, { enabled: !!user && hasAccess })
  const platformsQuery = api.platforms.get.useQuery(undefined, { enabled: !!user && hasAccess })

  const isLoading =
    currentUser.isPending || emulatorsQuery.isLoading || verifiedDeveloperQuery.isLoading

  if (isLoading) return <PageSkeletonLoading />

  if (!user || !hasAccess) {
    return (
      <AdminPageLayout
        title="Emulator"
        description="Permission required"
        headerActions={
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.back()}>
            Back
          </Button>
        }
      >
        <p className="text-lg text-gray-700 dark:text-gray-200">
          You do not have permission to manage this emulator.
        </p>
      </AdminPageLayout>
    )
  }

  if (systemsQuery.isPending || platformsQuery.isPending) return <PageSkeletonLoading />

  if (emulatorsQuery.error || systemsQuery.error || platformsQuery.error) {
    return (
      <AdminPageLayout title="Emulator" description="Loading failed">
        <p className="text-red-500">
          Error loading data:{' '}
          {emulatorsQuery.error?.message ??
            systemsQuery.error?.message ??
            platformsQuery.error?.message ??
            'An unknown error occurred'}
        </p>
      </AdminPageLayout>
    )
  }

  if (!emulatorsQuery.data || !systemsQuery.data || !platformsQuery.data) return notFound()

  return (
    <AdminPageLayout
      title={`Edit Emulator: ${emulatorsQuery.data.name}`}
      description="Manage emulator details, supported systems, and platforms"
      headerActions={
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.back()}>
          Back
        </Button>
      }
    >
      <div className="space-y-10">
        <AdminSection title="Emulator Details">
          <EmulatorEditForm emulator={emulatorsQuery.data} />
        </AdminSection>

        <AdminSection title="Supported Systems">
          <ManageSupportedSystems
            emulatorId={emulatorsQuery.data.id}
            allSystems={systemsQuery.data}
            currentlySupportedSystems={emulatorsQuery.data.systems}
          />
        </AdminSection>

        <AdminSection title="Supported Platforms">
          <ManageSupportedPlatforms
            emulatorId={emulatorsQuery.data.id}
            allPlatforms={platformsQuery.data}
            currentlySupportedPlatformIds={emulatorsQuery.data.platforms.map((p) => p.platform.id)}
          />
        </AdminSection>

        <AdminSection title="Custom Fields">
          <Button onClick={() => router.push(`/admin/emulators/${emulatorId}/custom-fields`)}>
            Manage Custom Fields
          </Button>
        </AdminSection>
      </div>
    </AdminPageLayout>
  )
}

export default EditEmulatorPage
