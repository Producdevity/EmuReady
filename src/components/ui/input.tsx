import React from 'react'

export type InputAs = 'input' | 'select' | 'textarea'

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  as?: InputAs
}

type InputProps = BaseInputProps &
  (
    | { as?: 'input' }
    | { as: 'select'; children?: React.ReactNode }
    | { as: 'textarea'; rows?: number }
  )

export const Input = React.forwardRef<HTMLElement, InputProps>(
  (
    { leftIcon, rightIcon, className = '', as = 'input', children, ...props },
    ref,
  ) => {
    const baseClass = `w-full px-3 py-2 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl transition-all duration-200`
    return (
      <div
        className={`relative flex items-center bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200 ${className}`}
      >
        {leftIcon && (
          <span className="pl-3 text-gray-400 dark:text-gray-500 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        {as === 'input' && (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={`${baseClass} ${leftIcon ? 'pl-2' : ''} ${rightIcon ? 'pr-10' : ''}`}
            {...props}
          />
        )}
        {as === 'select' && (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            className={`${baseClass} ${leftIcon ? 'pl-2' : ''} ${rightIcon ? 'pr-10' : ''}`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        )}
        {as === 'textarea' && (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${baseClass} ${leftIcon ? 'pl-2' : ''} ${rightIcon ? 'pr-10' : ''}`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
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
