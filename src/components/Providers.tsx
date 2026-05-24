'use client'

import { type PropsWithChildren } from 'react'
import { HumanVerificationProvider } from '@/features/human-verification/client'
import { TRPCProvider } from '@/lib/api'
import ThemeProvider from './ThemeProvider'
import { ConfirmDialogProvider } from './ui'

function Providers(props: PropsWithChildren) {
  return (
    <TRPCProvider>
      <ThemeProvider>
        <ConfirmDialogProvider>
          <HumanVerificationProvider>{props.children}</HumanVerificationProvider>
        </ConfirmDialogProvider>
      </ThemeProvider>
    </TRPCProvider>
  )
}

export default Providers
