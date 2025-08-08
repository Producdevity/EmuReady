'use client'

import { Settings } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type EmulatorConfigType } from '@/server/utils/emulator-config/constants'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { ms } from '@/utils/time'
import { Role } from '@orm'
import ViewConfigModal from './ViewConfigModal'

interface Props {
  listingId: string
  emulatorId: string
}

function ViewConfigButton(props: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [configData, setConfigData] = useState<{
    type: EmulatorConfigType
    filename: string
    content: string
    listing: {
      id: string
      game: string
      system: string
      emulator: string
    }
  } | null>(null)

  // Get current user to check permissions
  const currentUserQuery = api.users.me.useQuery()
  const isAdmin = roleIncludesRole(currentUserQuery.data?.role, Role.ADMIN)
  const isDeveloper = roleIncludesRole(
    currentUserQuery.data?.role,
    Role.DEVELOPER,
  )

  // Check if user is a verified developer for this emulator
  const verifiedDeveloperQuery = api.users.isVerifiedDeveloper.useQuery(
    { emulatorId: props.emulatorId },
    {
      enabled: !!currentUserQuery.data?.id && isDeveloper && !isAdmin,
      staleTime: ms.minutes(5),
    },
  )

  const isVerifiedDeveloper = verifiedDeveloperQuery.data === true
  const canViewConfig = isAdmin || (isDeveloper && isVerifiedDeveloper)

  const fetchConfigQuery = api.listings.getListingConfig.useQuery(
    { id: props.listingId },
    {
      enabled: false, // Only fetch when explicitly called
      staleTime: 0, // Always fetch fresh data
    },
  )

  if (!canViewConfig) return null

  const handleViewConfig = async () => {
    try {
      const result = await fetchConfigQuery.refetch()
      if (result.data) {
        setConfigData(result.data)
        setIsModalOpen(true)
      }
      if (result.error) {
        toast.error(
          `Failed to generate config: ${getErrorMessage(result.error)}`,
        )
      }
    } catch (error) {
      toast.error(`Failed to generate config: ${getErrorMessage(error)}`)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewConfig}
        disabled={fetchConfigQuery.isFetching}
      >
        <Settings className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">
          {fetchConfigQuery.isFetching ? 'Loading...' : 'Config'}
        </span>
      </Button>

      {isModalOpen && configData && (
        <ViewConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          configData={configData}
        />
      )}
    </>
  )
}

export default ViewConfigButton
