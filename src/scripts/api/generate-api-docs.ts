#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as mobileSchemas from '@/schemas/mobile'
import * as mobileAuthSchemas from '@/schemas/mobileAuth'

interface SwaggerEndpoint {
  path: string
  method: 'get' | 'post' | 'put' | 'delete'
  summary: string
  description?: string
  tags: string[]
  parameters?: unknown[]
  requestBody?: unknown
  responses: Record<string, unknown>
  security?: unknown[]
}

interface RouterInfo {
  router: string
  procedures: {
    name: string
    type: 'query' | 'mutation'
    input?: string
    auth: 'public' | 'protected'
    description?: string
  }[]
}

function extractRouterInfo(filePath: string): RouterInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const routerName =
      filePath.split('/').pop()?.replace('.ts', '') || 'unknown'

    const procedures: RouterInfo['procedures'] = []

    // Extract procedure definitions - handle multiline patterns
    const procedureRegex =
      /(\w+):\s*(mobilePublicProcedure|mobileProtectedProcedure)\s*(?:\.input\((\w+)\))?\s*\.(query|mutation)/g
    let match

    while ((match = procedureRegex.exec(content)) !== null) {
      const [, name, authType, inputSchema, type] = match

      // Extract JSDoc comment for this procedure
      const beforeProcedure = content.substring(0, match.index)
      const lastCommentMatch = beforeProcedure.match(
        /\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\//g,
      )
      const description = lastCommentMatch
        ? lastCommentMatch[lastCommentMatch.length - 1]
            .replace(/\/\*\*\s*\n\s*\*\s*|\s*\n\s*\*\//g, '')
            .replace(/\s*\*\s*/g, ' ')
            .trim()
        : undefined

      procedures.push({
        name,
        type: type as 'query' | 'mutation',
        input: inputSchema,
        auth: authType === 'mobileProtectedProcedure' ? 'protected' : 'public',
        description,
      })
    }

    return {
      router: routerName,
      procedures,
    }
  } catch {
    console.error(`Error parsing ${filePath}`)
    return null
  }
}

function generateSwaggerEndpoints(
  routerInfos: RouterInfo[],
): SwaggerEndpoint[] {
  const endpoints: SwaggerEndpoint[] = []

  for (const routerInfo of routerInfos) {
    for (const procedure of routerInfo.procedures) {
      const method = procedure.type === 'mutation' ? 'post' : 'get'
      const path = `/api/mobile/trpc/${routerInfo.router}.${procedure.name}`

      // Get input schema if available
      let requestBody: unknown = undefined
      let parameters: unknown[] = []

      if (procedure.input) {
        const schemaName = procedure.input
        const schema =
          (mobileSchemas as Record<string, unknown>)[schemaName] ||
          (mobileAuthSchemas as Record<string, unknown>)[schemaName]

        if (schema) {
          const jsonSchema = zodToJsonSchema(
            schema as never,
            schemaName,
          ) as Record<string, unknown>

          if (method === 'post') {
            requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: jsonSchema,
                },
              },
            }
          } else {
            // For GET requests, convert schema properties to query parameters
            // Handle both direct properties and $ref definitions
            let properties: Record<string, Record<string, unknown>> | undefined
            let required: string[] | undefined

            if (jsonSchema.properties) {
              properties = jsonSchema.properties as Record<
                string,
                Record<string, unknown>
              >
              required = jsonSchema.required as string[] | undefined
            } else if (jsonSchema.definitions && jsonSchema.$ref) {
              // Extract the definition name from $ref
              const refName = (jsonSchema.$ref as string).split('/').pop()
              if (refName) {
                const definitions = jsonSchema.definitions as Record<
                  string,
                  Record<string, unknown>
                >
                const definition = definitions[refName]
                if (definition) {
                  properties = definition.properties as Record<
                    string,
                    Record<string, unknown>
                  >
                  required = definition.required as string[] | undefined
                }
              }
            }

            if (properties) {
              parameters = Object.entries(properties).map(([name, prop]) => ({
                name,
                in: 'query',
                required: required?.includes(name) || false,
                schema: prop,
                description:
                  (prop.description as string) || `${name} parameter`,
              }))
            }
          }
        }
      }

      // Build security requirement
      const security = procedure.auth === 'protected' ? [{ ClerkAuth: [] }] : []

      const endpoint: SwaggerEndpoint = {
        path,
        method,
        summary:
          procedure.description || `${procedure.name} - ${routerInfo.router}`,
        description: procedure.description,
        tags: [routerInfo.router],
        parameters,
        requestBody,
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: 'object',
                      description: 'tRPC result wrapper',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad Request - Invalid input or parameters',
          },
          '401': {
            description: 'Unauthorized - Authentication required',
          },
          '403': {
            description: 'Forbidden - Insufficient permissions',
          },
          '404': {
            description: 'Not Found - Resource not found',
          },
          '500': {
            description: 'Internal Server Error',
          },
        },
        security,
      }

      endpoints.push(endpoint)
    }
  }

  return endpoints
}

function generateOpenAPISpec(endpoints: SwaggerEndpoint[]) {
  // Group endpoints by path for OpenAPI spec
  const paths: Record<string, unknown> = {}

  for (const endpoint of endpoints) {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {}
    }

    const operation = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security,
    }

    ;(paths[endpoint.path] as Record<string, unknown>)[endpoint.method] =
      operation
  }

  // Get unique tags
  const tags = Array.from(new Set(endpoints.flatMap((e) => e.tags))).map(
    (tag) => ({
      name: tag,
      description: `${tag.charAt(0).toUpperCase() + tag.slice(1)} related endpoints`,
    }),
  )

  return {
    openapi: '3.0.0',
    info: {
      title: 'EmuReady Mobile API',
      description:
        'Complete API documentation for EmuReady mobile applications. This API provides endpoints for managing game emulation listings, user authentication, device information, and more.',
      version: '1.0.0',
      contact: {
        name: 'EmuReady API Support',
        url: 'https://github.com/Producdevity/EmuReady',
      },
      license: {
        name: 'GPL-3.0-or-later',
        url: 'https://github.com/Producdevity/EmuReady/blob/master/LICENSE',
      },
    },
    servers: [
      {
        url: '/api/mobile/trpc',
        description: 'Mobile API Base URL',
      },
    ],
    security: [
      {
        ClerkAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk JWT token obtained from authentication',
        },
      },
      schemas: {
        // Add common response schemas
        TRPCError: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    httpStatus: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags,
    paths,
  }
}

async function main() {
  console.log('🔍 Scanning mobile router files...')

  const mobileRoutersDir = join(process.cwd(), 'src/server/api/routers/mobile')
  const routerFiles = readdirSync(mobileRoutersDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => join(mobileRoutersDir, file))

  console.log(`Found ${routerFiles.length} router files:`)
  routerFiles.forEach((file) => console.log(`  - ${file.split('/').pop()}`))

  console.log('\n📖 Extracting router information...')
  const routerInfos: RouterInfo[] = []

  for (const file of routerFiles) {
    const info = extractRouterInfo(file)
    if (info) {
      routerInfos.push(info)
      console.log(`  ✓ ${info.router}: ${info.procedures.length} procedures`)
    }
  }

  console.log('\n🔧 Generating Swagger endpoints...')
  const endpoints = generateSwaggerEndpoints(routerInfos)
  console.log(`Generated ${endpoints.length} API endpoints`)

  console.log('\n📝 Creating OpenAPI specification...')
  const openApiSpec = generateOpenAPISpec(endpoints)

  // Create output directory
  const outputDir = join(process.cwd(), 'public/api-docs')
  const outputFile = join(outputDir, 'mobile-openapi.json')

  try {
    const { mkdirSync } = await import('fs')
    mkdirSync(outputDir, { recursive: true })
  } catch {
    // Directory might already exist
  }

  // Write OpenAPI spec
  writeFileSync(outputFile, JSON.stringify(openApiSpec, null, 2))

  console.log(`\n✅ OpenAPI specification generated successfully!`)
  console.log(`📄 Output: ${outputFile}`)
  console.log(`🌐 Available at: /api-docs/mobile-openapi.json`)
  console.log(`\n📊 Summary:`)
  console.log(`  - Routers: ${routerInfos.length}`)
  console.log(`  - Total Endpoints: ${endpoints.length}`)
  console.log(`  - Tags: ${openApiSpec.tags.length}`)

  // Group endpoints by router for summary
  const endpointsByRouter = endpoints.reduce(
    (acc, endpoint) => {
      const router = endpoint.tags[0]
      acc[router] = (acc[router] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  console.log(`\n📋 Endpoints by router:`)
  Object.entries(endpointsByRouter).forEach(([router, count]) => {
    console.log(`  - ${router}: ${count} endpoints`)
  })
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Script failed:', err)
    process.exit(1)
  })
}
