'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import { useTheme } from 'next-themes'
import { LoadingSpinner } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import '@scalar/api-reference-react/style.css'

const url = '/api-docs/mobile-openapi.json'

export default function SwaggerUIPage() {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner text="Loading API documentation..." />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen">
      <ApiReferenceReact
        configuration={{
          url,
          theme: resolvedTheme === 'dark' ? 'purple' : 'default',
          layout: 'modern',
          hideModels: false,
          authentication: { preferredSecurityScheme: 'ClerkAuth' },
          servers: [
            {
              url:
                typeof window !== 'undefined'
                  ? `${window.location.origin}/api/mobile/trpc`
                  : '/api/mobile/trpc',
              description: 'Mobile API Base URL',
            },
          ],
          customCss: `
            .references-layout {
              font-family: inherit;
            }
          `,
        }}
      />
    </div>
  )
}
