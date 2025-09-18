import { promises as fs } from 'node:fs'
import path from 'node:path'
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarkdownRenderer } from '@/components/ui/form/MarkdownRenderer'
import { logger } from '@/lib/logger'
import { generatePageMetadata } from '@/lib/seo/metadata'

const mobileApiDocPath = path.join(process.cwd(), 'docs', 'MOBILE_API.md')

async function loadMobileApiDocumentation(): Promise<string | null> {
  try {
    return await fs.readFile(mobileApiDocPath, 'utf8')
  } catch (error) {
    logger.error('Failed to load mobile API documentation markdown', error)
    return null
  }
}

export const metadata: Metadata = generatePageMetadata(
  'Mobile API Reference',
  'Rendered Markdown reference for the EmuReady Mobile API including authentication, endpoints, and examples.',
  '/docs/api/reference',
)

export default async function MobileApiReferencePage() {
  const markdown = await loadMobileApiDocumentation()

  if (!markdown) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          EmuReady Mobile API Reference
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
          Documentation for the API including router summaries, authentication, and usage examples.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <MarkdownRenderer content={markdown} className="prose-lg" />
      </div>
    </div>
  )
}
