import { describe, expect, it } from 'vitest'
import { type z } from 'zod'
import { refinePaginationOffset } from './pagination'

describe('effective pagination offsets', () => {
  it.each([
    { input: { offset: Number.MAX_SAFE_INTEGER + 1 }, path: ['offset'] },
    { input: { offset: -1 }, path: ['offset'] },
    { input: { page: 0, offset: -1 }, path: ['offset'] },
    { input: { page: Number.MAX_SAFE_INTEGER, limit: 20 }, path: ['page'] },
    { input: { page: 2, limit: -20 }, path: ['page'] },
  ])('rejects the invalid effective offset for $input', (testCase) => {
    const issues: z.IssueData[] = []
    refinePaginationOffset(testCase.input, {
      addIssue: (issue) => issues.push(issue),
      path: [],
    })
    expect(issues).toEqual([expect.objectContaining({ path: testCase.path })])
  })

  it.each([
    {},
    { page: 1, offset: -1, limit: 20 },
    { page: 0, offset: 5, limit: 20 },
    { page: 1, limit: -20 },
    { offset: 0, limit: -20 },
    { page: Number.MAX_SAFE_INTEGER, limit: 0 },
    { page: 2 ** 31, limit: 20 },
    { page: Math.floor(Number.MAX_SAFE_INTEGER / 20) + 1, limit: 20 },
  ])('preserves the supported effective offset for %j', (input) => {
    const issues: z.IssueData[] = []
    refinePaginationOffset(input, {
      addIssue: (issue) => issues.push(issue),
      path: [],
    })
    expect(issues).toEqual([])
  })

  it('reports the configured profile page field', () => {
    const issues: z.IssueData[] = []
    refinePaginationOffset(
      { page: Number.MAX_SAFE_INTEGER, limit: 12 },
      { addIssue: (issue) => issues.push(issue), path: [] },
      ['listingsPage'],
    )
    expect(issues).toEqual([expect.objectContaining({ path: ['listingsPage'] })])
  })
})
