import { ResourceError } from '@/lib/errors'
import { GetDeviceByIdSchema } from '@/schemas/device'
import { GetDevicesSchema } from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { DeviceBrandsRepository } from '@/server/repositories/device-brands.repository'
import { DevicesRepository } from '@/server/repositories/devices.repository'
import { SoCsRepository } from '@/server/repositories/socs.repository'

export const mobileDevicesRouter = createMobileTRPCRouter({
  /**
   * Get devices with optional search, brand filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.getMobile(input ?? {})
  }),

  /**
   * Get all device brands sorted alphabetically
   */
  brands: mobilePublicProcedure.query(async ({ ctx }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    return repository.getAllForMobile()
  }),

  /**
   * Get SOCs (System on Chips)
   */
  socs: mobilePublicProcedure.query(async ({ ctx }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return repository.getAllForMobile()
  }),

  /**
   * Get device by ID
   */
  byId: mobilePublicProcedure.input(GetDeviceByIdSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const device = await repository.getByIdMobile(input.id)
    return device ?? ResourceError.device.notFound()
  }),
})
