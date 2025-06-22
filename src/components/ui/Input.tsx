import { ChevronDown } from 'lucide-react'
import {
  forwardRef,
  type Ref,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export type InputAs = 'input' | 'select' | 'textarea'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  as?: InputAs
}

type Props = BaseInputProps &
  (
    | { as?: 'input' }
    | { as: 'select'; children?: ReactNode }
    | { as: 'textarea'; rows?: number }
  )

const Input = forwardRef<HTMLElement, Props>(
  (
    { leftIcon, rightIcon, className = '', as = 'input', children, ...props },
    ref,
  ) => {
    const commonInputStyling =
      'w-full outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent'

    // For select elements, we need a dropdown icon if no rightIcon is provided
    const selectRightIcon =
      as === 'select' && !rightIcon ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        rightIcon
      )

    return (
      <div className="relative">
        <div
          className={cn(
            'relative flex items-center bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200',
            className,
          )}
        >
          {leftIcon && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {leftIcon}
            </span>
          )}
          {as === 'input' && (
            <input
              ref={ref as Ref<HTMLInputElement>}
              type="text"
              className={cn(
                commonInputStyling,
                'py-2 px-3',
                leftIcon ? 'pl-10' : '',
                rightIcon ? 'pr-10' : '',
              )}
              {...props}
            />
          )}
          {as === 'select' && (
            <select
              ref={ref as Ref<HTMLSelectElement>}
              className={cn(
                commonInputStyling,
                'appearance-none cursor-pointer',
                'py-2 px-3',
                leftIcon ? 'pl-10' : '',
                selectRightIcon ? 'pr-10' : '',
              )}
              {...(props as SelectHTMLAttributes<HTMLSelectElement>)}
            >
              {children}
            </select>
          )}
          {as === 'textarea' && (
            <textarea
              ref={ref as Ref<HTMLTextAreaElement>}
              className={cn(
                commonInputStyling,
                'py-2 px-3 resize-vertical',
                leftIcon ? 'pl-10' : '',
                rightIcon ? 'pr-10' : '',
              )}
              {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          )}
          {(selectRightIcon || rightIcon) && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
              {as === 'select' ? selectRightIcon : rightIcon}
            </span>
          )}
        </div>
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
