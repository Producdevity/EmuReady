import { describe, expect, it } from 'vitest'
import { getCpuLabel } from './cpu-format'

const cpu = {
  id: '4f5a48f9-5173-4db0-9f3b-d10a5aa7a111',
  modelName: 'Ryzen 7 7800X3D',
  brand: {
    id: '4f5a48f9-5173-4db0-9f3b-d10a5aa7a222',
    name: 'AMD',
  },
}

describe('cpu-format', () => {
  it('builds the user-facing CPU label from brand and model', () => {
    expect(getCpuLabel(cpu)).toBe('AMD Ryzen 7 7800X3D')
  })
})
