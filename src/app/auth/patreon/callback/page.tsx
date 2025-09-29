'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner, Card, Button } from '@/components/ui'
import { api } from '@/lib/api'

function PatreonCallbackClient() {
  const search = useSearchParams()
  const router = useRouter()
  const code = search.get('code')
  const state = search.get('state')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState<string>('Finishing Patreon linking…')
  const mutate = api.entitlements.linkPatreonCallback.useMutation()

  useEffect(() => {
    if (!code || !state) {
      setStatus('error')
      setMessage('Missing code or state')
      return
    }
    mutate
      .mutateAsync({ code, state })
      .then((res) => {
        if (res && res.ok) {
          setStatus('success')
          setMessage('Patreon linked. You now have lifetime downloads!')
          setTimeout(() => router.replace('/profile?tab=downloads'), 1200)
        } else {
          setStatus('error')
          setMessage(res?.message ?? 'Patreon linking failed.')
        }
      })
      .catch((err) => {
        console.error(err)
        setStatus('error')
        setMessage('Patreon linking failed.')
      })
  }, [code, state, mutate, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {status === 'pending' && (
          <>
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}
        {status !== 'pending' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            <div className="pt-2">
              <Button onClick={() => router.replace('/profile?tab=downloads')}>
                Go to Downloads
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default function PatreonCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Finishing Patreon linking…</p>
          </Card>
        </div>
      }
    >
      <PatreonCallbackClient />
    </Suspense>
  )
}
