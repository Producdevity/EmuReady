'use client'

import { Button, Modal, Badge } from '@/components/ui'
import { type ListingReportWithDetails } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  report?: ListingReportWithDetails
}

function ReportDetailsModal(props: Props) {
  if (!props.report) return null

  const { report } = props

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Report Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Report Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Report Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <Badge variant="danger">{report.reason.replace(/_/g, ' ')}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Badge>{report.status.replace(/_/g, ' ')}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reported On
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
            {report.reviewedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reviewed On
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(report.reviewedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          {report.description && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {report.description}
              </p>
            </div>
          )}
        </div>

        {/* Reported User */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Reported By
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {report.reportedBy.name || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {report.reportedBy.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Reported Listing
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Game
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {report.listing.game.title}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {report.listing.device.modelName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emulator
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {report.listing.emulator.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {report.listing.author.name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Notes */}
        {report.reviewNotes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Review Notes
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {report.reviewNotes}
              </p>
              {report.reviewedBy && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  — {report.reviewedBy.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
          <Button
            onClick={() =>
              window.open(`/listings/${report.listing.id}`, '_blank')
            }
          >
            View Listing
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ReportDetailsModal
