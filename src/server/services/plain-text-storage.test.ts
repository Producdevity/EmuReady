import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { PcOs, ReportReason, Role } from '@orm'
import { ReportSubmissionService } from './report-submission.service'

vi.unmock('@orm')
vi.unmock('@orm/client')
const database = vi.hoisted(() => ({
  listing: { findUnique: vi.fn() },
  listingReport: { findUnique: vi.fn(), create: vi.fn() },
  pcListing: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  pcListingReport: { findUnique: vi.fn(), create: vi.fn() },
  game: { findUnique: vi.fn() },
  cpu: { findUnique: vi.fn() },
  emulator: { findUnique: vi.fn() },
  performanceScale: { findUnique: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))
vi.mock('@/server/notifications/reportEvents', () => ({ emitReportCreatedNotification: vi.fn() }))
vi.mock('@/lib/trust/service', () => ({ canUserAutoApprove: vi.fn().mockResolvedValue(false) }))

const textExamples = [
  'resolution=1920x1080; connection=wifi',
  '1 < 2 > 0; 日本語 <3',
  'Use `javascript:` literally in **Markdown**',
  '<script>alert("literal example")</script>',
]

beforeEach(() => {
  vi.clearAllMocks()
  database.listing.findUnique.mockResolvedValue({ id: 'report', authorId: 'author' })
  database.listingReport.findUnique.mockResolvedValue(null)
  database.listingReport.create.mockResolvedValue({ id: 'content-report' })
  database.pcListing.findFirst.mockResolvedValue(null)
  database.pcListing.findUnique.mockResolvedValue({ id: 'pc-report', authorId: 'author' })
  database.pcListing.create.mockResolvedValue({ id: 'pc-report' })
  database.pcListingReport.findUnique.mockResolvedValue(null)
  database.pcListingReport.create.mockResolvedValue({ id: 'content-report' })
  database.game.findUnique.mockResolvedValue({ id: 'game', systemId: 'system' })
  database.cpu.findUnique.mockResolvedValue({ id: 'cpu' })
  database.emulator.findUnique.mockResolvedValue({ id: 'emulator', systems: [{ id: 'system' }] })
  database.performanceScale.findUnique.mockResolvedValue({ id: 1 })
})

describe.each(['handheld', 'pc'] as const)('%s content-report description storage', (kind) => {
  it.each(textExamples)(
    'preserves the text %s while trimming surrounding whitespace',
    async (text) => {
      const service = new ReportSubmissionService(prisma)
      const input = {
        description: `  ${text}\n`,
        reason: ReportReason.SPAM,
        reportedById: 'reporter',
      }
      if (kind === 'pc') await service.createPcListingReport({ ...input, pcListingId: 'pc-report' })
      else await service.createListingReport({ ...input, listingId: 'report' })
      const model = kind === 'pc' ? database.pcListingReport : database.listingReport
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ description: text }) }),
      )
    },
  )
})

describe('PC compatibility report note storage', () => {
  it.each(textExamples)(
    'preserves the notes %s while trimming surrounding whitespace',
    async (text) => {
      await new PcListingsRepository(prisma).create({
        authorId: 'author',
        userRole: Role.USER,
        gameId: 'game',
        cpuId: 'cpu',
        emulatorId: 'emulator',
        performanceId: 1,
        memorySize: 16,
        os: PcOs.LINUX,
        osVersion: 'test',
        notes: `  ${text}\n`,
      })
      expect(database.pcListing.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ notes: text }) }),
      )
    },
  )
})
