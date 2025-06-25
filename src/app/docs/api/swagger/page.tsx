'use client'

import { useEffect, useRef } from 'react'
import useMounted from '@/hooks/useMounted'

declare global {
  interface Window {
    SwaggerUIBundle: {
      (config: {
        url: string
        domNode: HTMLElement
        deepLinking: boolean
        presets: unknown[]
        plugins: unknown[]
        layout?: string
      }): void
      presets: {
        apis: unknown
        standalone: unknown
      }
      plugins: {
        DownloadUrl: unknown
      }
    }
  }
}

export default function SwaggerUIPage() {
  const mounted = useMounted()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mounted) return
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return

    // Store the current container reference to avoid stale closure
    const container = containerRef.current

    // Load Swagger UI CSS
    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.type = 'text/css'
    cssLink.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
    document.head.appendChild(cssLink)

    // Load Swagger UI JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
    script.onload = () => {
      // Initialize Swagger UI after script loads
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: `${window.location.origin}/api/docs/api/openapi.json`,
          domNode: container,
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIBundle.presets.standalone,
          ],
          plugins: [window.SwaggerUIBundle.plugins.DownloadUrl],
        })
      }
    }
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      // Remove the added elements
      if (cssLink.parentNode) {
        document.head.removeChild(cssLink)
      }
      if (script.parentNode) {
        document.head.removeChild(script)
      }
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      <div className="bg-gray-50 dark:bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-600">
          EmuReady API Documentation (Work in Progress)
        </h1>
        <p className="text-gray-600 dark:text-gray-600 mt-1">
          Interactive API documentation for the EmuReady mobile platform and
          partners
        </p>
      </div>
      <div ref={containerRef} className="w-full pb-16" />
    </div>
  )
}
