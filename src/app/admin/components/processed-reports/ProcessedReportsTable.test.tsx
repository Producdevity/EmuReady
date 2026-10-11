import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type UseAdminTableReturn } from '@/hooks/admin'
import { type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'
import { ProcessedReportsTable } from './ProcessedReportsTable'
import { type ProcessedReportAccessors } from './types'

type Report = Pick<
  RouterOutput['listings']['getProcessed']['listings'][number],
  'id' | 'author' | 'processedByUser' | 'processedAt'
>

const table: UseAdminTableReturn<string> = {
  search: '',
  setSearch: vi.fn(),
  handleSearchChange: vi.fn(),
  debouncedSearch: '',
  isSearching: false,
  page: 1,
  setPage: vi.fn(),
  limit: 20,
  sortField: null,
  setSortField: vi.fn(),
  sortDirection: null,
  setSortDirection: vi.fn(),
  handleSort: vi.fn(),
  additionalParams: {},
  setAdditionalParam: vi.fn(),
  updateUrl: vi.fn(),
  resetFilters: vi.fn(),
}

const accessors: ProcessedReportAccessors<Report> = {
  getId: (report) => report.id,
  getAuthor: (report) => report.author,
  getProcessedBy: (report) => report.processedByUser,
  getProcessedAt: (report) => report.processedAt,
  getGameTitle: () => 'Test game',
  getSystemName: () => 'Test system',
  getEmulatorName: () => 'Test emulator',
  getEmulatorLogo: () => null,
  getProcessedNotes: () => null,
  getStatus: () => ApprovalStatus.APPROVED,
  getEditHref: (report) => `/admin/listings/${report.id}/edit`,
  getViewHref: (report) => `/listings/${report.id}`,
}

const visibleColumns = new Set(['author', 'processedBy', 'actions'])

describe('ProcessedReportsTable identity labels', () => {
  it.each([
    {
      author: { id: 'author-1', name: 'Author' },
      processedByUser: { id: 'moderator-1', name: 'Moderator' },
      processedAt: new Date('2026-09-25T12:00:00Z'),
      authorLabel: 'Author',
      moderatorLabel: 'Moderator',
    },
    {
      author: { id: 'author-1', name: null },
      processedByUser: { id: 'moderator-1', name: null },
      processedAt: new Date('2026-09-25T12:00:00Z'),
      authorLabel: 'Unknown',
      moderatorLabel: 'Unknown',
    },
    {
      author: null,
      processedByUser: null,
      processedAt: new Date('2026-09-25T12:00:00Z'),
      authorLabel: 'Anonymous',
      moderatorLabel: 'Deleted account',
    },
    {
      author: null,
      processedByUser: null,
      processedAt: null,
      authorLabel: 'Anonymous',
      moderatorLabel: 'N/A',
    },
  ])('renders $authorLabel author and $moderatorLabel processor correctly', (scenario) => {
    render(
      <ProcessedReportsTable
        table={table}
        reports={[{ id: 'report-1', ...scenario }]}
        hardwareColumns={[]}
        columnVisibility={{
          visibleColumns,
          isColumnVisible: (column) => visibleColumns.has(column),
          toggleColumn: vi.fn(),
          showColumn: vi.fn(),
          hideColumn: vi.fn(),
          showAll: vi.fn(),
          hideAll: vi.fn(),
          resetToDefaults: vi.fn(),
          isHydrated: true,
        }}
        accessors={accessors}
        reportLabel="Handheld Report"
        analyticsContext="processed-reports"
        showSystemIcons={false}
        isSystemIconsHydrated
        showEmulatorLogos={false}
        isEmulatorLogosHydrated
        canEditReports={false}
        canOverrideReports={false}
        canViewUsers
        isOverridePending={false}
        onOpenOverrideModal={vi.fn()}
      />,
    )

    const [authorCell, moderatorCell] = screen.getAllByRole('cell')
    expect(authorCell).toHaveTextContent(scenario.authorLabel)
    expect(moderatorCell).toHaveTextContent(scenario.moderatorLabel)

    if (scenario.author) {
      expect(within(authorCell).getByRole('link', { name: scenario.authorLabel })).toHaveAttribute(
        'href',
        '/admin/users?userId=author-1',
      )
      expect(screen.getByTitle('View User Details')).toBeInTheDocument()
    } else {
      expect(within(authorCell).queryByRole('link')).not.toBeInTheDocument()
      expect(screen.queryByTitle('View User Details')).not.toBeInTheDocument()
    }
  })
})
