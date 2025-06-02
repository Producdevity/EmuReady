'use client'

import { type PropsWithChildren } from 'react'
import { TRPCProvider } from '@/lib/api'
import ThemeProvider from './ThemeProvider'
import { ConfirmDialogProvider } from './ui'

function Providers(props: PropsWithChildren) {
  return (
    <TRPCProvider>
      <ThemeProvider>
        <ConfirmDialogProvider>{props.children}</ConfirmDialogProvider>
      </ThemeProvider>
    </TRPCProvider>
  )
}

export default Providers
