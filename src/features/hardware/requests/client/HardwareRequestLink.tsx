import { buttonVariants } from '@/components/ui/Button'
import { env } from '@/lib/env'

interface Props {
  hardwareType: 'CPU' | 'GPU'
}

export function HardwareRequestLink(props: Props) {
  const url = new URL(env.GITHUB_REQUEST_HARDWARE_URL)
  url.searchParams.set('title', `[${props.hardwareType} Request]: `)
  url.searchParams.set(
    'problem',
    `My ${props.hardwareType} is missing from the PC compatibility report form.\n\nManufacturer: \nFull model name: `,
  )
  url.searchParams.set('proposed-solution', `Please add this ${props.hardwareType} to EmuReady.`)
  url.searchParams.set(
    'additional-context',
    'Official product page or other reliable specification source: ',
  )

  return (
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Missing your {props.hardwareType}?{' '}
      <a
        href={url.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'link', size: 'sm', className: 'h-auto p-0' })}
      >
        Request a {props.hardwareType} on GitHub
      </a>
    </p>
  )
}
