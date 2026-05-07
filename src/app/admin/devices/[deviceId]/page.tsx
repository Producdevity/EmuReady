'use client'

import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { AdminPageLayout, AdminSection } from '@/components/admin'
import { Button, InputPlaceholder, PageSkeletonLoading, PlatformsSummary } from '@/components/ui'
import { api } from '@/lib/api'
import { formatCountLabel } from '@/utils/text'
import ManageDefaultDevicePlatform from './components/ManageDefaultDevicePlatform'
import ManageSupportedDevicePlatforms from './components/ManageSupportedDevicePlatforms'

function EditDevicePage() {
  const router = useRouter()
  const params = useParams()
  const deviceId = params.deviceId as string

  const deviceQuery = api.devices.byId.useQuery({ id: deviceId }, { enabled: !!deviceId })
  const platformsQuery = api.platforms.get.useQuery()

  if (deviceQuery.isLoading || platformsQuery.isLoading) return <PageSkeletonLoading />

  if (deviceQuery.error || platformsQuery.error) {
    return (
      <AdminPageLayout title="Device" description="Loading failed">
        <p className="text-red-500">
          Error loading data:{' '}
          {deviceQuery.error?.message ??
            platformsQuery.error?.message ??
            'An unknown error occurred'}
        </p>
      </AdminPageLayout>
    )
  }

  if (!deviceQuery.data || !platformsQuery.data) return notFound()

  const device = deviceQuery.data
  const supportedPlatforms = device.platforms.map((dp) => dp.platform)
  const supportedPlatformIds = supportedPlatforms.map((p) => p.id)
  const allPlatforms = platformsQuery.data
  const supportedPlatformRecords = allPlatforms.filter((p) => supportedPlatformIds.includes(p.id))
  const deviceSoc =
    device.soc?.manufacturer && device.soc?.name
      ? `${device.soc.manufacturer} ${device.soc.name}`
      : 'Not specified'

  return (
    <AdminPageLayout
      title={`${device.brand.name} ${device.modelName}`}
      description="Manage supported platforms and the default platform for this device"
      headerActions={
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.back()}>
          Back
        </Button>
      }
    >
      <div className="space-y-10">
        <AdminSection
          title="Device Details"
          actions={
            <Button variant="outline" size="sm" icon={Pencil} asChild>
              <Link href={`/admin/devices?editId=${device.id}`}>Edit basics</Link>
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputPlaceholder label="Brand" value={device.brand.name} />
            <InputPlaceholder label="Model" value={device.modelName} />
            <InputPlaceholder label="System on Chip (SoC)" value={deviceSoc} />
            <InputPlaceholder
              label="Total Listings"
              value={formatCountLabel('listing', device._count.listings)}
            />
          </div>
          <div className="mt-6">
            <PlatformsSummary
              platforms={supportedPlatforms}
              defaultPlatform={device.defaultPlatform ?? null}
              emptyLabel="No platforms set yet — add some below"
            />
          </div>
        </AdminSection>

        <AdminSection title="Supported Platforms">
          <ManageSupportedDevicePlatforms
            deviceId={device.id}
            allPlatforms={allPlatforms}
            currentlySupportedPlatformIds={supportedPlatformIds}
          />
        </AdminSection>

        <AdminSection title="Default Platform">
          <ManageDefaultDevicePlatform
            deviceId={device.id}
            supportedPlatforms={supportedPlatformRecords}
            currentDefaultPlatformId={device.defaultPlatform?.id ?? null}
          />
        </AdminSection>
      </div>
    </AdminPageLayout>
  )
}

export default EditDevicePage
