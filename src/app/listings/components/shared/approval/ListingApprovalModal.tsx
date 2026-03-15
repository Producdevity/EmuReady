'use client'

import { AuthorRiskWarningBanner, Modal, Button, Input } from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type ListingType } from '@/schemas/common'
import { type RouterOutput } from '@/types/trpc'
import {
  GameInfoSection,
  EmulatorInfoSection,
  UserInfoSection,
  PerformanceSection,
  NotesSection,
} from './ApprovalModalSharedComponents'

type HandheldListing = RouterOutput['listings']['byId']
type PcListing = RouterOutput['pcListings']['byId']

interface Props {
  listing: HandheldListing | PcListing
  listingType: ListingType
  action: 'approve' | 'reject'
  rejectionNotes: string
  onRejectionNotesChange: (notes: string) => void
  onConfirm: () => void | Promise<void>
  onClose: () => void
  isLoading: boolean
  authorRiskProfile?: AuthorRiskProfile | null
}

function isHandheldListing(
  listing: HandheldListing | PcListing,
): listing is NonNullable<HandheldListing> {
  return 'device' in listing
}

export function ListingApprovalModal(props: Props) {
  const emulatorLogos = useEmulatorLogos()
  const isHandheld = isHandheldListing(props.listing)

  const hasRisk = props.authorRiskProfile?.highestSeverity != null

  const actionText = props.action === 'approve' ? 'Approve' : 'Reject'
  const listingTypeText = isHandheld ? 'Handheld' : 'PC'
  const modalTitle = `${actionText} ${listingTypeText} Listing: ${props.listing.game.title}`

  const buttonVariant = props.action === 'reject' ? 'danger' : hasRisk ? 'destructive' : 'default'

  const buttonText =
    props.action === 'reject'
      ? 'Confirm Rejection'
      : hasRisk
        ? 'Approve Anyway'
        : 'Confirm Approval'

  return (
    <Modal isOpen onClose={props.onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        <AuthorRiskWarningBanner riskProfile={props.authorRiskProfile} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GameInfoSection game={props.listing.game} />

          {/* Hardware Info */}
          {isHandheld ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Device</h3>
              <p className="text-gray-900 dark:text-white">
                {'device' in props.listing && props.listing.device ? (
                  <>
                    {props.listing.device.brand.name} {props.listing.device.modelName}
                  </>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Hardware
              </h3>
              <div className="space-y-1">
                {'cpu' in props.listing && props.listing.cpu ? (
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">CPU:</span> {props.listing.cpu.brand.name}{' '}
                    {props.listing.cpu.modelName}
                  </p>
                ) : null}
                {'gpu' in props.listing && props.listing.gpu && (
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">GPU:</span> {props.listing.gpu.brand.name}{' '}
                    {props.listing.gpu.modelName}
                  </p>
                )}
              </div>
            </div>
          )}

          <EmulatorInfoSection
            emulator={props.listing.emulator}
            showLogo={emulatorLogos.showEmulatorLogos}
          />

          <UserInfoSection author={props.listing.author} createdAt={props.listing.createdAt} />
        </div>

        <PerformanceSection performance={props.listing.performance} />

        <NotesSection notes={props.listing.notes} />

        {/* Rejection Notes Input */}
        {props.action === 'reject' && (
          <div>
            <label
              htmlFor="rejectionNotes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Rejection Notes (Optional)
            </label>
            <Input
              as="textarea"
              id="rejectionNotes"
              value={props.rejectionNotes}
              onChange={(ev) => props.onRejectionNotesChange(ev.target.value)}
              rows={4}
              placeholder="Reason for rejection..."
              className="w-full mt-1"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
          <Button variant="ghost" onClick={props.onClose} disabled={props.isLoading}>
            Cancel
          </Button>
          <Button
            variant={buttonVariant}
            onClick={props.onConfirm}
            isLoading={props.isLoading}
            disabled={props.isLoading}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
