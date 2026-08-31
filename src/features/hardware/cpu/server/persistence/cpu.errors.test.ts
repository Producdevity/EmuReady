import { describe, expect, it } from 'vitest'
import { translateCpuWriteError } from './cpu.errors'

function prismaError(code: string): Error {
  const error = new Error(`Prisma ${code}`)
  Object.assign(error, { code })
  return error
}

describe('translateCpuWriteError', () => {
  it('maps create and update foreign key failures to missing CPU brand errors', () => {
    expect(() =>
      translateCpuWriteError(prismaError('P2003'), {
        action: 'create',
        modelName: 'Core i7-13700K',
      }),
    ).toThrow('Device brand not found')

    expect(() =>
      translateCpuWriteError(prismaError('P2003'), {
        action: 'update',
        modelName: 'Core i7-13700K',
      }),
    ).toThrow('Device brand not found')
  })

  it('maps delete foreign key failures to an in-use CPU error without inventing a count', () => {
    expect(() => translateCpuWriteError(prismaError('P2003'), { action: 'delete' })).toThrow(
      'Cannot delete CPU as it is currently in use',
    )

    expect(() => translateCpuWriteError(prismaError('P2003'), { action: 'delete' })).not.toThrow(
      '1 records',
    )
  })

  it('maps update and delete missing-record failures to CPU not found', () => {
    expect(() =>
      translateCpuWriteError(prismaError('P2025'), {
        action: 'update',
        modelName: 'Core i7-13700K',
      }),
    ).toThrow('CPU not found')

    expect(() => translateCpuWriteError(prismaError('P2025'), { action: 'delete' })).toThrow(
      'CPU not found',
    )
  })

  it('does not report impossible create missing-record failures as CPU not found', () => {
    expect(() =>
      translateCpuWriteError(prismaError('P2025'), {
        action: 'create',
        modelName: 'Core i7-13700K',
      }),
    ).toThrow('Database error during CPU create')
  })
})
