import { describe, expect, it } from 'vitest'
import { translateGpuWriteError } from './gpu.errors'

function prismaError(code: string): Error {
  const error = new Error(`Prisma ${code}`)
  Object.assign(error, { code })
  return error
}

describe('translateGpuWriteError', () => {
  it('maps create and update foreign key failures to missing GPU brand errors', () => {
    expect(() =>
      translateGpuWriteError(prismaError('P2003'), {
        action: 'create',
        modelName: 'GeForce RTX 4090',
      }),
    ).toThrow('Device brand not found')

    expect(() =>
      translateGpuWriteError(prismaError('P2003'), {
        action: 'update',
        modelName: 'GeForce RTX 4090',
      }),
    ).toThrow('Device brand not found')
  })

  it('maps delete foreign key failures to an in-use GPU error without inventing a count', () => {
    expect(() => translateGpuWriteError(prismaError('P2003'), { action: 'delete' })).toThrow(
      'Cannot delete GPU as it is currently in use',
    )

    expect(() => translateGpuWriteError(prismaError('P2003'), { action: 'delete' })).not.toThrow(
      '1 records',
    )
  })

  it('maps update and delete missing-record failures to GPU not found', () => {
    expect(() =>
      translateGpuWriteError(prismaError('P2025'), {
        action: 'update',
        modelName: 'GeForce RTX 4090',
      }),
    ).toThrow('GPU not found')

    expect(() => translateGpuWriteError(prismaError('P2025'), { action: 'delete' })).toThrow(
      'GPU not found',
    )
  })

  it('does not report impossible create missing-record failures as GPU not found', () => {
    expect(() =>
      translateGpuWriteError(prismaError('P2025'), {
        action: 'create',
        modelName: 'GeForce RTX 4090',
      }),
    ).toThrow('Database error during GPU create')
  })
})
