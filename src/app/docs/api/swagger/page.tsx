import SwaggerUI from '@/components/SwaggerUI'

export default function SwaggerUIPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          EmuReady Mobile API Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interactive API documentation for the EmuReady mobile platform -
          automatically generated from router definitions
        </p>
      </div>
      <div className="container mx-auto px-4 py-6">
        <SwaggerUI url="/api-docs/mobile-openapi.json" />
      </div>
    </div>
  )
}
