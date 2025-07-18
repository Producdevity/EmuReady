import { GetCustomFieldDefinitionsByEmulatorSchema } from '@/schemas/customFieldDefinition'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'

export const mobileCustomFieldDefinitionsRouter = createMobileTRPCRouter({
  /**
   * Get custom field definitions by emulator (for mobile listing creation)
   */
  getByEmulator: mobilePublicProcedure
    .input(GetCustomFieldDefinitionsByEmulatorSchema)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customFieldDefinition.findMany({
        where: { emulatorId: input.emulatorId },
        orderBy: { displayOrder: 'asc' },
        include: {
          emulator: {
            select: { id: true, name: true },
          },
        },
      })
    }),
})
