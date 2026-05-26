'use client'

import Script from 'next/script'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { env } from '@/lib/env'
import { type HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

type TurnstileWidgetId = string

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => TurnstileWidgetId | undefined
  remove: (widgetId: TurnstileWidgetId) => void
  reset: (widgetId: TurnstileWidgetId) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface VerificationRequest {
  action: typeof HUMAN_VERIFICATION_ACTION
}

type RequestVerification = (request: VerificationRequest) => Promise<string>
type ScriptStatus = 'idle' | 'ready' | 'failed'

const HumanVerificationContext = createContext<RequestVerification | null>(null)

interface PendingRequest {
  action: typeof HUMAN_VERIFICATION_ACTION
  resolve: (token: string) => void
  reject: (error: Error) => void
}

export function HumanVerificationProvider(props: PropsWithChildren) {
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>('idle')
  const widgetContainerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null)
  const pendingRequestRef = useRef<PendingRequest | null>(null)
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY

  const requestVerification = useCallback<RequestVerification>(
    (request) => {
      if (!turnstileSiteKey) {
        return Promise.reject(new Error('Human verification is not configured.'))
      }

      if (scriptStatus === 'failed') {
        return Promise.reject(new Error('Human verification failed to load.'))
      }

      if (pendingRequestRef.current) {
        return Promise.reject(new Error('Human verification is already in progress.'))
      }

      return new Promise((resolve, reject) => {
        const nextRequest = { action: request.action, resolve, reject }
        pendingRequestRef.current = nextRequest
        setPendingRequest(nextRequest)
      })
    },
    [scriptStatus, turnstileSiteKey],
  )

  const closeDialog = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
    pendingRequestRef.current = null
    setPendingRequest(null)
  }, [])

  useEffect(() => {
    if (
      !pendingRequest ||
      scriptStatus !== 'ready' ||
      !widgetContainerRef.current ||
      !window.turnstile
    ) {
      return
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    const widgetId = window.turnstile.render(widgetContainerRef.current, {
      sitekey: turnstileSiteKey,
      action: pendingRequest.action,
      theme: 'auto',
      callback: (token: string) => {
        pendingRequest.resolve(token)
        closeDialog()
      },
      'error-callback': () => {
        pendingRequest.reject(new Error('Human verification failed. Please try again.'))
        closeDialog()
      },
      'expired-callback': () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
    })

    widgetIdRef.current = widgetId ?? null
  }, [closeDialog, pendingRequest, scriptStatus, turnstileSiteKey])

  const handleOpenChange = (open: boolean) => {
    if (open || !pendingRequest) return
    pendingRequest.reject(new Error('Human verification was cancelled.'))
    closeDialog()
  }

  return (
    <HumanVerificationContext.Provider value={requestVerification}>
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptStatus('ready')}
          onError={() => {
            setScriptStatus('failed')
            pendingRequestRef.current?.reject(new Error('Human verification failed to load.'))
            closeDialog()
          }}
        />
      )}
      {props.children}
      <Dialog open={!!pendingRequest} onOpenChange={handleOpenChange}>
        <DialogContent title="Human verification" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Human verification</DialogTitle>
            <DialogDescription>
              Complete this check so we can submit your content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-20 items-center justify-center">
            {scriptStatus !== 'ready' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading verification...</p>
            )}
            <div ref={widgetContainerRef} />
          </div>
        </DialogContent>
      </Dialog>
    </HumanVerificationContext.Provider>
  )
}

export function useHumanVerification() {
  const requestVerification = useContext(HumanVerificationContext)
  if (!requestVerification) {
    throw new Error('useHumanVerification must be used inside HumanVerificationProvider')
  }

  return requestVerification
}
