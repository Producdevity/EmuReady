import { useRouter } from 'next/navigation'
import { hasHandheldDevice } from '@/app/listings/components/shared/utils/universal-listing'
import {
  ApprovalStatusBadge,
  Badge,
  ListingVerificationBadge,
  PerformanceBadge,
  VerifiedDeveloperBadge,
} from '@/components/ui'
import type { RouterOutput } from '@/types/trpc'
import type { ReactNode } from 'react'

type Listing = NonNullable<RouterOutput['listings']['byId']>
type PcListing = NonNullable<RouterOutput['pcListings']['byId']>

interface Props {
  universalListing: Listing | PcListing
  canViewBannedUsers: boolean
}

export function DetailsHeaderBadges(props: Props) {
  const router = useRouter()
  const handheldDevice = hasHandheldDevice(props.universalListing)
    ? props.universalListing.device
    : null

  return (
    <>
      {
        [
          <Badge
            key="system"
            onClick={() =>
              router.push(
                `/${handheldDevice ? 'listings' : 'pc-listings'}?systemIds=${props.universalListing?.game.system?.id}`,
              )
            }
            variant="default"
          >
            System: {props.universalListing?.game.system?.name}
          </Badge>,
          handheldDevice ? (
            <Badge
              key="device"
              onClick={() => router.push(`/devices?deviceId=${handheldDevice.id}`)}
              variant="default"
            >
              Device: {handheldDevice.brand?.name} {handheldDevice.modelName}
            </Badge>
          ) : null,
          <Badge
            key="emulator"
            onClick={() =>
              router.push(`/emulators?emulatorId=${props.universalListing?.emulator?.id}`)
            }
            variant="default"
          >
            Emulator: {props.universalListing?.emulator?.name}
          </Badge>,
          <PerformanceBadge
            key="perf"
            pill={false}
            rank={props.universalListing.performance.rank}
            label={props.universalListing.performance.label}
            description={props.universalListing.performance?.description}
          />,
          props.universalListing.isVerifiedDeveloper ? (
            <span key="vd" className="ml-1">
              <VerifiedDeveloperBadge showText />
            </span>
          ) : null,
          props.universalListing.developerVerifications &&
          props.universalListing.developerVerifications.length > 0 ? (
            <ListingVerificationBadge
              key="lvb"
              verifications={props.universalListing.developerVerifications}
              showText
              showTooltip
            />
          ) : null,
          props.canViewBannedUsers ? (
            <ApprovalStatusBadge key="as" status={props.universalListing.status} />
          ) : null,
        ].filter(Boolean) as ReactNode[]
      }
    </>
  )
}
