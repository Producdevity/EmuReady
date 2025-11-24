'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, type FormEvent } from 'react'
import { Button, Modal } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type ReportReasonType } from '@/schemas/listingReport'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ReportReason } from '@orm'

interface Props {
  isOpen: boolean
  onClose: () => void
  listingId: string
  onSuccess: () => void
}

const REPORT_REASONS = [
  { value: ReportReason.SPAM, label: 'Spam or repetitive content' },
  {
    value: ReportReason.INAPPROPRIATE_CONTENT,
    label: 'Inappropriate or offensive content',
  },
  {
    value: ReportReason.MISLEADING_INFORMATION,
    label: 'Misleading or false information',
  },
  { value: ReportReason.FAKE_LISTING, label: 'Fake or fabricated listing' },
  { value: ReportReason.COPYRIGHT_VIOLATION, label: 'Copyright violation' },
  { value: ReportReason.OTHER, label: 'Other (please specify)' },
] as const

function ReportListingModal(props: Props) {
  const [reason, setReason] = useState<ReportReasonType>(ReportReason.SPAM)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const createReport = api.listingReports.create.useMutation()
  const { user } = useUser()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!props.isOpen) return
    setReason(ReportReason.SPAM)
    setDescription('')
    setError('')
  }, [props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')

    if (reason === ReportReason.OTHER && !description.trim()) {
      setError('Please provide a description for "Other" reports.')
      return
    }

    try {
      await createReport.mutateAsync({
        listingId: props.listingId,
        reason,
        description: description.trim() || undefined,
      } satisfies RouterInput['listingReports']['create'])

      // Track content flagging in analytics
      if (user?.id) {
        analytics.contentQuality.contentFlagged({
          entityType: 'listing',
          entityId: props.listingId,
          flaggedBy: user.id,
          reason,
        })
      }

      toast.success('Report submitted successfully. Thank you for helping keep our community safe!')
      props.onSuccess()
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
    }
  }

  const handleClose = () => {
    if (createReport.isPending) return
    props.onClose()
  }

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} title="Report Listing">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Help us maintain a safe and accurate community by reporting inappropriate content. All
            reports are reviewed by our moderation team.
          </p>
        </div>

        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Reason for reporting <span className="text-red-500">*</span>
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReasonType)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            {REPORT_REASONS.map((reasonOption) => (
              <option key={reasonOption.value} value={reasonOption.value}>
                {reasonOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Additional details{' '}
            {reason === ReportReason.OTHER && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide additional context about why you're reporting this listing..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            maxLength={500}
            required={reason === ReportReason.OTHER}
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description.length}/500 characters
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createReport.isPending}
            isLoading={createReport.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={createReport.isPending}
            disabled={createReport.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ReportListingModal
