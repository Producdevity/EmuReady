'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { TRPCProvider } from '@/lib/api'
import ThemeProvider from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </SessionProvider>
    </TRPCProvider>
  )
}
