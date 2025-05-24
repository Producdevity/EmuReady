import { type ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Legacy types for backward compatibility
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

// Extended shadcn variants with legacy mappings
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // shadcn variants
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',

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
}

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> &
  LegacyProps & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  isFullWidth = false,
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
        isFullWidth && 'w-full',
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export default Button
