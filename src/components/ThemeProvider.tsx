'use client'

import { type PropsWithChildren } from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import storageKeys from '@/data/storageKeys'

function ThemeProvider(props: PropsWithChildren) {
  return (
    <NextThemeProvider
      storageKey={storageKeys.theme}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {props.children}
    </NextThemeProvider>
  )
}

export default ThemeProvider
