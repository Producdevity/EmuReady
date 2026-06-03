'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { type ButtonVariant } from './Button'

interface ConfirmDialogDetail {
  label: string
  value: string
  tone?: 'default' | 'danger'
}

interface ConfirmDialogOptions {
  title?: string
  description?: string
  details?: ConfirmDialogDetail[]
  confirmText?: string
  cancelText?: string
  confirmVariant?: ButtonVariant
}

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>

const ConfirmDialogContext = createContext<ConfirmFn>(() => Promise.resolve(false))

export function ConfirmDialogProvider(props: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions>({})
  const resolveRef = useRef<((result: boolean) => void) | null>(null)

  const resolveDialog = useCallback((result: boolean) => {
    const resolve = resolveRef.current
    resolveRef.current = null
    resolve?.(result)
  }, [])

  const confirm: ConfirmFn = useCallback(
    (opts) => {
      resolveDialog(false)
      setOptions(opts)
      setOpen(true)
      return new Promise((resolve) => {
        resolveRef.current = resolve
      })
    },
    [resolveDialog],
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) resolveDialog(false)
    },
    [resolveDialog],
  )

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveDialog(false)
  }, [resolveDialog])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveDialog(true)
  }, [resolveDialog])

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {props.children}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent title={options.title ?? 'Are you sure?'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title ?? 'Are you sure?'}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {options.details && options.details.length > 0 && (
            <dl className="grid gap-2 rounded-md border bg-gray-50 p-3 text-sm dark:bg-gray-900/40">
              {options.details.map((detail, index) => (
                <div
                  key={`${detail.label}-${index}`}
                  className="grid gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="text-gray-600 dark:text-gray-400">{detail.label}</dt>
                  <dd
                    className={cn(
                      'min-w-0 break-words font-medium text-gray-900 sm:text-right dark:text-gray-100',
                      detail.tone === 'danger' && 'text-red-700 dark:text-red-300',
                    )}
                  >
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} variant={options.confirmVariant}>
              {options.confirmText ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  return useContext(ConfirmDialogContext)
}
