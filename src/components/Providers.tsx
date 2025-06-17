'use client'

import { type PropsWithChildren, type ReactNode } from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { TRPCProvider } from '@/lib/api'
import { RECAPTCHA_CONFIG, isCaptchaEnabled } from '@/lib/captcha/config'
import ThemeProvider from './ThemeProvider'
import { ConfirmDialogProvider } from './ui'

function Providers(props: PropsWithChildren) {
  const recaptchaWrapper = (children: ReactNode) => {
    return !isCaptchaEnabled() ? (
      <>{children}</>
    ) : (
      <GoogleReCaptchaProvider
        reCaptchaKey={RECAPTCHA_CONFIG.siteKey}
        scriptProps={{
          async: false,
          defer: false,
          appendTo: 'head',
          nonce: undefined,
        }}
      >
        {children}
      </GoogleReCaptchaProvider>
    )
  }

  return (
    <TRPCProvider>
      <ThemeProvider>
        <ConfirmDialogProvider>
          {recaptchaWrapper(props.children)}
        </ConfirmDialogProvider>
      </ThemeProvider>
    </TRPCProvider>
  )
}

export default Providers
