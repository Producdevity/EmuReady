import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { isString } from 'remeda'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type XOR } from '@/types/utils'

const colorClassMap = {
  blue: {
    base: 'bg-gradient-to-br from-blue-500/8 to-indigo-500/8 dark:from-blue-400/15 dark:to-indigo-400/15 border border-blue-200/40 dark:border-blue-500/30 hover:border-blue-300/60 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/25 dark:hover:shadow-blue-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-blue-500/15 hover:to-indigo-500/15',
    icon: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 drop-shadow-sm',
    glow: 'group-hover:bg-blue-500/10 dark:group-hover:bg-blue-400/15',
  },
  gray: {
    base: 'bg-gradient-to-br from-gray-500/8 to-slate-500/8 dark:from-gray-400/15 dark:to-slate-400/15 border border-gray-200/40 dark:border-gray-500/30 hover:border-gray-300/60 dark:hover:border-gray-400/50 hover:shadow-xl hover:shadow-gray-500/25 dark:hover:shadow-gray-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-gray-500/15 hover:to-slate-500/15',
    icon: 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 drop-shadow-sm',
    glow: 'group-hover:bg-gray-500/10 dark:group-hover:bg-gray-400/15',
  },
  green: {
    base: 'bg-gradient-to-br from-green-500/8 to-emerald-500/8 dark:from-green-400/15 dark:to-emerald-400/15 border border-green-200/40 dark:border-green-500/30 hover:border-green-300/60 dark:hover:border-green-400/50 hover:shadow-xl hover:shadow-green-500/25 dark:hover:shadow-green-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-green-500/15 hover:to-emerald-500/15',
    icon: 'text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 drop-shadow-sm',
    glow: 'group-hover:bg-green-500/10 dark:group-hover:bg-green-400/15',
  },
  purple: {
    base: 'bg-gradient-to-br from-purple-500/8 to-violet-500/8 dark:from-purple-400/15 dark:to-violet-400/15 border border-purple-200/40 dark:border-purple-500/30 hover:border-purple-300/60 dark:hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/25 dark:hover:shadow-purple-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-500/15 hover:to-violet-500/15',
    icon: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 drop-shadow-sm',
    glow: 'group-hover:bg-purple-500/10 dark:group-hover:bg-purple-400/15',
  },
  red: {
    base: 'bg-gradient-to-br from-red-500/8 to-rose-500/8 dark:from-red-400/15 dark:to-rose-400/15 border border-red-200/40 dark:border-red-500/30 hover:border-red-300/60 dark:hover:border-red-400/50 hover:shadow-xl hover:shadow-red-500/25 dark:hover:shadow-red-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-red-500/15 hover:to-rose-500/15',
    icon: 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 drop-shadow-sm',
    glow: 'group-hover:bg-red-500/10 dark:group-hover:bg-red-400/15',
  },
  yellow: {
    base: 'bg-gradient-to-br from-yellow-500/8 to-amber-500/8 dark:from-yellow-400/15 dark:to-amber-400/15 border border-yellow-200/40 dark:border-yellow-500/30 hover:border-yellow-300/60 dark:hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/25 dark:hover:shadow-yellow-400/20 backdrop-blur-sm hover:bg-gradient-to-br hover:from-yellow-500/15 hover:to-amber-500/15',
    icon: 'text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 drop-shadow-sm',
    glow: 'group-hover:bg-yellow-500/10 dark:group-hover:bg-yellow-400/15',
  },
}

interface CommonProps {
  title: string
  icon: LucideIcon
  color: keyof typeof colorClassMap
  isLoading?: boolean
  disabled?: boolean
}

interface LinkBehavior {
  href: string
  onClick?: never
}

interface ClickBehavior {
  onClick: () => void
  href?: never
}

type Props = XOR<LinkBehavior, ClickBehavior> & CommonProps

export type TableButtonWrapperProps =
  | {
      onClick: () => void
      href?: never
      title: string
      isLoading?: boolean
      disabled?: boolean
    }
  | {
      href: string
      onClick?: never
      title: string
      isLoading?: boolean
      disabled?: boolean
    }

/**
 * TableButton is a reusable button component designed for the action buttons in tables.
 * @param props
 * @constructor
 */
export function TableButton(props: Props) {
  const colorClass = colorClassMap[props.color]

  const buttonClasses = cn(
    'group relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0',
    colorClass.base,
    {
      'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0':
        props.disabled,
      'cursor-wait': props.isLoading,
    },
  )

  const common = (
    <button
      type="button"
      aria-label={props.title}
      className={buttonClasses}
      disabled={props.disabled || props.isLoading}
      title={props.title}
      {...('onClick' in props ? { onClick: props.onClick } : {})}
    >
      <props.icon
        className={cn(
          'w-4 h-4 transition-all duration-300 relative z-10',
          colorClass.icon,
        )}
      />
      <div
        className={cn(
          'absolute inset-0 rounded-xl transition-all duration-300 opacity-0',
          colorClass.glow,
        )}
      />
      <div className="absolute inset-0 rounded-xl bg-white/5 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {'href' in props && isString(props.href) ? (
          <Link href={props.href} className="inline-block">
            {common}
          </Link>
        ) : (
          common
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{props.title}</TooltipContent>
    </Tooltip>
  )
}
