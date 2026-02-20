'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { api } from '@/lib/api'
import { env } from '@/lib/env'

interface Props {
  onClose: () => void
}

export default function LinkPatreonDialog(props: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const start = api.entitlements.linkPatreonStart.useMutation()

  async function onLink() {
    setLoading(true)
    setError(null)
    try {
      const res = await start.mutateAsync({})
      const url = res?.url
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start Patreon linking. Please try again.',
      )
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={props.onClose} title="Link Patreon">
      <div className="space-y-4">
        {env.ENABLE_PATREON_VERIFICATION ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Link your Patreon account to grant lifetime downloads once you have at least one
              successful monthly payment.
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={props.onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={onLink} disabled={loading} isLoading={loading}>
                Open Patreon
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon!</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={props.onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
