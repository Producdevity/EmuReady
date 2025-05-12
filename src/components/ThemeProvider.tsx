'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { type ReactNode, useEffect, useState } from 'react'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {mounted && (
        <div className="transition-colors duration-500 ease-in-out">
          <div className="dark:bg-gray-900 bg-white">{children}</div>
        </div>
      )}
      {/* Fallback for SSR */}
      {!mounted && <div className="dark:bg-gray-900 bg-white">{children}</div>}
      {/* {children} */}
    </NextThemeProvider>
  )
}
