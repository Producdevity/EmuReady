import { describe, expect, it } from 'vitest'
import { getSelectedOptionNames } from './selectedLabels'

describe('getSelectedOptionNames', () => {
  it('keeps names aligned with selected IDs regardless of option order', () => {
    expect(
      getSelectedOptionNames(
        [
          { id: 'device-a', name: 'Device A' },
          { id: 'device-b', name: 'Device B' },
        ],
        ['device-b', 'device-a'],
      ),
    ).toEqual(['Device B', 'Device A'])
  })

  it('uses unresolved IDs as names while URL-restored options are loading', () => {
    expect(
      getSelectedOptionNames([{ id: 'soc-a', name: 'SoC A' }], ['soc-pending', 'soc-a']),
    ).toEqual(['soc-pending', 'SoC A'])
    expect(getSelectedOptionNames([], ['device-pending'])).toEqual(['device-pending'])
  })

  it('does not include options that are not selected', () => {
    expect(
      getSelectedOptionNames(
        [
          { id: 'device-a', name: 'Device A' },
          { id: 'device-b', name: 'Device B' },
        ],
        ['device-a'],
      ),
    ).toEqual(['Device A'])
    expect(getSelectedOptionNames([{ id: 'device-a', name: 'Device A' }], [])).toEqual([])
  })
})
