import { describe, expect, it } from 'vitest'
import { assertGpuCanBeDeleted, assertGpuModelNameAvailable } from './gpu.rules'

describe('gpu.rules', () => {
  it('allows writes when no model-name conflict exists', () => {
    expect(() => assertGpuModelNameAvailable(null, 'GeForce RTX 4090')).not.toThrow()
  })

  it('blocks writes when a model-name conflict exists', () => {
    expect(() => assertGpuModelNameAvailable({ id: 'gpu-id' }, 'GeForce RTX 4090')).toThrow(
      'A GPU with model name "GeForce RTX 4090" already exists for this brand',
    )
  })

  it('allows deleting unused GPUs', () => {
    expect(() =>
      assertGpuCanBeDeleted({
        id: 'gpu-id',
        _count: { pcListings: 0, presets: 0 },
      }),
    ).not.toThrow()
  })

  it('blocks deleting GPUs used by reports or presets', () => {
    expect(() =>
      assertGpuCanBeDeleted({
        id: 'gpu-id',
        _count: { pcListings: 2, presets: 1 },
      }),
    ).toThrow('Cannot delete GPU that is used in 3 records')
  })
})
