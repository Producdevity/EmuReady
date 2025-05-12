'use client'

import { SessionProvider } from 'next-auth/react'
import { type PropsWithChildren } from 'react'
import { TRPCProvider } from '@/lib/api'
import ThemeProvider from './ThemeProvider'

function Providers(props: PropsWithChildren) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <ThemeProvider>{props.children}</ThemeProvider>
      </SessionProvider>
    </TRPCProvider>
  )
}

export default Providers
