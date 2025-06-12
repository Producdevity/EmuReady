'use client'

import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import EmulatorEditForm from './components/EmulatorEditForm'
import ManageSupportedSystems from './components/ManageSupportedSystems'

function EditEmulatorPage() {
  const router = useRouter()
  const params = useParams()
  const emulatorId = params.emulatorId as string

  const {
    data: emulator,
    isLoading: isLoadingEmulator,
    error: emulatorError,
  } = api.emulators.byId.useQuery({ id: emulatorId }, { enabled: !!emulatorId })

  const {
    data: allSystems,
    isLoading: isLoadingSystems,
    error: systemsError,
  } = api.systems.get.useQuery({})

  if (isLoadingEmulator || isLoadingSystems) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading emulator and systems data...</p>
      </div>
    )
  }

  if (emulatorError || systemsError) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">
          Error loading data:{' '}
          {emulatorError?.message ??
            systemsError?.message ??
            'An unknown error occurred'}
        </p>
      </div>
    )
  }

  if (!emulator) {
    return (
      <div className="container mx-auto p-4">
        <p>Emulator not found.</p>
      </div>
    )
  }

  if (!allSystems) {
    return (
      <div className="container mx-auto p-4">
        <p>No systems found to configure.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Emulators
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Edit Emulator:{' '}
        <span className="text-blue-600 dark:text-blue-400">
          {emulator.name}
        </span>
      </h1>

      <div className="space-y-10">
        {/* Section for Emulator Details */}
        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Emulator Details
          </h2>
          <EmulatorEditForm emulator={emulator} />
        </section>

        {/* Section for Supported Systems */}
        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Supported Systems
          </h2>
          <ManageSupportedSystems
            emulatorId={emulator.id}
            allSystems={allSystems}
            currentlySupportedSystems={emulator.systems} // emulator.systems should be populated by the byId query
          />
        </section>

        <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">
            Custom Fields
          </h2>
          <Button
            onClick={() =>
              router.push(`/admin/emulators/${emulatorId}/custom-fields`)
            }
          >
            Manage Custom Fields
          </Button>
        </section>
      </div>
    </div>
  )
}

export default EditEmulatorPage
