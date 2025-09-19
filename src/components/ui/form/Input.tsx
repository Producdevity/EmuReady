import { ChevronDown } from 'lucide-react'
import {
  forwardRef,
  type ReactNode,
  type Ref,
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
  inputClassName?: string
  containerClassName?: string
  as?: InputAs
}

type Props = BaseInputProps &
  ({ as?: 'input' } | { as: 'select'; children?: ReactNode } | { as: 'textarea'; rows?: number })

export const Input = forwardRef<HTMLElement, Props>(
  (
    {
      leftIcon,
      rightIcon,
      inputClassName,
      className,
      containerClassName,
      as = 'input',
      children,
      ...restProps
    },
    ref,
  ) => {
    const commonInputStyling =
      'w-full outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent'

    const trailingIcon =
      as === 'select' && !rightIcon ? <ChevronDown className="w-4 h-4" /> : rightIcon

    let control: ReactNode

    if (as === 'input') {
      const { type, ...inputProps } = restProps as InputHTMLAttributes<HTMLInputElement>
      control = (
        <input
          ref={ref as Ref<HTMLInputElement>}
          type={type ?? 'text'}
          className={cn(
            commonInputStyling,
            'py-2 px-3',
            leftIcon ? 'pl-10' : '',
            trailingIcon ? 'pr-10' : '',
            inputClassName,
          )}
          {...inputProps}
        />
      )
    } else if (as === 'select') {
      control = (
        <select
          ref={ref as Ref<HTMLSelectElement>}
          className={cn(
            commonInputStyling,
            'appearance-none cursor-pointer',
            'py-2 px-3',
            leftIcon ? 'pl-10' : '',
            trailingIcon ? 'pr-10' : '',
            inputClassName,
          )}
          {...(restProps as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {children}
        </select>
      )
    } else {
      control = (
        <textarea
          ref={ref as Ref<HTMLTextAreaElement>}
          className={cn(
            commonInputStyling,
            'py-2 px-3 resize-vertical',
            leftIcon ? 'pl-10' : '',
            trailingIcon ? 'pr-10' : '',
            inputClassName,
          )}
          {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      )
    }

    return (
      <div className={cn('relative', containerClassName)}>
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
          {control}
          {trailingIcon && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
              {trailingIcon}
            </span>
          )}
        </div>
      </div>
    )
  },
)

Input.displayName = 'Input'
