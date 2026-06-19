import { describe, expect, it } from 'vitest'
import { getGpuLabel } from './gpu-format'

const gpu = {
  id: '4f5a48f9-5173-4db0-9f3b-d10a5aa7a111',
  modelName: 'GeForce RTX 4090',
  brand: {
    id: '4f5a48f9-5173-4db0-9f3b-d10a5aa7a222',
    name: 'NVIDIA',
  },
}

describe('gpu-format', () => {
  it('builds the user-facing GPU label from brand and model', () => {
    expect(getGpuLabel(gpu)).toBe('NVIDIA GeForce RTX 4090')
  })
})
