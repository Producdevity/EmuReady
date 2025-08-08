import { type PropsWithChildren } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testing Checklist | EmuReady',
  description: 'Interactive testing checklist for EmuReady staging environment',
  robots: 'noindex, nofollow', // Don't index testing pages
}

export default function TestingLayout(props: PropsWithChildren) {
  return props.children
}
