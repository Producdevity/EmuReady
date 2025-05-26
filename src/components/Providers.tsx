'use client'

import { SessionProvider } from 'next-auth/react'
import { type PropsWithChildren } from 'react'
import { TRPCProvider } from '@/lib/api'
import ThemeProvider from './ThemeProvider'
import { ConfirmDialogProvider } from './ui'

function Providers(props: PropsWithChildren) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <ThemeProvider>
          <ConfirmDialogProvider>{props.children}</ConfirmDialogProvider>
        </ThemeProvider>
      </SessionProvider>
    </TRPCProvider>
  )
}

export default Providers
