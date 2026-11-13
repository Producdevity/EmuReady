import { MutationSuccessSchema } from '@/schemas/common'
import { createTRPCRouter, adminProcedure, superAdminProcedure } from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { CustomFieldTemplateRepository } from './template.repository'
import { CustomFieldTemplateService } from './template.service'
import { TemplateOutputSchema, ApplyTemplateOutputSchema } from '../shared/template-output.schemas'
import {
  CreateCustomFieldTemplateSchema,
  UpdateCustomFieldTemplateSchema,
  GetCustomFieldTemplateByIdSchema,
  DeleteCustomFieldTemplateSchema,
  ApplyCustomFieldTemplateSchema,
} from '../shared/template.schemas'

export const customFieldTemplateRouter = createTRPCRouter({
  get: adminProcedure
    .output(TemplateOutputSchema.array())
    .query(({ ctx }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).list(
        createActorFromSession(ctx.session),
      ),
    ),
  byId: adminProcedure
    .input(GetCustomFieldTemplateByIdSchema)
    .output(TemplateOutputSchema)
    .query(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).get(
        createActorFromSession(ctx.session),
        input.id,
      ),
    ),
  create: superAdminProcedure
    .input(CreateCustomFieldTemplateSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).create(
        createActorFromSession(ctx.session),
        input,
      ),
    ),
  update: superAdminProcedure
    .input(UpdateCustomFieldTemplateSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).update(
        createActorFromSession(ctx.session),
        input,
      ),
    ),
  delete: superAdminProcedure
    .input(DeleteCustomFieldTemplateSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).delete(
        createActorFromSession(ctx.session),
        input.id,
      ),
    ),
  duplicate: superAdminProcedure
    .input(GetCustomFieldTemplateByIdSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).duplicate(
        createActorFromSession(ctx.session),
        input.id,
      ),
    ),
  applyToEmulator: superAdminProcedure
    .input(ApplyCustomFieldTemplateSchema)
    .output(ApplyTemplateOutputSchema)
    .mutation(({ ctx, input }) =>
      new CustomFieldTemplateService(new CustomFieldTemplateRepository(ctx.prisma)).apply(
        createActorFromSession(ctx.session),
        input,
      ),
    ),
})
