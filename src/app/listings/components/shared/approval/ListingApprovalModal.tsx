'use client'

import { AlertTriangle, Flag } from 'lucide-react'
import { useMemo } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
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
  listingType: 'handheld' | 'pc'
  action: 'approve' | 'reject'
  rejectionNotes: string
  onRejectionNotesChange: (notes: string) => void
  onConfirm: () => void | Promise<void>
  onClose: () => void
  isLoading: boolean
}

interface ReportStats {
  hasReports: boolean
  reportCount: number
  reportedListingsCount: number
}

function isHandheldListing(
  listing: HandheldListing | PcListing,
): listing is NonNullable<HandheldListing> {
  return 'device' in listing
}

function extractHandheldReportStats(listing: HandheldListing): ReportStats {
  const stats = (
    listing as HandheldListing & {
      authorReportStats?: {
        hasReports: boolean
        totalReports: number
        reportedListingsCount: number
      }
    }
  ).authorReportStats

  return {
    hasReports: stats?.hasReports ?? false,
    reportCount: stats?.totalReports ?? 0,
    reportedListingsCount: stats?.reportedListingsCount ?? 0,
  }
}

function extractPcReportStats(listing: PcListing): ReportStats {
  const reportsCount =
    (listing as PcListing & { _count?: { reports: number } })._count?.reports ?? 0

  return {
    hasReports: reportsCount > 0,
    reportCount: reportsCount,
    reportedListingsCount: 0,
  }
}

export function ListingApprovalModal(props: Props) {
  const emulatorLogos = useEmulatorLogos()
  const isHandheld = isHandheldListing(props.listing)

  const reportStats = useMemo((): ReportStats => {
    if (props.listingType === 'handheld') {
      return extractHandheldReportStats(props.listing as HandheldListing)
    }
    return extractPcReportStats(props.listing as PcListing)
  }, [props.listingType, props.listing])

  const actionText = props.action === 'approve' ? 'Approve' : 'Reject'
  const listingTypeText = isHandheld ? 'Handheld' : 'PC'
  const modalTitle = `${actionText} ${listingTypeText} Listing: ${props.listing.game.title}`

  const buttonVariant =
    props.action === 'reject' ? 'danger' : reportStats.hasReports ? 'destructive' : 'default'

  const buttonText =
    props.action === 'reject'
      ? 'Confirm Rejection'
      : reportStats.hasReports
        ? 'Approve Anyway'
        : 'Confirm Approval'

  return (
    <Modal isOpen onClose={props.onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        {reportStats.hasReports && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  ⚠️ Reported User Warning
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  The author of this listing ({props.listing.author?.name}) has{' '}
                  <strong>{reportStats.reportCount} active reports</strong>
                  {isHandheld && reportStats.reportedListingsCount > 0 && (
                    <> against {reportStats.reportedListingsCount} of their listings</>
                  )}
                  .
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Please review this listing carefully before{' '}
                  {props.action === 'approve' ? 'approval' : 'rejection'}. Consider checking the
                  reports page for more details.
                </p>
              </div>
            </div>
          </div>
        )}

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
