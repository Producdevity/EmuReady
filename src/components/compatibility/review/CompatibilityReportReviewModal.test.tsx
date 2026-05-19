import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import { ApprovalStatus, CustomFieldType } from '@orm'
import {
  CompatibilityReportReviewModal,
  type CompatibilityReportReviewItem,
} from './CompatibilityReportReviewModal'

vi.mock('@/hooks', () => ({
  useEmulatorLogos: () => ({
    showEmulatorLogos: true,
    setShowEmulatorLogos: () => undefined,
    isHydrated: true,
    toggleEmulatorLogos: () => undefined,
  }),
}))

const baseReport: CompatibilityReportReviewItem = {
  game: {
    title: 'Mario Kart 8 Deluxe',
    imageUrl: null,
    system: { name: 'Nintendo Switch', key: 'switch' },
  },
  hardware: {
    type: 'device',
    device: { brand: { name: 'ASUS' }, modelName: 'ROG Ally' },
  },
  emulator: { name: 'Ryujinx', logo: null },
  author: { id: 'author-1', name: 'Reviewer' },
  createdAt: new Date('2026-05-19T10:00:00Z'),
  performance: { rank: 4, label: 'Great', description: 'Runs well' },
  notes: 'Runs at a stable frame rate.',
  customFieldValues: [
    {
      value: '1.2.3',
      customFieldDefinition: {
        type: CustomFieldType.TEXT,
        label: 'Emulator Version',
        name: 'emulator_version',
      },
    },
  ],
  authorRiskProfile: {
    authorId: 'author-1',
    highestSeverity: 'low',
    signals: [
      {
        type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
        severity: 'low',
        label: 'New Author',
        description: 'No previously approved listings',
      },
    ],
  },
  submissionRiskProfile: {
    listingId: 'listing-1',
    highestSeverity: 'high',
    signals: [
      {
        type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
        severity: 'high',
        label: 'Placeholder Emulator Version',
        description: 'Submitted emulator version resembles placeholder text.',
      },
    ],
  },
}

function renderReviewModal(overrides: Partial<CompatibilityReportReviewItem> = {}) {
  const onClose = vi.fn()
  const onSubmit = vi.fn()
  const onRejectionNotesChange = vi.fn()
  const report = { ...baseReport, ...overrides }

  render(
    <CompatibilityReportReviewModal
      isOpen
      onClose={onClose}
      decision={ApprovalStatus.APPROVED}
      reportLabel="Listing"
      report={report}
      rejectionNotes=""
      onRejectionNotesChange={onRejectionNotesChange}
      onSubmit={onSubmit}
      isSubmitting={false}
    />,
  )

  return { onClose, onSubmit, onRejectionNotesChange }
}

describe('CompatibilityReportReviewModal', () => {
  it('shows combined review risk and custom fields for approval', () => {
    renderReviewModal()

    expect(
      screen.getByRole('dialog', { name: 'Approve Listing: Mario Kart 8 Deluxe' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Review Risk Warning')).toBeInTheDocument()
    expect(screen.getByText('Submission Risk')).toBeInTheDocument()
    expect(screen.getByText('Author Risk')).toBeInTheDocument()
    expect(screen.getByText('Emulator Settings')).toBeInTheDocument()
    expect(screen.getByText('Emulator Version')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve Anyway' })).toBeInTheDocument()
  })

  it('uses the same rejection presets for detail and admin review flows', () => {
    const onRejectionNotesChange = vi.fn()

    render(
      <CompatibilityReportReviewModal
        isOpen
        onClose={vi.fn()}
        decision={ApprovalStatus.REJECTED}
        reportLabel="PC Listing"
        report={{
          ...baseReport,
          hardware: {
            type: 'pc',
            cpu: { brand: { name: 'AMD' }, modelName: 'Ryzen 7' },
            gpu: { brand: { name: 'NVIDIA' }, modelName: 'RTX 4070' },
          },
        }}
        rejectionNotes=""
        onRejectionNotesChange={onRejectionNotesChange}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Reject PC Listing: Mario Kart 8 Deluxe' }),
    ).toBeInTheDocument()
    expect(screen.getByText('CPU:')).toBeInTheDocument()
    expect(screen.getByText(/Ryzen 7/)).toBeInTheDocument()
    expect(screen.getByText('GPU:')).toBeInTheDocument()
    expect(screen.getByText(/RTX 4070/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Missing information'))

    expect(onRejectionNotesChange).toHaveBeenCalledWith('Missing information')
    expect(screen.getByRole('button', { name: 'Confirm Rejection' })).toBeInTheDocument()
  })
})
