'use client'

import { Flag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  Button,
  Modal,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
import { type RouterOutput } from '@/types/trpc'
import { formatDateTime } from '@/utils/date'
import getImageUrl from '@/utils/getImageUrl'

type PendingPcListing =
  RouterOutput['pcListings']['pending']['pcListings'][number]

interface ApprovalModalProps {
  listing: PendingPcListing
  onClose: () => void
  onApprove: (id: string) => Promise<void>
  isLoading: boolean
}

function ApprovalModal(props: ApprovalModalProps) {
  const emulatorLogos = useEmulatorLogos()

  const handleApprove = async () => {
    await props.onApprove(props.listing.id)
    props.onClose()
  }

  return (
    <Modal isOpen onClose={props.onClose} title="Review PC Listing" size="lg">
      <div className="space-y-6">
        {/* User Warning Banner */}
        {(props.listing._count?.reports ?? 0) > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <Flag className="w-5 h-5" />
              <p className="font-medium">
                Warning: This listing has active reports
              </p>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Please review this PC listing carefully before approving.
            </p>
          </div>
        )}

        {/* Listing Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Game Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Game
            </h3>
            <div className="flex items-center gap-3">
              {props.listing.game.imageUrl && (
                <Image
                  src={getImageUrl(
                    props.listing.game.imageUrl,
                    props.listing.game.title,
                  )}
                  alt={props.listing.game.title}
                  width={48}
                  height={48}
                  className="object-cover rounded"
                  unoptimized
                />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {props.listing.game.title}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <SystemIcon
                    systemKey={props.listing.game.system.key}
                    name={props.listing.game.system.name}
                    size="sm"
                  />
                  {props.listing.game.system.name}
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Hardware
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">CPU:</span>{' '}
                {props.listing.cpu.brand.name} {props.listing.cpu.modelName}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">GPU:</span>{' '}
                {props.listing.gpu?.brand.name} {props.listing.gpu?.modelName}
              </p>
            </div>
          </div>

          {/* Emulator Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Emulator
            </h3>
            <div className="flex items-center gap-2">
              <EmulatorIcon
                logo={props.listing.emulator.logo}
                name={props.listing.emulator.name}
                size="md"
                showLogo={emulatorLogos.showEmulatorLogos}
              />
              <span className="text-gray-900 dark:text-white">
                {props.listing.emulator.name}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Submitted By
            </h3>
            <div className="flex items-center gap-2">
              <Link
                href={`/user/${props.listing.author.name}`}
                target="_blank"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {props.listing.author.name}
              </Link>
              {(props.listing._count?.reports ?? 0) > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Flag className="w-4 h-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    This listing has active reports
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDateTime(props.listing.createdAt)}
            </p>
          </div>
        </div>

        {/* Performance Score */}
        {props.listing.performance && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Performance Score
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {props.listing.performance.rank}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {props.listing.performance.label}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {props.listing.notes && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Notes
            </h3>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {props.listing.notes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={props.onClose}
          disabled={props.isLoading}
        >
          Cancel
        </Button>
        <Button
          variant={
            (props.listing._count?.reports ?? 0) > 0 ? 'destructive' : 'default'
          }
          onClick={handleApprove}
          disabled={props.isLoading}
        >
          {(props.listing._count?.reports ?? 0) > 0
            ? 'Approve Anyway'
            : 'Approve PC Listing'}
        </Button>
      </div>
    </Modal>
  )
}

export default ApprovalModal
