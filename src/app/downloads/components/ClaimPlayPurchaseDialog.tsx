'use client'

import { useState } from 'react'
import { Modal, Input, Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'

interface Props {
  onClose: () => void
}

export default function ClaimPlayPurchaseDialog(props: Props) {
  const [orderId, setOrderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const utils = api.useUtils()
  const claim = api.entitlements.claimPlayOrder.useMutation({
    onSuccess: async () => {
      await utils.entitlements.getMy.invalidate()
    },
  })

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await claim.mutateAsync({ orderId })
      props.onClose()
    } catch {
      setError('Failed to submit order id. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen onClose={props.onClose} title="Verify Google Play Purchase">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paste your Google Play order ID (starts with <code className="font-mono">GPA.</code>) to
          unlock lifetime downloads.
        </p>

        <Input
          value={orderId}
          onChange={(e) => setOrderId((e.target as HTMLInputElement).value)}
          placeholder="GPA.1234-5678-9012-34567"
        />

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={props.onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || orderId.trim().length < 10}>
            {submitting ? <LoadingSpinner size="sm" /> : 'Submit'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
