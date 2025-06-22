'use client'

import { useEffect, useRef } from 'react'

export default function SwaggerUIPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return

    // Store the current container reference to avoid stale closure
    const container = containerRef.current

    // Create the Swagger UI HTML content
    const swaggerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EmuReady Mobile API Documentation</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
          <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
          <script>
            window.onload = function() {
              SwaggerUIBundle({
                url: '${window.location.origin}/api/docs/mobile/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.presets.standalone
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
      </html>
    `

    // Create a blob URL for the HTML content
    const blob = new Blob([swaggerHTML], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)

    // Create and configure the iframe
    const iframe = document.createElement('iframe')
    iframe.src = blobUrl
    iframe.style.width = '100%'
    iframe.style.height = 'calc(100vh - 100px)'
    iframe.style.border = 'none'
    iframe.title = 'EmuReady Mobile API Documentation'

    // Add iframe to container
    container.appendChild(iframe)

    // Cleanup function
    return () => {
      URL.revokeObjectURL(blobUrl)
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          EmuReady Mobile API Documentation
        </h1>
        <p className="text-gray-600 mt-1">
          Interactive API documentation for the EmuReady mobile platform
        </p>
      </div>
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 'calc(100vh - 100px)' }}
      />
    </div>
  )
}
