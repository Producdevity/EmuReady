import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  type: 'created-by-dev' | 'verified-by-dev'
  developerName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function VerifiedDeveloperBadge(props: Props) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full font-medium'

  const variantClasses = {
    'created-by-dev':
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'verified-by-dev':
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  }

  const labels = {
    'created-by-dev': 'Official Developer',
    'verified-by-dev': props.developerName
      ? `Verified by ${props.developerName}`
      : 'Developer Verified',
  }

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[props.type],
        sizeClasses[props.size ?? 'md'],
        props.className,
      )}
      title={
        props.type === 'created-by-dev'
          ? 'This listing was created by a verified developer'
          : 'This listing has been verified by a developer'
      }
    >
      <ShieldCheck className={iconSizes[props.size ?? 'md']} />
      {labels[props.type]}
    </span>
  )
}

export default VerifiedDeveloperBadge
