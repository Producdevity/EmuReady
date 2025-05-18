'use client'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

function LoadingSpinner(props: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg
        className={`animate-spin ${sizeClasses[props.size ?? 'md']}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <defs>
          <linearGradient
            id="spinnerGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
            <stop offset="50%" stopColor="#6366f1" /> {/* indigo-500 */}
            <stop offset="100%" stopColor="#a855f7" /> {/* purple-500 */}
          </linearGradient>
        </defs>

        {/* background ring, low-opacity */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="url(#spinnerGradient)"
          strokeWidth="4"
          fill="none"
        />

        {/* rotating arc, same radius */}
        <circle
          className="opacity-75"
          cx="12"
          cy="12"
          r="10"
          stroke="url(#spinnerGradient)"
          strokeWidth="4"
          fill="none"
          strokeDasharray="15.7 62.8"
          strokeLinecap="round"
        />
      </svg>

      {props.text && (
        <p className="mt-3 text-gray-500 dark:text-gray-400">{props.text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
