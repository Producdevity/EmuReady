#!/usr/bin/env tsx

import { writeFileSync } from 'fs'
import { join } from 'path'
import { generateOpenAPISpec } from './auto-generate-api-spec'

/**
 * Script to generate the mobile API documentation in OpenAPI format
 * and create a markdown summary for easy reference.
 * TODO: use '@asteasolutions/zod-to-openapi"
 */
export async function generateApiDocs() {
  console.log('🚀 Generating Mobile API Documentation...')

  try {
    // Generate the OpenAPI spec
    const spec = generateOpenAPISpec()

    // Write to static file for faster access
    const outputPath = join(
      process.cwd(),
      'public',
      'api-docs',
      'api-openapi.json',
    )
    writeFileSync(outputPath, JSON.stringify(spec, null, 2))

    console.log('✅ Generated OpenAPI spec:', outputPath)

    // Generate procedure count summary
    const procedureCount = Object.keys(spec.paths || {}).length
    const tags =
      (spec.tags as Array<{ name: string; description?: string }>)?.map(
        (tag) => tag.name,
      ) || []

    console.log(`📊 API Summary:`)
    console.log(`   - ${procedureCount} endpoints`)
    console.log(`   - ${tags.length} categories: ${tags.join(', ')}`)

    // Generate markdown summary
    const markdownSummary = `# Mobile API Documentation

Auto-generated on: ${new Date().toISOString()}

## Summary
- **Total Endpoints**: ${procedureCount}
- **Categories**: ${tags.join(', ')}
- **OpenAPI Version**: ${spec.openapi}

## Base URL
\`${(spec.servers as Array<{ url: string; description?: string }>)?.[0]?.url || '/api/mobile/trpc'}\`

## Authentication
Most endpoints require Bearer token authentication using Clerk JWT.

## Interactive Documentation
- **Swagger UI**: [/docs/mobile-api/swagger](/docs/mobile-api/swagger)
- **OpenAPI JSON**: [/api/docs/api/openapi.json](/api/docs/api/openapi.json)

---
*This documentation is automatically generated from TRPC procedures and Zod schemas.*
`

    const readmePath = join(
      process.cwd(),
      'docs',
      'MOBILE_API_AUTO_GENERATED.md',
    )
    writeFileSync(readmePath, markdownSummary)

    console.log('✅ Generated markdown summary:', readmePath)
    console.log('🎉 API documentation generation complete!')
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateApiDocs()
}
