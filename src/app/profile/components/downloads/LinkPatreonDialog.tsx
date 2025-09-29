'use client'

import { useState } from 'react'
import { Modal, Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'

interface Props {
  onClose: () => void
}

const COMING_SOON = true

export default function LinkPatreonDialog(props: Props) {
  const [loading, setLoading] = useState(false)
  const start = api.entitlements.linkPatreonStart.useMutation()

  async function onLink() {
    setLoading(true)
    try {
      const res = await start.mutateAsync({})
      const url = res?.url
      if (url) window.location.href = url
    } finally {
      setLoading(false)
      props.onClose()
    }
  }

  return (
    <Modal isOpen onClose={props.onClose} title="Link Patreon">
      <div className="space-y-4">
        {COMING_SOON ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon!</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={props.onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Link your Patreon account to grant lifetime downloads once you have at least one
              successful monthly payment.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={props.onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={onLink} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Open Patreon'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
