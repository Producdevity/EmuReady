export type CsvCell = string | number | boolean | null | undefined | Date

/**
 * Convert cell to string for CSV export
 * @param v
 */
function escapeCell(v: CsvCell): string {
  const raw = v instanceof Date ? v.toISOString() : (v ?? '')
  const s = String(raw)
  // Escape quotes by doubling them; wrap in quotes if it contains comma, quote, or newline
  const needsQuote = /[",\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuote ? `"${escaped}"` : escaped
}

/**
 * Build CSV string from header and rows
 * @param header
 * @param rows
 */
export function buildCsvString(header: string[], rows: CsvCell[][]): string {
  const head = header.map(escapeCell).join(',')
  const body = rows.map((r) => r.map(escapeCell).join(',')).join('\n')
  return [head, body].filter(Boolean).join('\n')
}

/**
 * Export CSV file
 * @param params
 * @example exportCsv({ filename: 'data.csv', header: ['a','b'], rows: [['x','y']] })
 */
export function exportCsv(params: { filename: string; header: string[]; rows: CsvCell[][] }): void {
  const csv = buildCsvString(params.header, params.rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = params.filename
  a.click()
  URL.revokeObjectURL(url)
}
