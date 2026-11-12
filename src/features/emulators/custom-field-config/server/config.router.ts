import { createTRPCRouter, permissionProcedure } from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldConfigRepository } from './config.repository'
import { CustomFieldConfigService } from './config.service'
import {
  ApplyCustomFieldConfigSchema,
  CustomFieldConfigSnapshotSchema,
  CustomFieldConfigSourcesSchema,
  GetCustomFieldConfigSchema,
} from '../shared/config.schemas'

const manageCustomFieldsProcedure = permissionProcedure(PERMISSIONS.MANAGE_CUSTOM_FIELDS)

export const customFieldConfigRouter = createTRPCRouter({
  sources: manageCustomFieldsProcedure
    .output(CustomFieldConfigSourcesSchema)
    .query(({ ctx }) =>
      new CustomFieldConfigService(new CustomFieldConfigRepository(ctx.prisma)).sources(
        createActorFromSession(ctx.session),
      ),
    ),
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
    .input(ApplyCustomFieldConfigSchema)
    .output(CustomFieldConfigSnapshotSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldConfigService(new CustomFieldConfigRepository(ctx.prisma)).apply(
        createActorFromSession(ctx.session),
        input,
      ),
    ),
})
