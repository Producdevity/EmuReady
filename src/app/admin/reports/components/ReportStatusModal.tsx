'use client'

import { useState, type SubmitEvent, type ChangeEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ReportStatus } from '@orm'
import { type AdminReportWithDetails } from '../adminReport'

interface Props {
  isOpen: boolean
  onClose: () => void
  report?: AdminReportWithDetails
  onSuccess: () => void
}

interface ContentProps {
  onClose: () => void
  report: AdminReportWithDetails
  onSuccess: () => void
}

const STATUSES = [
  { value: ReportStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: ReportStatus.RESOLVED, label: 'Resolved' },
  { value: ReportStatus.DISMISSED, label: 'Dismissed' },
] as const

type ReviewableReportStatus = (typeof STATUSES)[number]['value']

function isReviewableReportStatus(value: string): value is ReviewableReportStatus {
  return STATUSES.some((status) => status.value === value)
}

function getInitialStatus(report: AdminReportWithDetails): ReviewableReportStatus {
  return report.status === ReportStatus.PENDING ? ReportStatus.UNDER_REVIEW : report.status
}

function ReportStatusModalContent(props: ContentProps) {
  const [status, setStatus] = useState<ReviewableReportStatus>(getInitialStatus(props.report))
  const [reviewNotes, setReviewNotes] = useState(props.report.reviewNotes || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateListingReportStatus = api.listingReports.updateStatus.useMutation()
  const updatePcListingReportStatus = api.pcListingReports.updateStatus.useMutation()
  const isPending = updateListingReportStatus.isPending || updatePcListingReportStatus.isPending

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()

    setError('')
    setSuccess('')

    try {
      if (props.report.kind === 'handheld') {
        await updateListingReportStatus.mutateAsync({
          id: props.report.id,
          status,
          reviewNotes: reviewNotes.trim() || undefined,
        } satisfies RouterInput['listingReports']['updateStatus'])
      } else {
        await updatePcListingReportStatus.mutateAsync({
          id: props.report.id,
          status,
          reviewNotes: reviewNotes.trim() || undefined,
        } satisfies RouterInput['pcListingReports']['updateStatus'])
      }

      setSuccess('Report status updated successfully!')

      setTimeout(() => {
        props.onSuccess()
      }, 1000)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update report status.'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={props.onClose}
      title="Update Report Status"
      closeOnBackdropClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Summary</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{props.report.compatibilityReport.reportLabel}:</strong>{' '}
            {props.report.compatibilityReport.gameTitle}
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
            onChange={(e) => {
              if (!isReviewableReportStatus(e.target.value)) return
              setStatus(e.target.value)
            }}
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

        {status === ReportStatus.RESOLVED && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Resolved:</strong> Use this when the report is valid and appropriate action
              has been taken (e.g., report was removed, user was warned, etc.).
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
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ReportStatusModal(props: Props) {
  if (!props.isOpen || !props.report) return null

  return (
    <ReportStatusModalContent
      key={`${props.report.kind}:${props.report.id}`}
      report={props.report}
      onClose={props.onClose}
      onSuccess={props.onSuccess}
    />
  )
}

export default ReportStatusModal
