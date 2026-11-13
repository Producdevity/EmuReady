import { createTRPCRouter, permissionProcedure } from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldConfigRepository } from './config.repository'
import { CustomFieldConfigService } from './config.service'
import {
  SaveCustomFieldConfigSchema,
  CustomFieldConfigSnapshotSchema,
  GetCustomFieldConfigSchema,
} from '../shared/config.schemas'

const manageCustomFieldsProcedure = permissionProcedure(PERMISSIONS.MANAGE_CUSTOM_FIELDS)

export const customFieldConfigRouter = createTRPCRouter({
  get: manageCustomFieldsProcedure
    .input(GetCustomFieldConfigSchema)
    .output(CustomFieldConfigSnapshotSchema)
    .query(({ ctx, input }) =>
      new CustomFieldConfigService(new CustomFieldConfigRepository(ctx.prisma)).get(
        createActorFromSession(ctx.session),
        input.emulatorId,
      ),
    ),
  save: manageCustomFieldsProcedure
    .input(SaveCustomFieldConfigSchema)
    .output(CustomFieldConfigSnapshotSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldConfigService(new CustomFieldConfigRepository(ctx.prisma)).save(
        createActorFromSession(ctx.session),
        input,
      ),
    ),
})
