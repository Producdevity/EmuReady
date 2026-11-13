'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { LoadingSpinner, Card, Button } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import { ms } from '@/utils/time'

function PatreonCallbackClient() {
  const search = useSearchParams()
  const code = search.get('code')
  const state = search.get('state')
  return <PatreonAttempt key={JSON.stringify([code, state])} code={code} state={state} />
}

interface Props {
  code: string | null
  state: string | null
}

function PatreonAttempt(props: Props) {
  const router = useRouter()
  const isMounted = useMounted()
  const [wasCodeUsed] = useState(() =>
    Boolean(
      props.code &&
        typeof window !== 'undefined' &&
        window.sessionStorage.getItem(`patreon_oauth_code:${props.code}`),
    ),
  )
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState<string>('Finishing Patreon linking…')
  const mutate = api.entitlements.linkPatreonCallback.useMutation()
  const startedRef = useRef(false)

  const invalidMessage =
    !props.code || !props.state
      ? 'Missing code or state'
      : wasCodeUsed
        ? 'This authorization code was already used. Please start the link again.'
        : null
  const displayStatus = isMounted && invalidMessage ? 'error' : status
  const displayMessage = isMounted && invalidMessage ? invalidMessage : message

  useEffect(() => {
    if (startedRef.current || !props.code || !props.state || wasCodeUsed) return
    // OAuth authorization codes can be redeemed only once.
    window.sessionStorage.setItem(`patreon_oauth_code:${props.code}`, '1')
    startedRef.current = true

    mutate
      .mutateAsync({ code: props.code, state: props.state })
      .then((res) => {
        if (res && res.ok) {
          setStatus('success')
          setMessage('Patreon linked. You now have lifetime downloads!')
        } else {
          setStatus('error')
          setMessage(res?.message ?? 'Patreon linking failed.')
        }
      })
      .catch((error: unknown) => {
        console.error(error)
        setStatus('error')
        setMessage(getErrorMessage(error, 'Patreon linking failed.'))
      })
  }, [props.code, props.state, wasCodeUsed, mutate])

  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => router.replace('/profile?tab=downloads'), ms.seconds(2))
    return () => clearTimeout(timer)
  }, [router, status])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {displayStatus === 'pending' && (
          <>
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{displayMessage}</p>
          </>
        )}
        {displayStatus !== 'pending' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">{displayMessage}</p>
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
