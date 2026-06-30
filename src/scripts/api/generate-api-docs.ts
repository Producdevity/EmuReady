#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { getMobileApiSchema } from './mobile-schema-registry'
import type { z } from 'zod'

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
    output?: string
    auth: 'public' | 'protected'
    description?: string
  }[]
}

function createGenericResponse(routerName: string, procedureName: string): unknown {
  return {
    message: `Response from ${routerName}.${procedureName}`,
    data: getBaseItemStructure(routerName),
  }
}

function getResponseExampleOverride(outputSchemaName: string | undefined): unknown | null {
  if (outputSchemaName !== 'BatchBySteamAppIdsResponseSchema') return null

  return {
    success: true,
    results: [
      {
        game_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        steam_app_id: '220',
        title: 'Half-Life 2',
        performance: {
          id: 1,
          label: 'Perfect',
          rank: 1,
          description: null,
        },
        emulator: {
          id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          name: 'GameHub',
          logo: null,
        },
        device: {
          id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          modelName: 'Steam Deck',
          soc: null,
        },
        listing: {
          id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          notes: 'Runs well',
          upvoteCount: 4,
          downvoteCount: 1,
          voteCount: 5,
          successRate: 0.8,
        },
      },
    ],
    totalRequested: 1,
    totalFound: 1,
    totalNotFound: 0,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type DefinitionRef = {
  ref: string
  value: unknown
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

function resolveDefinitionRef(
  ref: unknown,
  definitions: Record<string, unknown>,
): DefinitionRef | null {
  if (typeof ref !== 'string') return null
  if (!ref.startsWith('#/definitions/')) return null

  let current: unknown = definitions
  const segments = ref
    .slice('#/definitions/'.length)
    .split('/')
    .map((segment) => decodeJsonPointerSegment(segment))

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) return null
      current = current[index]
      continue
    }

    if (!isRecord(current)) return null
    current = current[segment]
  }

  return { ref, value: current }
}

function cloneJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const cloned: unknown = JSON.parse(JSON.stringify(schema))
  return isRecord(cloned) ? cloned : {}
}

function resolveDefinitionRefs(
  value: unknown,
  definitions: Record<string, unknown>,
  seenRefs = new Set<string>(),
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveDefinitionRefs(item, definitions, seenRefs))
  }

  if (!isRecord(value)) return value

  const definitionRef = resolveDefinitionRef(value.$ref, definitions)
  if (definitionRef) {
    if (seenRefs.has(definitionRef.ref)) return {}

    const nextSeenRefs = new Set(seenRefs)
    nextSeenRefs.add(definitionRef.ref)

    const resolvedDefinition = resolveDefinitionRefs(definitionRef.value, definitions, nextSeenRefs)
    const siblingEntries = Object.entries(value).filter(
      ([key]) => key !== '$ref' && key !== '$schema' && key !== 'definitions',
    )

    if (isRecord(resolvedDefinition)) {
      return resolveDefinitionRefs(
        {
          ...resolvedDefinition,
          ...Object.fromEntries(siblingEntries),
        },
        definitions,
        nextSeenRefs,
      )
    }

    return resolvedDefinition
  }

  const resolved: Record<string, unknown> = {}

  for (const [key, childValue] of Object.entries(value)) {
    if (key === '$schema' || key === 'definitions') continue
    resolved[key] = resolveDefinitionRefs(childValue, definitions, seenRefs)
  }

  return resolved
}

function resolveReferencedSchema(jsonSchema: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(jsonSchema.definitions)) return jsonSchema

  const resolved = resolveDefinitionRefs(jsonSchema, jsonSchema.definitions)

  return isRecord(resolved) ? resolved : {}
}

function generateScalarExample(propName: string, schema: Record<string, unknown>): unknown {
  if (schema.const !== undefined) return schema.const

  const propType = schema.type as string | undefined
  const format = schema.format as string | undefined

  switch (propType) {
    case 'string':
      if (format === 'uuid') return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      if (propName.toLowerCase().includes('search')) return 'mario'
      return 'example'
    case 'number':
    case 'integer':
      if (propName === 'limit') return 10
      if (propName === 'page') return 1
      return schema.default ?? 1
    case 'boolean':
      return schema.default ?? false
    default:
      return schema.default
  }
}

function generateExampleFromSchema(jsonSchema: Record<string, unknown>): unknown {
  const resolvedSchema = resolveReferencedSchema(jsonSchema)
  const schemaType = resolvedSchema.type as string | undefined

  if (schemaType === 'array') {
    const items = resolvedSchema.items
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      return [generateExampleFromSchema(items as Record<string, unknown>)]
    }

    return []
  }

  if (schemaType && schemaType !== 'object' && !resolvedSchema.properties) {
    return generateScalarExample('', resolvedSchema)
  }

  const example: Record<string, unknown> = {}

  // Handle direct properties
  const properties = resolvedSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined
  const required = resolvedSchema.required as string[] | undefined

  if (!properties) return {}

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required?.includes(propName) || false
    const propType = propSchema.type as string

    // Only include required fields and some common optional ones in examples
    if (isRequired || ['search', 'limit', 'page'].includes(propName)) {
      switch (propType) {
        case 'string':
        case 'number':
        case 'integer':
        case 'boolean':
          example[propName] = generateScalarExample(propName, propSchema)
          break
        case 'array':
          // Handle array types
          const items = propSchema.items as Record<string, unknown> | undefined
          if (items) {
            const itemType = items.type as string
            const itemFormat = items.format as string | undefined

            if (itemType === 'string' && itemFormat === 'uuid') {
              // For UUID arrays like commentIds
              example[propName] = [
                '11111111-1111-1111-1111-111111111111',
                '22222222-2222-2222-2222-222222222222',
              ]
            } else if (itemType === 'string') {
              example[propName] = ['example1', 'example2']
            } else if (itemType === 'number' || itemType === 'integer') {
              example[propName] = [1, 2]
            } else if (itemType === 'object') {
              // Recursively generate example for nested object
              const nestedExample = generateExampleFromSchema(items)
              example[propName] =
                typeof nestedExample === 'object' &&
                nestedExample !== null &&
                Object.keys(nestedExample).length > 0
                  ? [nestedExample]
                  : []
            } else {
              example[propName] = []
            }
          } else {
            example[propName] = []
          }
          break
        case 'object':
          // Recursively generate example for nested object
          const nestedObjExample = generateExampleFromSchema(propSchema)
          if (
            typeof nestedObjExample === 'object' &&
            nestedObjExample !== null &&
            Object.keys(nestedObjExample).length > 0
          ) {
            example[propName] = nestedObjExample
          }
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

    // Extract explicit tRPC procedure chains. The docs generator only trusts schemas declared
    // in .input(...) and .output(...); response examples for uncontracted procedures stay generic.
    const procedureRegex =
      /(\w+):\s*(mobilePublicProcedure|mobileProtectedProcedure)([\s\S]*?)\.(query|mutation)\s*\(/g
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
      const [, name, authType, procedureChain, type] = match
      const inputSchema = procedureChain.match(/\.input\((\w+)\)/)?.[1]
      const outputSchema = procedureChain.match(/\.output\((\w+)\)/)?.[1]

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

      const description = extractAdjacentJsDoc(content, match.index)

      procedures.push({
        name,
        type: type as 'query' | 'mutation',
        input: inputSchema,
        output: outputSchema,
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

function extractAdjacentJsDoc(content: string, procedureIndex: number): string | undefined {
  const beforeProcedure = content.substring(0, procedureIndex)
  const commentEnd = beforeProcedure.lastIndexOf('*/')
  if (commentEnd === -1) return undefined

  const trailingContent = beforeProcedure.slice(commentEnd + 2)
  if (trailingContent.trim() !== '') return undefined

  const commentStart = beforeProcedure.lastIndexOf('/**', commentEnd)
  if (commentStart === -1) return undefined

  const description = beforeProcedure
    .slice(commentStart, commentEnd + 2)
    .replace(/\/\*\*|\*\//g, '')
    .replace(/^\s*\*\s?/gm, '')
    .trim()
    .replace(/\n\s*\n/g, '\n')
    .replace(/\n/g, ' ')

  if (description.toLowerCase().includes('nested router')) return undefined

  return description
}

/**
 * Convert JSON Schema Draft 7 to OpenAPI 3.0 compatible format
 * Handles nullable types properly for OpenAPI 3.0
 */
function convertJsonSchemaToOpenApi30(schema: Record<string, unknown>): Record<string, unknown> {
  const cloned = cloneJsonSchema(schema)
  const definitions = isRecord(cloned.definitions) ? cloned.definitions : {}
  const resolved = resolveDefinitionRefs(cloned, definitions)
  const converted = isRecord(resolved) ? resolved : {}

  // Remove JSON Schema specific properties that aren't valid in OpenAPI
  delete converted.$schema
  delete converted.definitions

  function processSchema(obj: Record<string, unknown>): void {
    // Handle array type format (OpenAPI 3.1) to nullable format (OpenAPI 3.0)
    if (obj.type && Array.isArray(obj.type)) {
      const types = obj.type as string[]
      const nullIndex = types.indexOf('null')
      if (nullIndex !== -1) {
        // Remove null from types array
        types.splice(nullIndex, 1)
        // If only one type left, use it directly with nullable
        if (types.length === 1) {
          obj.type = types[0]
          obj.nullable = true
        } else {
          // Multiple types besides null - use oneOf
          obj.oneOf = types.map((t) => ({ type: t }))
          delete obj.type
          obj.nullable = true
        }
      }
    }

    // Recursively process nested schemas
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        if (key === 'properties' && !Array.isArray(value)) {
          // Process each property
          for (const propValue of Object.values(value)) {
            if (propValue && typeof propValue === 'object' && !Array.isArray(propValue)) {
              processSchema(propValue as Record<string, unknown>)
            }
          }
        } else if (key === 'items' && !Array.isArray(value)) {
          processSchema(value as Record<string, unknown>)
        } else if (
          Array.isArray(value) &&
          (key === 'allOf' || key === 'anyOf' || key === 'oneOf')
        ) {
          for (const item of value) {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              processSchema(item as Record<string, unknown>)
            }
          }
        } else if (!Array.isArray(value) && typeof value === 'object' && key !== 'definitions') {
          processSchema(value as Record<string, unknown>)
        }
      }
    }
  }

  processSchema(converted)
  return converted
}

function toJsonSchema(schema: z.ZodTypeAny, schemaName: string): Record<string, unknown> {
  return zodToJsonSchema(schema, schemaName) as Record<string, unknown>
}

function addComponentSchema(
  schemas: Record<string, unknown>,
  schemaName: string,
  schema: z.ZodTypeAny,
): Record<string, unknown> {
  const jsonSchema = toJsonSchema(schema, schemaName)
  schemas[schemaName] = convertJsonSchemaToOpenApi30(jsonSchema)
  return jsonSchema
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
        const schema = getMobileApiSchema(schemaName)

        if (schema) {
          const jsonSchema = addComponentSchema(schemas, schemaName, schema)

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
            const resolvedInputSchema = resolveReferencedSchema(jsonSchema)
            const hasRequiredFields =
              Array.isArray(resolvedInputSchema.required) && resolvedInputSchema.required.length > 0

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

      const outputSchemaName = procedure.output
      const outputSchema = outputSchemaName ? getMobileApiSchema(outputSchemaName) : null
      const outputJsonSchema =
        outputSchemaName && outputSchema
          ? addComponentSchema(schemas, outputSchemaName, outputSchema)
          : null
      const responseDataSchema =
        outputSchemaName && outputSchema
          ? { $ref: `#/components/schemas/${outputSchemaName}` }
          : {
              type: 'object',
              description: `Response data from ${routerInfo.router}.${procedure.name}`,
            }
      const responseExample =
        getResponseExampleOverride(outputSchemaName) ??
        (outputJsonSchema
          ? generateExampleFromSchema(outputJsonSchema)
          : createGenericResponse(routerInfo.router, procedure.name))

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
                        data: responseDataSchema,
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
                        data: responseExample,
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
      title: 'EmuReady Public Integration API (mobile-compatible tRPC)',
      description: `
# EmuReady Public Integration tRPC API

API documentation for the mobile-compatible public integration surface built with tRPC.

## tRPC HTTP Method Conventions

Protected routes require authentication via Clerk JWT token in the Authorization header. Public integration requests can also include an issued API key in \`x-api-key\`; invalid explicit API keys are rejected.

tRPC uses HTTP method semantics with fetchRequestHandler:
- **Queries** use **GET** requests with input as query parameter
- **Mutations** use **POST** requests with input in request body

### Schema References:

All input schemas are defined in the **components/schemas** section. When you see a parameter referencing a schema (e.g., GetEmulatorsSchema), check the schemas section for the complete structure with field types, validations, and defaults.

### Usage Examples:

\`\`\`bash
# Query: Get games with search and limit (GET with SuperJSON wrapped input)
# Schema: See components/schemas/GetGamesSchema
curl -X GET "https://www.emuready.com/api/mobile/trpc/games.get?input=%7B%22json%22%3A%7B%22search%22%3A%22mario%22%2C%22limit%22%3A5%7D%7D" \\
  -H "Content-Type: application/json"

# Query: Get popular games (GET, no input required)
curl -X GET "https://www.emuready.com/api/mobile/trpc/games.getPopularGames" \\
  -H "Content-Type: application/json"

# Query: Get listings with filters (GET with SuperJSON wrapped input)
curl -X GET "https://www.emuready.com/api/mobile/trpc/listings.get?input=%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22zelda%22%7D%7D" \\
  -H "Content-Type: application/json"

# Mutation: Create listing (POST with request body)
curl -X POST "https://www.emuready.com/api/mobile/trpc/listings.createListing" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"gameId":"uuid","deviceId":"uuid","emulatorId":"uuid","performanceId":"uuid"}'

# Protected query with authentication (GET with SuperJSON wrapped input and auth header)
curl -X GET "https://www.emuready.com/api/mobile/trpc/listings.getUserListings?input=%7B%22json%22%3A%7B%22userId%22%3A%22uuid%22%7D%7D" \\
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
        "path": "games.get"
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
        description: 'Mobile-compatible public integration API base URL',
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
                          description: 'tRPC procedure path (e.g., "games.get")',
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
  parameters?: {
    name: string
    schema: { type: string }
    required: boolean
    description?: string
  }[]
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
Protected endpoints require Bearer token authentication using Clerk JWT. Public integration requests can also include an issued API key in \`x-api-key\`.

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
    "json": {
      "message": "Error description",
      "code": -32600,
      "data": {
        "code": "TRPC_ERROR_CODE",
        "httpStatus": 400
      }
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
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
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
    // Directory creation is best-effort because writeFileSync below reports any real failure.
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

main().catch((err) => {
  console.error('Script failed:', err)
  process.exit(1)
})
