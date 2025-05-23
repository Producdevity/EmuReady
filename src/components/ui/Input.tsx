import {
  forwardRef,
  type Ref,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { twMerge } from 'tailwind-merge'

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
    const baseClass = `w-full px-3 py-2 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl transition-all duration-200`

    return (
      <div
        className={twMerge(
          'relative flex items-center bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200',
          className,
        )}
      >
        {leftIcon && (
          <span className="pl-3 text-gray-400 dark:text-gray-500 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        {as === 'input' && (
          <input
            ref={ref as Ref<HTMLInputElement>}
            className={twMerge(
              baseClass,
              leftIcon ? 'pl-2' : '',
              rightIcon ? 'pr-10' : '',
            )}
            {...props}
          />
        )}
        {as === 'select' && (
          <select
            ref={ref as Ref<HTMLSelectElement>}
            className={twMerge(
              baseClass,
              'bg-white dark:bg-gray-800 appearance-none',
              leftIcon ? 'pl-2' : '',
              rightIcon ? 'pr-10' : '',
              className,
            )}
            {...(props as SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        )}
        {as === 'textarea' && (
          <textarea
            ref={ref as Ref<HTMLTextAreaElement>}
            className={twMerge(
              baseClass,
              leftIcon ? 'pl-2' : '',
              rightIcon ? 'pr-10' : '',
            )}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        )}
        {rightIcon && (
          <span className="absolute right-3 text-gray-400 dark:text-gray-500 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
