'use client'

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { type ReportStatusType } from '@/schemas/listingReport'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ReportStatus } from '@orm'
import { type ListingReportWithDetails } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  report?: ListingReportWithDetails
  onSuccess: () => void
}

const STATUSES = [
  { value: ReportStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: ReportStatus.RESOLVED, label: 'Resolved' },
  { value: ReportStatus.DISMISSED, label: 'Dismissed' },
] as const

function ReportStatusModal(props: Props) {
  const [status, setStatus] = useState<ReportStatusType>(ReportStatus.UNDER_REVIEW)
  const [reviewNotes, setReviewNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateReportStatus = api.listingReports.updateStatus.useMutation()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (props.isOpen && props.report) {
      setStatus(
        props.report.status === ReportStatus.PENDING
          ? ReportStatus.UNDER_REVIEW
          : props.report.status,
      )
      setReviewNotes(props.report.reviewNotes || '')
      setError('')
      setSuccess('')
    } else if (!props.isOpen) {
      setStatus(ReportStatus.UNDER_REVIEW)
      setReviewNotes('')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen, props.report])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!props.report) return

    setError('')
    setSuccess('')

    try {
      await updateReportStatus.mutateAsync({
        id: props.report.id,
        status,
        reviewNotes: reviewNotes.trim() || undefined,
      } satisfies RouterInput['listingReports']['updateStatus'])

      setSuccess('Report status updated successfully!')

      // Close modal after short delay
      setTimeout(() => {
        props.onSuccess()
      }, 1000)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update report status.'))
    }
  }

  if (!props.report) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Update Report Status"
      closeOnBackdropClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Report Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Summary</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Listing:</strong> {props.report.listing.game.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Reason:</strong> {props.report.reason.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Reported by:</strong> {props.report.reportedBy.name || 'Unknown'}
          </p>
          {props.report.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>Description:</strong> {props.report.description}
            </p>
          )}
        </div>

        {/* Status Selection */}
        <div>
          <label
            htmlFor="status"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            New Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatusType)}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {STATUSES.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
        </div>

        {/* Review Notes */}
        <div>
          <label
            htmlFor="reviewNotes"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Review Notes
          </label>
          <Input
            as="textarea"
            id="reviewNotes"
            value={reviewNotes}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setReviewNotes(e.target.value)
            }
            rows={4}
            className="w-full"
            placeholder="Add notes about your review decision..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            These notes will be visible to other admins and help track review decisions.
          </p>
        </div>

        {/* Status-specific help text */}
        {status === ReportStatus.RESOLVED && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Resolved:</strong> Use this when the report is valid and appropriate action
              has been taken (e.g., listing was removed, user was warned, etc.).
            </p>
          </div>
        )}

        {status === ReportStatus.DISMISSED && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Dismissed:</strong> Use this when the report is invalid or doesn&rsquo;t
              require action (e.g., false report, misunderstanding, etc.).
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            {success}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={updateReportStatus.isPending}
            disabled={updateReportStatus.isPending}
          >
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ReportStatusModal
