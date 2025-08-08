'use client'

import { useTheme } from 'next-themes'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { LoadingSpinner, Button } from '@/components/ui'
import useMounted from '@/hooks/useMounted'

import '@scalar/api-reference-react/style.css'

// Lazy load the heavy Swagger UI component
const ApiReferenceReact = lazy(() =>
  import('@scalar/api-reference-react').then((mod) => ({
    default: mod.ApiReferenceReact,
  })),
)

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
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-red-600">
                Failed to load API documentation
              </h2>
              <p className="text-gray-600">Error: {error.message}</p>
              <Button onClick={resetErrorBoundary}>Try Again</Button>
            </div>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <LoadingSpinner text="Loading API documentation..." />
              </div>
            </div>
          }
        >
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
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
