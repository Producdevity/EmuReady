import { type ReactNode } from 'react'
import { type ExternalToast, toast as sonnerToast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

const DEFAULT_TOAST_OPTIONS: ExternalToast = {
  duration: 3000,
}

interface ToastOptions {
  duration?: number
  description?: ReactNode
}

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'message'

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  message: null,
}

type ToastTitle = (() => ReactNode) | ReactNode

const toastMap: Record<
  ToastType,
  (message: ToastTitle, options?: ExternalToast) => void
> = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
  message: sonnerToast,
}

const show = (type: ToastType, message: ReactNode, options?: ToastOptions) => {
  const finalOptions: ExternalToast = {
    ...DEFAULT_TOAST_OPTIONS,
    ...options,
    icon: iconMap[type],
  }

  const toastFunction = toastMap[type] || sonnerToast

  return toastFunction(message, finalOptions)
}

const toast = {
  success: (message: ReactNode, options?: ToastOptions) => {
    show('success', message, options)
  },
  error: (message: ReactNode, options?: ToastOptions) => {
    show('error', message, options)
  },
  warning: (message: ReactNode, options?: ToastOptions) => {
    show('warning', message, options)
  },
  info: (message: ReactNode, options?: ToastOptions) => {
    show('info', message, options)
  },
  message: (message: ReactNode, options?: ToastOptions) => {
    show('message', message, options)
  },
}

/**
 * @docs
 * Example of how to use custom styling if richColors is not enough:
 *
 * @example
 * ```tsx
 * const showCustomErrorToast = (message: string) => {
 *   sonnerToast.custom((t) => (
 *     <div style={{ padding: '10px', background: 'red', color: 'white' }}>
 *       {message}
 *       <button onClick={() => sonnerToast.dismiss(t)}>Close</button>
 *     </div>
 *   ), { duration: 5000 });
 * };
 * ```
 */
export default toast
