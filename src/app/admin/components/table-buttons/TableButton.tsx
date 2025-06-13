import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { isString } from 'remeda'
import {
  Button,
  type ButtonProps,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import { type XOR } from '@/types/utils'

const colorClassMap = {
  blue: 'text-blue-600 border-blue-400 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-700/20',
  gray: 'text-gray-600 border-gray-400 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-500 dark:hover:bg-gray-700/20',
  green:
    'text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20',
  purple:
    'text-purple-600 border-purple-400 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-500 dark:hover:bg-purple-700/20',
  red: 'text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20',
  yellow:
    'text-yellow-600 border-yellow-400 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-500 dark:hover:bg-yellow-700/20',
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
function TableButton(props: Props) {
  const buttonProps: ButtonProps = {
    size: 'sm' as const,
    variant: 'ghost' as const,
    name: props.title,
    className: colorClassMap[props.color],
    isLoading: props.isLoading,
    disabled: props.disabled,
  }

  const common = (
    <Button
      {...buttonProps}
      {...('onClick' in props ? { onClick: props.onClick } : {})}
    >
      <props.icon className="h-4 w-4" />
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {'href' in props && isString(props.href) ? (
          <Link href={props.href} title={props.title}>
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

export default TableButton
