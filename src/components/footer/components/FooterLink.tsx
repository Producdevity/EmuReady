import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'

const colorClasses = {
  blue: 'hover:text-blue-600 dark:hover:text-blue-400',
  purple: 'hover:text-purple-600 dark:hover:text-purple-400',
}

interface Props {
  href: string
  label: string
  color: keyof typeof colorClasses
  analyticsContextKey: string
}

export function FooterLink(props: Props) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit EmuReady's ${props.label}`}
      className={cn(
        'group flex items-center gap-2 text-gray-600 dark:text-gray-400 ',
        colorClasses[props.color],
        'transition-colors duration-300',
      )}
      onClick={() => {
        analytics.contentDiscovery.externalLinkClicked({
          url: props.href,
          context: props.analyticsContextKey,
        })
      }}
    >
      <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      {props.label}
    </a>
  )
}
