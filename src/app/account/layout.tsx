import { type Metadata } from 'next'
import type { PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Account Management - EmuReady',
  description: 'Manage your EmuReady account settings, privacy, and data.',
  robots: 'noindex, nofollow',
}

export default function AccountLayout(props: PropsWithChildren) {
  return <>{props.children}</>
}
