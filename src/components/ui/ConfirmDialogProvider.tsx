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
} from '@/components/ui/AlertDialog'

interface ConfirmDialogOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>

const ConfirmDialogContext = createContext<ConfirmFn>(() =>
  Promise.resolve(false),
)

function ConfirmDialogProvider(props: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions>({})
  const resolveRef = useRef<(result: boolean) => void>(() => {})

  const confirm: ConfirmFn = useCallback((opts) => {
    setOptions(opts)
    setOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(false)
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(true)
  }, [])

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {props.children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent title={options.title ?? 'Are you sure?'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {options.title ?? 'Are you sure?'}
            </AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
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

export default ConfirmDialogProvider
