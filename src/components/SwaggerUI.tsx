'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

interface SwaggerUIProps {
  url?: string
  spec?: unknown
  onComplete?: () => void
}

interface ApiSpec {
  info?: {
    title?: string
    description?: string
    version?: string
  }
  paths?: Record<
    string,
    Record<
      string,
      {
        summary?: string
        description?: string
        tags?: string[]
        parameters?: Array<{
          name: string
          in: string
          required: boolean
          schema: Record<string, unknown>
          description?: string
        }>
        requestBody?: {
          required?: boolean
          content?: {
            'application/json'?: {
              schema?: Record<string, unknown>
            }
          }
        }
        security?: Array<Record<string, unknown>>
      }
    >
  >
}

// Dynamically import SwaggerUI to avoid SSR issues
const DynamicSwaggerUI = dynamic(
  async () => {
    // Create a custom Swagger UI viewer since swagger-ui-react has React 19 compatibility issues
    const SwaggerUIFallback = ({ url, spec }: SwaggerUIProps) => {
      const [apiSpec, setApiSpec] = useState<ApiSpec | null>(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)

      useEffect(() => {
        async function loadSpec() {
          try {
            if (spec) {
              setApiSpec(spec as ApiSpec)
            } else if (url) {
              const response = await fetch(url)
              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`,
                )
              }
              const data = await response.json()
              setApiSpec(data)
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'Failed to load API specification',
            )
          } finally {
            setLoading(false)
          }
        }

        loadSpec()
      }, [url, spec])

      if (loading) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading API documentation...
              </p>
            </div>
          </div>
        )
      }

      if (error) {
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Failed to Load API Documentation
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <div className="mt-4">
              <a
                href="/api-docs/mobile-openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                View Raw OpenAPI JSON
              </a>
            </div>
          </div>
        )
      }

      if (!apiSpec) {
        return (
          <div className="text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">
              No API specification available
            </p>
          </div>
        )
      }

      return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {apiSpec.info?.title || 'API Documentation'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {apiSpec.info?.description || 'API documentation'}
            </p>
            <div className="flex gap-4 text-sm">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Version: {apiSpec.info?.version || '1.0.0'}
              </span>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                {Object.keys(apiSpec.paths || {}).length} endpoints
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Available Endpoints
              </h2>
              <div className="space-y-4">
                {Object.entries(apiSpec.paths || {}).map(([path, methods]) => (
                  <div
                    key={path}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="font-mono text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      {path}
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(methods).map(([method, operation]) => (
                        <div key={method} className="flex items-start gap-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium uppercase ${
                              method === 'get'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : method === 'post'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : method === 'put'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {method}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {operation.summary || 'No summary'}
                            </p>
                            {operation.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {operation.description}
                              </p>
                            )}
                            {operation.tags && operation.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {operation.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Display Parameters */}
                            {operation.parameters &&
                              operation.parameters.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Parameters:
                                  </h4>
                                  <div className="space-y-1">
                                    {operation.parameters.map((param) => (
                                      <div key={param.name} className="text-xs">
                                        <span className="font-mono text-blue-600 dark:text-blue-400">
                                          {param.name}
                                        </span>
                                        <span className="text-gray-500 mx-1">
                                          ({String(param.schema.type)}
                                          {param.schema.format
                                            ? `:${param.schema.format}`
                                            : ''}
                                          )
                                        </span>
                                        {param.required && (
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        )}
                                        {param.description && (
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {' '}
                                            - {param.description}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Display Request Body */}
                            {operation.requestBody && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Request Body:
                                </h4>
                                <div className="text-xs">
                                  {operation.requestBody.required && (
                                    <span className="text-red-500">
                                      Required
                                    </span>
                                  )}
                                  {operation.requestBody.content?.[
                                    'application/json'
                                  ]?.schema && (
                                    <div className="mt-1">
                                      {(() => {
                                        const schema =
                                          operation.requestBody.content[
                                            'application/json'
                                          ].schema

                                        // Handle $ref definitions
                                        if (schema.$ref && schema.definitions) {
                                          const refName = (
                                            schema.$ref as string
                                          )
                                            .split('/')
                                            .pop()
                                          const definition = refName
                                            ? (
                                                schema.definitions as Record<
                                                  string,
                                                  Record<string, unknown>
                                                >
                                              )[refName]
                                            : null

                                          if (definition?.properties) {
                                            return (
                                              <div className="space-y-1">
                                                {Object.entries(
                                                  definition.properties as Record<
                                                    string,
                                                    Record<string, unknown>
                                                  >,
                                                ).map(
                                                  ([propName, propSchema]) => (
                                                    <div key={propName}>
                                                      <span className="font-mono text-green-600 dark:text-green-400">
                                                        {propName}
                                                      </span>
                                                      <span className="text-gray-500 mx-1">
                                                        (
                                                        {String(
                                                          propSchema.type,
                                                        )}
                                                        {propSchema.format
                                                          ? `:${propSchema.format}`
                                                          : ''}
                                                        )
                                                      </span>
                                                      {(
                                                        definition.required as
                                                          | string[]
                                                          | undefined
                                                      )?.includes(propName) && (
                                                        <span className="text-red-500">
                                                          *
                                                        </span>
                                                      )}
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            )
                                          }
                                        }

                                        // Handle direct properties
                                        if (schema.properties) {
                                          return (
                                            <div className="space-y-1">
                                              {Object.entries(
                                                schema.properties as Record<
                                                  string,
                                                  Record<string, unknown>
                                                >,
                                              ).map(
                                                ([propName, propSchema]) => (
                                                  <div key={propName}>
                                                    <span className="font-mono text-green-600 dark:text-green-400">
                                                      {propName}
                                                    </span>
                                                    <span className="text-gray-500 mx-1">
                                                      ({String(propSchema.type)}
                                                      {propSchema.format
                                                        ? `:${propSchema.format}`
                                                        : ''}
                                                      )
                                                    </span>
                                                    {(
                                                      schema.required as string[]
                                                    )?.includes(propName) && (
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    )}
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          )
                                        }

                                        return (
                                          <span className="text-gray-500">
                                            JSON object
                                          </span>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Display Security */}
                            {operation.security &&
                              operation.security.length > 0 && (
                                <div className="mt-3">
                                  <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs">
                                    🔒 Authentication Required
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Resources
              </h3>
              <div className="space-y-2">
                <a
                  href="/api-docs/mobile-openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📄 Download OpenAPI JSON
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    SwaggerUIFallback.displayName = 'SwaggerUIFallback'
    return SwaggerUIFallback
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading Swagger UI...
          </p>
        </div>
      </div>
    ),
  },
)

interface Props {
  spec?: unknown
  url?: string
}

export default function SwaggerUI(props: Props) {
  return (
    <div className="w-full">
      <DynamicSwaggerUI
        {...{
          url: props.url || '/api-docs/mobile-openapi.json',
          spec: props.spec,
          onComplete: () => {
            console.log('Swagger UI loaded successfully')
          },
        }}
      />
    </div>
  )
}
