import { describe, expect, it } from 'vitest'
import { assertCpuCanBeDeleted, assertCpuModelNameAvailable } from './cpu.rules'

describe('cpu.rules', () => {
  it('allows writes when no model-name conflict exists', () => {
    expect(() => assertCpuModelNameAvailable(null, 'Core i7-13700K')).not.toThrow()
  })

  it('blocks writes when a model-name conflict exists', () => {
    expect(() => assertCpuModelNameAvailable({ id: 'cpu-id' }, 'Core i7-13700K')).toThrow(
      'A CPU with model name "Core i7-13700K" already exists for this brand',
    )
  })

  it('allows deleting unused CPUs', () => {
    expect(() =>
      assertCpuCanBeDeleted({
        id: 'cpu-id',
        _count: { pcListings: 0, presets: 0 },
      }),
    ).not.toThrow()
  })

  it('blocks deleting CPUs used by reports or presets', () => {
    expect(() =>
      assertCpuCanBeDeleted({
        id: 'cpu-id',
        _count: { pcListings: 2, presets: 1 },
      }),
    ).toThrow('Cannot delete CPU that is used in 3 records')
  })
})
