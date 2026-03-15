import { type Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = generatePageMetadata(
  'EmuReady API Documentation',
  'Complete API documentation for applications powered by EmuReady.',
  '/docs/api',
)

function MobileApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 mb-4">
          EmuReady API Documentation
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Complete API documentation for applications powered by EmuReady.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            📚 Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Auto-generated API reference covering all endpoints, authentication, and usage patterns.
          </p>
          <Link
            href="/docs/api/reference"
            className="inline-block rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            View Full Documentation
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            🔧 Interactive Testing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Swagger UI for testing API endpoints with live requests and responses.
          </p>
          <Link
            href="/docs/api/swagger"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Open Swagger UI
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-4">Quick Start</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Base URL</h3>
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300  px-3 py-1 rounded text-sm">
              /api/mobile/trpc/[procedure]
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Authentication</h3>
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300  px-3 py-1 rounded text-sm">
              Authorization: Bearer &lt;clerk-jwt-token&gt;
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Example Request</h3>
            <pre className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-3 rounded text-sm overflow-x-auto">
              {`curl -X POST /api/mobile/trpc/listings.get \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "page": 1,
    "limit": 20,
    "search": "mario"
  }'`}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Available Resources
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-green-600 mb-2">📄 OpenAPI Spec</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              API specification - automatically generated
            </p>
            <Link
              href="/api-docs/mobile-openapi.json"
              target="_blank"
              className="text-blue-500 hover:underline text-sm"
            >
              Download OpenAPI JSON
            </Link>
          </div>

          <div>
            <h3 className="font-semibold text-blue-600 mb-2">🔍 Endpoints</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              all endpoints across all routers that EmuReady uses for the mobile app are available.
            </p>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Generous rate limits for public and protected endpoints
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-purple-600 mb-2">🚀 TRPC</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Type-safe API with automatic validation
            </p>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Full TypeScript support
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Features</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Note that some features may be in development, or require an API Key:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                CRUD operations for most resources
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Advanced filtering & search
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Real-time notifications
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                User preference management
              </span>
            </li>
          </ul>

          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Pagination & filtering
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Authentication & authorization
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Consistent error handling
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Reasonable rate limits
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MobileApiDocsPage
