import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AdminNotificationBannerProps {
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  onDismiss?: () => void
  className?: string
}

function AdminNotificationBanner(props: AdminNotificationBannerProps) {
  const getVariantStyles = () => {
    switch (props.type) {
      case 'warning':
        return {
          containerClass:
            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          textClass: 'text-yellow-700 dark:text-yellow-300',
          iconClass: 'text-yellow-400',
          icon: AlertCircle,
        }
      case 'success':
        return {
          containerClass:
            'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          textClass: 'text-green-700 dark:text-green-300',
          iconClass: 'text-green-400',
          icon: CheckCircle,
        }
      case 'error':
        return {
          containerClass:
            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          textClass: 'text-red-700 dark:text-red-300',
          iconClass: 'text-red-400',
          icon: XCircle,
        }
      default:
        return {
          containerClass:
            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          textClass: 'text-blue-700 dark:text-blue-300',
          iconClass: 'text-blue-400',
          icon: Clock,
        }
    }
  }

  const variant = getVariantStyles()
  const Icon = variant.icon

  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        variant.containerClass,
        props.className,
      )}
    >
      <div className="flex items-start">
        <Icon className={cn('w-5 h-5 mr-3 mt-0.5', variant.iconClass)} />
        <div className="flex-1">
          <h3 className={cn('text-sm font-medium', variant.textClass)}>
            {props.title}
          </h3>
          <p className={cn('mt-1 text-sm', variant.textClass)}>
            {props.message}
          </p>
          {props.actionUrl && props.actionLabel && (
            <Link
              href={props.actionUrl}
              className={cn(
                'mt-2 inline-flex text-sm font-medium underline hover:no-underline',
                variant.textClass,
              )}
            >
              {props.actionLabel}
            </Link>
          )}
        </div>
        {props.onDismiss && (
          <button
            onClick={props.onDismiss}
            className={cn('ml-4 hover:opacity-75', variant.textClass)}
            aria-label="Dismiss notification"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default AdminNotificationBanner
