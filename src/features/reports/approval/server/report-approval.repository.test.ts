import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { ApprovalStatus, PcOs, Prisma } from '@orm'
import { HANDHELD_APPROVAL_SELECT, PC_APPROVAL_SELECT } from './persistence/report-approval.prisma'
import { ReportApprovalRepository } from './report-approval.repository'

vi.unmock('@orm')
vi.unmock('@orm/client')

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  listing: { findMany: vi.fn(), update: vi.fn() },
  pcListing: { findMany: vi.fn(), update: vi.fn() },
  listingCustomFieldValue: { deleteMany: vi.fn(), createMany: vi.fn() },
  pcListingCustomFieldValue: { deleteMany: vi.fn(), createMany: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

const repository = new ReportApprovalRepository(prisma)
const commonInput = {
  id: 'report-1',
  gameId: 'game-1',
  emulatorId: 'emulator-1',
  performanceId: 1,
  status: ApprovalStatus.PENDING,
}

beforeEach(() => {
  vi.clearAllMocks()
  database.listing.findMany.mockResolvedValue([])
  database.pcListing.findMany.mockResolvedValue([])
  database.listing.update.mockResolvedValue({ id: 'report-1', status: ApprovalStatus.PENDING })
  database.pcListing.update.mockResolvedValue({ id: 'report-1', status: ApprovalStatus.PENDING })
})

function createTransaction() {
  const transaction = {
    ...prisma,
    listing: {
      ...prisma.listing,
      update: vi.fn().mockResolvedValue({ id: 'report-1', status: ApprovalStatus.PENDING }),
    },
    pcListing: {
      ...prisma.pcListing,
      update: vi.fn().mockResolvedValue({ id: 'report-1', status: ApprovalStatus.PENDING }),
    },
    listingCustomFieldValue: {
      ...prisma.listingCustomFieldValue,
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    pcListingCustomFieldValue: {
      ...prisma.pcListingCustomFieldValue,
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  }
  database.$transaction.mockImplementation(
    async (operation: (client: Prisma.TransactionClient) => Promise<unknown>) =>
      operation(transaction),
  )
  return transaction
}

describe('report decision persistence', () => {
  it('keeps transaction ownership explicit when a bound client exposes transaction methods', async () => {
    database.$transaction.mockImplementation(
      async (operation: (transaction: Prisma.TransactionClient) => Promise<unknown>) =>
        operation(prisma),
    )
    const nestedOperation = vi.fn()
    await repository.transaction(async (boundRepository) => {
      await expect(async () => boundRepository.transaction(nestedOperation)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
    expect(database.$transaction).toHaveBeenCalledOnce()
    expect(nestedOperation).not.toHaveBeenCalled()
  })

  it.each(['handheld', 'pc'] as const)(
    'loads only pending %s reports in a stable lock order',
    async (reportType) => {
      await repository.pending(['report-1'], reportType)
      const model = reportType === 'handheld' ? database.listing : database.pcListing
      expect(model.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['report-1'] }, status: ApprovalStatus.PENDING },
        select: reportType === 'handheld' ? HANDHELD_APPROVAL_SELECT : PC_APPROVAL_SELECT,
        orderBy: { id: 'asc' },
      })
    },
  )

  it.each(['handheld', 'pc'] as const)(
    'clears reviewer metadata for %s Pending decisions',
    async (reportType) => {
      await repository.setStatus({
        reportId: 'report-1',
        reportType,
        actorId: 'reviewer-1',
        status: ApprovalStatus.PENDING,
        processedAt: new Date(),
        notes: 'Old decision',
      })
      const model = reportType === 'handheld' ? database.listing : database.pcListing
      expect(model.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: ApprovalStatus.PENDING,
            processedAt: null,
            processedByUserId: null,
            processedNotes: null,
          },
        }),
      )
    },
  )

  it('replaces handheld custom fields in the same transaction-owned repository', async () => {
    const transaction = createTransaction()
    await repository.transaction((bound) =>
      bound.updateHandheld(
        {
          ...commonInput,
          deviceId: 'device-1',
          customFieldValues: [{ customFieldDefinitionId: 'field-1', value: { enabled: true } }],
        },
        'reviewer-1',
        ApprovalStatus.REJECTED,
      ),
    )
    expect(database.listing.update).not.toHaveBeenCalled()
    expect(database.pcListing.update).not.toHaveBeenCalled()
    expect(database.listingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(database.pcListingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(transaction.listingCustomFieldValue.deleteMany).toHaveBeenCalledWith({
      where: { listingId: 'report-1' },
    })
    expect(transaction.listingCustomFieldValue.createMany).toHaveBeenCalledWith({
      data: [
        { listingId: 'report-1', customFieldDefinitionId: 'field-1', value: { enabled: true } },
      ],
    })
    expect(transaction.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processedAt: null,
          processedByUserId: null,
          processedNotes: null,
        }),
      }),
    )
  })

  it('replaces PC custom fields and normalizes absent JSON values', async () => {
    const transaction = createTransaction()
    await repository.transaction((bound) =>
      bound.updatePc(
        {
          ...commonInput,
          cpuId: 'cpu-1',
          os: PcOs.WINDOWS,
          osVersion: '11',
          memorySize: 16,
          customFieldValues: [{ customFieldDefinitionId: 'field-1' }],
        },
        'reviewer-1',
        ApprovalStatus.APPROVED,
      ),
    )
    expect(database.listing.update).not.toHaveBeenCalled()
    expect(database.pcListing.update).not.toHaveBeenCalled()
    expect(database.listingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(database.pcListingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(transaction.pcListingCustomFieldValue.deleteMany).toHaveBeenCalledWith({
      where: { pcListingId: 'report-1' },
    })
    expect(transaction.pcListingCustomFieldValue.createMany).toHaveBeenCalledWith({
      data: [
        { pcListingId: 'report-1', customFieldDefinitionId: 'field-1', value: Prisma.JsonNull },
      ],
    })
    expect(transaction.pcListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processedAt: null,
          processedByUserId: null,
          processedNotes: null,
        }),
      }),
    )
  })

  it('preserves custom fields when an edit omits them', async () => {
    const transaction = createTransaction()
    await repository.transaction((bound) =>
      bound.updateHandheld(
        { ...commonInput, deviceId: 'device-1' },
        'reviewer-1',
        ApprovalStatus.PENDING,
      ),
    )
    expect(database.listing.update).not.toHaveBeenCalled()
    expect(database.pcListing.update).not.toHaveBeenCalled()
    expect(database.listingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(database.pcListingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(transaction.listingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(transaction.listingCustomFieldValue.createMany).not.toHaveBeenCalled()
  })

  it('clears custom fields when an edit explicitly supplies an empty array', async () => {
    const transaction = createTransaction()
    await repository.transaction((bound) =>
      bound.updatePc(
        {
          ...commonInput,
          cpuId: 'cpu-1',
          os: PcOs.WINDOWS,
          osVersion: '11',
          memorySize: 16,
          customFieldValues: [],
        },
        'reviewer-1',
        ApprovalStatus.PENDING,
      ),
    )
    expect(database.listing.update).not.toHaveBeenCalled()
    expect(database.pcListing.update).not.toHaveBeenCalled()
    expect(database.listingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(database.pcListingCustomFieldValue.deleteMany).not.toHaveBeenCalled()
    expect(transaction.pcListingCustomFieldValue.deleteMany).toHaveBeenCalledOnce()
    expect(transaction.pcListingCustomFieldValue.createMany).not.toHaveBeenCalled()
  })
})
