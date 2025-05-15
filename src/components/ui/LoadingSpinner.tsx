'use client'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

function LoadingSpinner(props: Props) {
  const defaultColor = 'text-blue-500'
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg
        className={`animate-spin ${sizeClasses[props.size ?? 'md']} ${props.color ?? defaultColor}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" />
        <path className="opacity-75" d="M4 12a8 8 0 1 1 16 0A8 8 0 0 1 4 12z" />
      </svg>
      {props.text && (
        <p className="mt-3 text-gray-500 dark:text-gray-400">{props.text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
