'use client'

import storageKeys from '@/data/storageKeys'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { type PropsWithChildren } from 'react'

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
