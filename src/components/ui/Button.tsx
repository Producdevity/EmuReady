import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentProps } from 'react'
import { LoadingIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

// Legacy types for backward compatibility
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'fancy'
  | 'primary'
  | 'danger'

// Extended shadcn variants with legacy mappings
export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors transition-shadow duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden",
  {
    variants: {
      variant: {
        // shadcn variants
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-transparent backdrop-blur-sm shadow-xs hover:bg-white/10 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',

        fancy:
          'px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl bg-[length:200%_200%] hover:animate-gradient-x',

        // Legacy variants mapped to modern design tokens
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
      },
      size: {
        // shadcn sizes
        default: 'h-9 px-4 py-2 text-base has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 text-base has-[>svg]:px-4',
        icon: 'size-9',

        // Legacy sizes mapped
        md: 'h-9 px-4 py-2 text-base has-[>svg]:px-3', // maps to default height but with base text
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Legacy Props interface for backward compatibility
interface LegacyProps {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  isFullWidth?: boolean
  rounded?: boolean
}

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> &
  LegacyProps & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  isFullWidth = false,
  rounded,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  // Map legacy 'md' size to 'default' for shadcn compatibility
  const mappedSize = size === 'md' ? 'default' : size

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size: mappedSize, className }),
        rounded && 'rounded-xl',
        isFullWidth && 'w-full',
        (isLoading || disabled) && 'cursor-not-allowed',
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      <span className="flex items-center gap-2">
        {isLoading ? (
          variant === 'ghost' ? (
            <LoadingIcon />
          ) : (
            <>
              <LoadingIcon />
              <span>Loading...</span>
            </>
          )
        ) : (
          children
        )}
      </span>
    </Comp>
  )
}
