#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync } from 'fs'
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
    returnStructure?: string
  }[]
}

function analyzeReturnStructure(filePath: string, procedureName: string): string {
  try {
    const content = readFileSync(filePath, 'utf-8')

    // Find the procedure by looking for the procedure name and analyzing its block
    const startIndex = content.indexOf(`${procedureName}:`)
    if (startIndex === -1) return 'unknown'

    // Find the end of this procedure (next procedure or closing brace)
    const nextProcedureMatch = content.substring(startIndex + 1).search(/\w+:\s*\w+Procedure/)
    const endIndex =
      nextProcedureMatch === -1
        ? content.lastIndexOf('})') // End of router
        : startIndex + 1 + nextProcedureMatch

    const procedureBlock = content.substring(startIndex, endIndex)

    // Analyze the return patterns in this procedure block
    if (procedureBlock.includes('ctx.prisma') && procedureBlock.includes('findMany')) {
      if (procedureBlock.includes('_count') && procedureBlock.includes('include')) {
        return 'array-with-relations-and-counts'
      } else if (procedureBlock.includes('include')) {
        return 'array-with-relations'
      } else {
        return 'array-simple'
      }
    }

    if (procedureBlock.includes('ctx.prisma') && procedureBlock.includes('findUnique')) {
      return procedureBlock.includes('include') ? 'object-with-relations' : 'object-simple'
    }

    if (procedureBlock.includes('pagination') || procedureBlock.includes('total')) {
      return 'paginated-list'
    }

    if (procedureBlock.includes('create') || procedureBlock.includes('update')) {
      return 'mutation-result'
    }

    if (procedureBlock.includes('count')) {
      return 'count-result'
    }

    // Analyze router context to infer likely structure
    if (
      filePath.includes('games') &&
      procedureName.startsWith('get') &&
      !procedureName.includes('ById')
    ) {
      return 'array-with-relations-and-counts'
    }
    if (filePath.includes('listings') && procedureName === 'getListings') {
      return 'paginated-list'
    }
    if (procedureName.includes('ById')) {
      return 'object-with-relations'
    }

    return 'generic-object'
  } catch (error) {
    console.warn(
      `Could not analyze return structure for ${procedureName}:`,
      error instanceof Error ? error.message : String(error),
    )
    return 'unknown'
  }
}

function generateResponseExampleByStructure(
  routerName: string,
  procedureName: string,
  structure: string,
): unknown {
  // Use structure analysis to generate accurate examples
  switch (structure) {
    case 'array-with-relations-and-counts':
      return createArrayWithRelationsAndCounts(routerName, procedureName)
    case 'array-with-relations':
      return createArrayWithRelations(routerName, procedureName)
    case 'array-simple':
      return createSimpleArray(routerName, procedureName)
    case 'object-with-relations':
      return createObjectWithRelations(routerName, procedureName)
    case 'object-simple':
      return createSimpleObject(routerName, procedureName)
    case 'paginated-list':
      return createPaginatedList(routerName, procedureName)
    case 'mutation-result':
      return createMutationResult(routerName, procedureName)
    case 'count-result':
      return { count: 42 }
    default:
      return createGenericResponse(routerName, procedureName)
  }
}

function createArrayWithRelationsAndCounts(routerName: string, _procedureName: string): unknown {
  const baseItem = getBaseItemStructure(routerName)
  return [
    {
      ...baseItem,
      ...getRelationsForRouter(routerName),
      _count: getCountStructure(routerName),
    },
  ]
}

function createArrayWithRelations(routerName: string, _procedureName: string): unknown {
  const baseItem = getBaseItemStructure(routerName)
  return [
    {
      ...baseItem,
      ...getRelationsForRouter(routerName),
    },
  ]
}

function createSimpleArray(routerName: string, _procedureName: string): unknown {
  return [getBaseItemStructure(routerName)]
}

function createObjectWithRelations(routerName: string, _procedureName: string): unknown {
  const baseItem = getBaseItemStructure(routerName)
  return {
    ...baseItem,
    ...getRelationsForRouter(routerName),
  }
}

function createSimpleObject(routerName: string, _procedureName: string): unknown {
  return getBaseItemStructure(routerName)
}

function createPaginatedList(routerName: string, _procedureName: string): unknown {
  return {
    [getPluralName(routerName)]: [
      {
        ...getBaseItemStructure(routerName),
        ...getRelationsForRouter(routerName),
        _count: getCountStructure(routerName),
      },
    ],
    pagination: {
      total: 156,
      pages: 8,
      currentPage: 1,
      limit: 20,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  }
}

function createMutationResult(routerName: string, procedureName: string): unknown {
  if (procedureName.startsWith('create')) {
    return {
      id: 'uuid-generated',
      message: 'Created successfully',
      ...getBaseItemStructure(routerName),
    }
  }
  if (procedureName.startsWith('update')) {
    return {
      id: 'uuid-updated',
      message: 'Updated successfully',
    }
  }
  if (procedureName.startsWith('delete')) {
    return { success: true, message: 'Deleted successfully' }
  }
  return { success: true }
}

function createGenericResponse(routerName: string, procedureName: string): unknown {
  return {
    message: `Response from ${routerName}.${procedureName}`,
    data: getBaseItemStructure(routerName),
  }
}

function getBaseItemStructure(routerName: string): Record<string, unknown> {
  const structures: Record<string, Record<string, unknown>> = {
    games: {
      id: 'uuid-game',
      title: 'Super Mario Bros',
      systemId: 'uuid-system',
      imageUrl: 'https://example.com/game.jpg',
      status: 'APPROVED',
    },
    listings: {
      id: 'uuid-listing',
      gameId: 'uuid-game',
      deviceId: 'uuid-device',
      emulatorId: 'uuid-emulator',
      performanceId: 1,
      notes: 'Runs perfectly at 60fps',
      status: 'APPROVED',
    },
    devices: {
      id: 'uuid-device',
      brandId: 'uuid-brand',
      modelName: 'Steam Deck',
      socId: 'uuid-soc',
    },
    emulators: {
      id: 'uuid-emulator',
      name: 'RetroArch',
      logo: 'retroarch.png',
    },
    auth: {
      id: 'uuid-user',
      email: 'user@example.com',
      name: 'John Doe',
    },
    notifications: {
      id: 'uuid-notification',
      type: 'LISTING_APPROVED',
      message: 'Your listing has been approved',
      isRead: false,
      createdAt: '2025-07-12T10:00:00Z',
    },
  }

  return structures[routerName] || { id: 'uuid-generic', name: 'Generic Item' }
}

function getRelationsForRouter(routerName: string): Record<string, unknown> {
  const relations: Record<string, Record<string, unknown>> = {
    games: {
      system: {
        id: 'uuid-system',
        name: 'Nintendo Entertainment System',
        key: 'nes',
      },
    },
    listings: {
      game: { id: 'uuid-game', title: 'Super Mario Bros' },
      device: {
        id: 'uuid-device',
        modelName: 'Steam Deck',
        brand: { name: 'Valve' },
      },
      emulator: { id: 'uuid-emulator', name: 'RetroArch' },
      performance: { id: 1, label: 'Perfect', rank: 1 },
      author: { id: 'uuid-user', name: 'GameTester' },
    },
    devices: {
      brand: { id: 'uuid-brand', name: 'Valve' },
      soc: { id: 'uuid-soc', name: 'AMD APU' },
    },
  }

  return relations[routerName] || {}
}

function getCountStructure(routerName: string): Record<string, unknown> {
  const counts: Record<string, Record<string, unknown>> = {
    games: { listings: 45 },
    listings: { votes: 12, comments: 3 },
    devices: { listings: 28 },
  }

  return counts[routerName] || {}
}

function getPluralName(routerName: string): string {
  const plurals: Record<string, string> = {
    game: 'games',
    listing: 'listings',
    device: 'devices',
    emulator: 'emulators',
    notification: 'notifications',
  }

  return plurals[routerName] || `${routerName}s`
}

function generateExampleFromSchema(jsonSchema: Record<string, unknown>): Record<string, unknown> {
  const example: Record<string, unknown> = {}

  // Handle direct properties
  let properties = jsonSchema.properties as Record<string, Record<string, unknown>> | undefined
  let required = jsonSchema.required as string[] | undefined

  // Handle $ref definitions
  if (!properties && jsonSchema.definitions && jsonSchema.$ref) {
    const refName = (jsonSchema.$ref as string).split('/').pop()
    if (refName) {
      const definitions = jsonSchema.definitions as Record<string, Record<string, unknown>>
      const definition = definitions[refName]
      if (definition) {
        properties = definition.properties as Record<string, Record<string, unknown>>
        required = definition.required as string[] | undefined
      }
    }
  }

  if (!properties) return {}

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required?.includes(propName) || false
    const propType = propSchema.type as string
    const format = propSchema.format as string | undefined

    // Only include required fields and some common optional ones in examples
    if (isRequired || ['search', 'limit', 'page'].includes(propName)) {
      switch (propType) {
        case 'string':
          if (format === 'uuid') {
            example[propName] = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          } else if (propName.toLowerCase().includes('search')) {
            example[propName] = 'mario'
          } else {
            example[propName] = 'example'
          }
          break
        case 'number':
        case 'integer':
          if (propName === 'limit') {
            example[propName] = 10
          } else if (propName === 'page') {
            example[propName] = 1
          } else {
            example[propName] = propSchema.default ?? 1
          }
          break
        case 'boolean':
          example[propName] = propSchema.default ?? false
          break
        default:
          if (propSchema.default !== undefined) {
            example[propName] = propSchema.default
          }
      }
    }
  }

  return example
}

function extractRouterInfo(filePath: string): RouterInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const routerName = filePath.split('/').pop()?.replace('.ts', '') || 'unknown'

    const procedures: RouterInfo['procedures'] = []

    // Extract procedure definitions - handle multiline patterns
    const procedureRegex =
      /(\w+):\s*(mobilePublicProcedure|mobileProtectedProcedure)\s*(?:\.input\((\w+)\))?\s*\.(query|mutation)/g
    let match

    // First, find where nested routers are defined
    const nestedRouterPattern = /(\w+):\s*createMobileTRPCRouter\s*\(/g
    const nestedRouters: { name: string; startIndex: number; endIndex: number }[] = []
    let nestedMatch

    while ((nestedMatch = nestedRouterPattern.exec(content)) !== null) {
      const startIndex = nestedMatch.index
      // Find the closing brace for this nested router
      let braceCount = 0
      let foundStart = false
      let endIndex = -1

      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '(' && !foundStart) {
          foundStart = true
        } else if (foundStart && content[i] === '{') {
          braceCount++
        } else if (foundStart && content[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            // Look for the closing parenthesis after the brace
            for (let j = i; j < content.length && j < i + 10; j++) {
              if (content[j] === ')') {
                endIndex = j
                break
              }
            }
            if (endIndex !== -1) break
          }
        }
      }

      if (endIndex !== -1) {
        nestedRouters.push({
          name: nestedMatch[1],
          startIndex,
          endIndex,
        })
      }
    }

    while ((match = procedureRegex.exec(content)) !== null) {
      const [, name, authType, inputSchema, type] = match

      // Check if this procedure is inside a nested router
      let isInNestedRouter = false
      for (const nested of nestedRouters) {
        if (match.index > nested.startIndex && match.index < nested.endIndex) {
          isInNestedRouter = true
          break
        }
      }

      // Skip procedures that are inside nested routers
      if (isInNestedRouter) continue

      // Extract JSDoc comment for this procedure
      const beforeProcedure = content.substring(0, match.index)
      const lastCommentMatch = beforeProcedure.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\//g)
      let description = lastCommentMatch
        ? lastCommentMatch[lastCommentMatch.length - 1]
            .replace(/\/\*\*\s*\n\s*\*\s*|\s*\n\s*\*\//g, '')
            .replace(/\s*\*\s*/g, ' ')
            .trim()
        : undefined

      // Skip comments that are clearly for nested routers, not procedures
      if (description && description.toLowerCase().includes('nested router')) {
        description = undefined
      }

      // Use the JSDoc description as is, since we're now excluding nested router procedures
      const finalDescription = description

      procedures.push({
        name,
        type: type as 'query' | 'mutation',
        input: inputSchema,
        auth: authType === 'mobileProtectedProcedure' ? 'protected' : 'public',
        description: finalDescription || description,
        returnStructure: analyzeReturnStructure(filePath, name),
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

function generateSwaggerEndpoints(routerInfos: RouterInfo[]): {
  endpoints: SwaggerEndpoint[]
  schemas: Record<string, unknown>
} {
  const endpoints: SwaggerEndpoint[] = []
  const schemas: Record<string, unknown> = {}

  for (const routerInfo of routerInfos) {
    for (const procedure of routerInfo.procedures) {
      // tRPC uses GET for queries and POST for mutations when using fetchRequestHandler
      const method = procedure.type === 'mutation' ? 'post' : 'get'
      const path = `/${routerInfo.router}.${procedure.name}`

      // Get input schema if available
      let requestBody: unknown = undefined
      let parameters: unknown[] = []

      if (procedure.input) {
        const schemaName = procedure.input
        const schema =
          (mobileSchemas as Record<string, unknown>)[schemaName] ||
          (mobileAuthSchemas as Record<string, unknown>)[schemaName]

        if (schema) {
          const jsonSchema = zodToJsonSchema(schema as never, schemaName) as Record<string, unknown>

          // Add schema to components/schemas
          schemas[schemaName] = jsonSchema

          if (method === 'post') {
            // Mutations use POST with request body
            requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                  example: generateExampleFromSchema(jsonSchema),
                },
              },
              description: `Input data for ${procedure.type} procedure.`,
            }
          } else {
            // Queries use GET with input query parameter containing JSON string
            const schemaExample = generateExampleFromSchema(jsonSchema)
            const hasRequiredFields =
              jsonSchema.required && (jsonSchema.required as string[]).length > 0

            parameters = [
              {
                name: 'input',
                in: 'query',
                required: hasRequiredFields,
                schema: {
                  type: 'string',
                  description: 'SuperJSON wrapped input object',
                },
                description: `SuperJSON wrapped input matching ${schemaName} schema. See components/schemas/${schemaName} for structure.`,
                example: JSON.stringify({ json: schemaExample }, null, 0),
              },
            ]
          }
        }
      }

      // Build security requirement
      const security = procedure.auth === 'protected' ? [{ ClerkAuth: [] }] : []

      const endpoint: SwaggerEndpoint = {
        path,
        method,
        summary: procedure.description || `${procedure.name} - ${routerInfo.router}`,
        description: procedure.description,
        tags: [routerInfo.router],
        parameters,
        requestBody,
        responses: {
          '200': {
            description: 'Successful tRPC response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: 'object',
                      description: 'tRPC result wrapper containing the actual response data',
                      properties: {
                        data: {
                          type: 'object',
                          description: `Response data from ${routerInfo.router}.${procedure.name}`,
                        },
                      },
                    },
                  },
                  required: ['result'],
                },
                examples: {
                  success: {
                    summary: 'Successful response',
                    value: {
                      result: {
                        data: generateResponseExampleByStructure(
                          routerInfo.router,
                          procedure.name,
                          procedure.returnStructure || 'generic-object',
                        ),
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad Request - Invalid input parameters or malformed JSON',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TRPCError' },
                examples: {
                  invalidInput: {
                    summary: 'Invalid input example',
                    value: {
                      error: {
                        json: {
                          message: 'Input validation failed',
                          code: -32600,
                          data: {
                            code: 'BAD_REQUEST',
                            httpStatus: 400,
                            path: `${routerInfo.router}.${procedure.name}`,
                            zodError: {
                              formErrors: ['Required'],
                              fieldErrors: {},
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TRPCError' },
              },
            },
          },
          '403': {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TRPCError' },
              },
            },
          },
          '404': {
            description: 'Not Found - Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TRPCError' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TRPCError' },
              },
            },
          },
        },
        security,
      }

      endpoints.push(endpoint)
    }
  }

  return { endpoints, schemas }
}

function generateOpenAPISpec(endpoints: SwaggerEndpoint[], schemas: Record<string, unknown>) {
  // Group endpoints by path for OpenAPI spec
  const paths: Record<string, unknown> = {}

  for (const endpoint of endpoints) {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {}
    }

    ;(paths[endpoint.path] as Record<string, unknown>)[endpoint.method] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security,
    }
  }

  // Get unique tags
  const tags = Array.from(new Set(endpoints.flatMap((e) => e.tags))).map((tag) => ({
    name: tag,
    description: `${tag.charAt(0).toUpperCase() + tag.slice(1)} related endpoints`,
  }))

  return {
    openapi: '3.0.0',
    info: {
      title: 'EmuReady Mobile API (tRPC)',
      description: `
# EmuReady Mobile tRPC API

Complete API documentation for EmuReady mobile applications built with tRPC.

## tRPC HTTP Method Conventions

NOTE: the protected routes require authentication via Clerk JWT token in the Authorization header. This isn't implemented yet.

tRPC uses HTTP method semantics with fetchRequestHandler:
- **Queries** use **GET** requests with input as query parameter
- **Mutations** use **POST** requests with input in request body

### Schema References:

All input schemas are defined in the **components/schemas** section. When you see a parameter referencing a schema (e.g., GetEmulatorsSchema), check the schemas section for the complete structure with field types, validations, and defaults.

### Usage Examples:

\`\`\`bash
# Query: Get games with search and limit (GET with SuperJSON wrapped input)
# Schema: See components/schemas/GetGamesSchema
curl -X GET "https://www.emuready.com/api/mobile/trpc/games.getGames?input=%7B%22json%22%3A%7B%22search%22%3A%22mario%22%2C%22limit%22%3A5%7D%7D" \\
  -H "Content-Type: application/json"

# Query: Get popular games (GET, no input required)
curl -X GET "https://www.emuready.com/api/mobile/trpc/games.getPopularGames" \\
  -H "Content-Type: application/json"

# Query: Get listings with filters (GET with SuperJSON wrapped input)
curl -X GET "https://www.emuready.com/api/mobile/trpc/listings.getListings?input=%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22zelda%22%7D%7D" \\
  -H "Content-Type: application/json"

# Mutation: Create listing (POST with request body)
curl -X POST "https://www.emuready.com/api/mobile/trpc/listings.createListing" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"gameId":"uuid","deviceId":"uuid","emulatorId":"uuid","performanceId":"uuid"}'

# Protected query with authentication (GET with query parameter and auth header)
curl -X GET "https://www.emuready.com/api/mobile/trpc/listings.getUserListings?input=%7B%22userId%22%3A%22uuid%22%7D" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Important Notes:

**For Queries (GET requests):**
✅ Use GET method
✅ Send input wrapped in SuperJSON format: \`{"json":{"field":"value"}}\`
✅ URL-encode the entire JSON string
✅ Many endpoints have defaults and don't require input
✅ Input parameter format: \`?input={"json":{"field":"value"}}\` (URL-encoded)

**For Mutations (POST requests):**
✅ Use POST method
✅ Send input as JSON in request body
✅ Set Content-Type: application/json

### Response Format:
All responses are wrapped in a tRPC result object:
\`\`\`json
{
  "result": {
    "data": /* response data */
  }
}
\`\`\`

### Error Response Format:
\`\`\`json
{
  "error": {
    "json": {
      "message": "Error message",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400,
        "path": "games.getGames"
      }
    }
  }
}
\`\`\`

This API provides endpoints for:
- Game emulation listings management
- User authentication and profiles  
- Device and hardware information
- Emulator data and compatibility
- Community features (comments, votes)
      `,
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
        // Add common response schemas matching actual tRPC error format
        TRPCError: {
          type: 'object',
          description: 'tRPC error response format',
          properties: {
            error: {
              type: 'object',
              properties: {
                json: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'Error message, often includes validation details',
                    },
                    code: {
                      type: 'number',
                      description: 'tRPC error code (-32600 for BAD_REQUEST, etc.)',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        code: {
                          type: 'string',
                          description: 'Error type code (BAD_REQUEST, UNAUTHORIZED, etc.)',
                        },
                        httpStatus: {
                          type: 'number',
                          description: 'HTTP status code',
                        },
                        path: {
                          type: 'string',
                          description: 'tRPC procedure path (e.g., "games.getGames")',
                        },
                        zodError: {
                          type: 'object',
                          description: 'Zod validation error details (if applicable)',
                          properties: {
                            formErrors: {
                              type: 'array',
                              items: { type: 'string' },
                            },
                            fieldErrors: {
                              type: 'object',
                              additionalProperties: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  required: ['message', 'code', 'data'],
                },
              },
              required: ['json'],
            },
          },
          required: ['error'],
        },
        ...schemas,
      },
    },
    tags,
    paths,
  }
}

interface EndpointInfo {
  path: string
  method: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: Array<{
    name: string
    schema: { type: string }
    required: boolean
    description?: string
  }>
  requestBody?: {
    required?: boolean
    content?: unknown
    description?: string
  }
  security?: unknown[]
}

function generateMarkdownDocs(openApiSpec: ReturnType<typeof generateOpenAPISpec>): string {
  const { info, paths } = openApiSpec
  const endpoints: EndpointInfo[] = Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods as Record<string, unknown>).map(([method, operation]) => ({
      path,
      method: method.toUpperCase(),
      ...(operation as Record<string, unknown>),
    })),
  ) as EndpointInfo[]

  const publicEndpoints = endpoints.filter((e) => !e.security || e.security.length === 0)
  const protectedEndpoints = endpoints.filter((e) => e.security && e.security.length > 0)

  return `# ${info.title}

*Auto-generated on: ${new Date().toISOString()}*

## Summary
- **Total Endpoints**: ${endpoints.length}
- **Public Endpoints**: ${publicEndpoints.length}
- **Protected Endpoints**: ${protectedEndpoints.length}
- **OpenAPI Version**: ${openApiSpec.openapi}

## Base URL
\`${openApiSpec.servers[0].url}\`

## Authentication
Protected endpoints require Bearer token authentication using Clerk JWT.

## Interactive Documentation
- **Swagger UI**: [/docs/api/swagger](https://emuready.com/docs/api/swagger)
- **OpenAPI JSON**: [/api-docs/mobile-openapi.json](https://emuready.com/api-docs/mobile-openapi.json)

## Endpoints

### Public Endpoints (No Authentication Required)

${publicEndpoints
  .map(
    (endpoint, index) => `
#### ${index + 1}. **${endpoint.path.split('.').pop()}**
- **Method**: ${endpoint.method.toUpperCase()}
- **Path**: \`${endpoint.path}\`
- **Description**: ${endpoint.summary}
${endpoint.tags ? `- **Tags**: ${endpoint.tags.join(', ')}` : ''}
${endpoint.requestBody ? `- **Request Body**: JSON object ${endpoint.requestBody.required ? 'required' : 'optional (can be empty: {})'}\n- **Content-Type**: application/json` : ''}
`,
  )
  .join('')}

### Protected Endpoints (Authentication Required)

${protectedEndpoints
  .map(
    (endpoint, index) => `
#### ${index + 1}. **${endpoint.path.split('.').pop()}**
- **Method**: ${endpoint.method.toUpperCase()}
- **Path**: \`${endpoint.path}\`
- **Description**: ${endpoint.summary}
${endpoint.tags ? `- **Tags**: ${endpoint.tags.join(', ')}` : ''}
${endpoint.requestBody ? `- **Request Body**: JSON object ${endpoint.requestBody.required ? 'required' : 'optional (can be empty: {})'}\n- **Content-Type**: application/json` : ''}
- **Authentication**: Bearer token required
`,
  )
  .join('')}

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "data": {
      "code": "TRPC_ERROR_CODE",
      "httpStatus": 400
    }
  }
}
\`\`\`

Common error codes:
- \`UNAUTHORIZED\`: Missing or invalid authentication
- \`FORBIDDEN\`: User lacks permission
- \`NOT_FOUND\`: Resource not found
- \`BAD_REQUEST\`: Invalid input parameters
- \`INTERNAL_SERVER_ERROR\`: Server error

---
*This documentation is automatically generated from tRPC procedures and OpenAPI specifications.*
`
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
  const { endpoints, schemas } = generateSwaggerEndpoints(routerInfos)
  console.log(`Generated ${endpoints.length} API endpoints`)
  console.log(`Collected ${Object.keys(schemas).length} schema definitions`)

  console.log('\n📝 Creating OpenAPI specification...')
  const openApiSpec = generateOpenAPISpec(endpoints, schemas)

  // Create output directory
  const outputDir = join(process.cwd(), 'public/api-docs')
  const docsDir = join(process.cwd(), 'docs')
  const jsonOutputFile = join(outputDir, 'mobile-openapi.json')
  const mdOutputFile = join(docsDir, 'MOBILE_API.md')

  try {
    const { mkdirSync } = await import('fs')
    mkdirSync(outputDir, { recursive: true })
    mkdirSync(docsDir, { recursive: true })
  } catch {
    // Swallow that shit
  }

  // Write OpenAPI spec
  writeFileSync(jsonOutputFile, JSON.stringify(openApiSpec, null, 2))

  // Generate and write markdown documentation
  console.log('\n📋 Generating Markdown documentation...')
  const markdownDocs = generateMarkdownDocs(openApiSpec)
  writeFileSync(mdOutputFile, markdownDocs)

  console.log(`\n✅ API documentation generated successfully!`)
  console.log(`📄 OpenAPI JSON: ${jsonOutputFile}`)
  console.log(`📄 Markdown docs: ${mdOutputFile}`)
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
