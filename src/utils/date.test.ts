import { describe, it, expect } from 'vitest'
import { useLocalizedDate } from '@/utils/date'

describe('date utilities', () => {
  it('useLocalizedDate hook is exported', () => {
    expect(useLocalizedDate).toBeDefined()
    expect(typeof useLocalizedDate).toBe('function')
  })
})
