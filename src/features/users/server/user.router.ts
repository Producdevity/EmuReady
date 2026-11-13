import { createUserService } from '@/features/users/server/user.service'
import {
  AdminGetSocialListSchema,
  DeleteUserSchema,
  GetAllUsersSchema,
  GetUserByIdSchema,
  GetUserSocialOverviewSchema,
  SearchUsersSchema,
  UpdateUserRoleSchema,
  UpdateUserSchema,
  IsVerifiedDeveloperSchema,
  GetTopContributorsSummarySchema,
} from '@/features/users/shared/user.schemas'
import { MutationSuccessSchema } from '@/schemas/common'
import {
  createTRPCRouter,
  permissionProcedure,
  manageUsersProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { SocialRepository } from '@/server/repositories/social.repository'
import { PERMISSIONS } from '@/utils/permission-system'
import {
  UserSessionOutputSchema,
  TopContributorsOutputSchema,
  OwnUserProfileOutputSchema,
  PublicUserProfileOutputSchema,
  AdminUsersOutputSchema,
  UserSocialOverviewOutputSchema,
  UserSocialListOutputSchema,
  UserStatisticsOutputSchema,
  SearchUsersOutputSchema,
  VerifiedDeveloperOutputSchema,
} from '../shared/user-output.schemas'

export const usersRouter = createTRPCRouter({
  me: publicProcedure.output(UserSessionOutputSchema).query(({ ctx }) => {
    const user = ctx.session?.user
    return user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        }
      : null
  }),
  topContributorsSummary: publicProcedure
    .input(GetTopContributorsSummarySchema)
    .output(TopContributorsOutputSchema)
    .query(({ ctx, input }) => createUserService(ctx.prisma).topContributorsSummary(input.limit)),
  getProfile: protectedProcedure
    .output(OwnUserProfileOutputSchema)
    .query(({ ctx }) =>
      createUserService(ctx.prisma).getProfile(createActorFromSession(ctx.session)),
    ),
  getUserById: publicProcedure
    .input(GetUserByIdSchema)
    .output(PublicUserProfileOutputSchema)
    .query(({ ctx, input }) =>
      createUserService(ctx.prisma).getUserById(createActorFromSession(ctx.session), input),
    ),
  update: protectedProcedure
    .input(UpdateUserSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      createUserService(ctx.prisma).update(createActorFromSession(ctx.session), input),
    ),
  get: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetAllUsersSchema)
    .output(AdminUsersOutputSchema)
    .query(({ ctx, input }) =>
      createUserService(ctx.prisma).getAdminUsers(createActorFromSession(ctx.session), input),
    ),
  getSocialOverview: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetUserSocialOverviewSchema)
    .output(UserSocialOverviewOutputSchema)
    .query(({ ctx, input }) =>
      new SocialRepository(ctx.prisma).adminGetSocialOverview(input.userId),
    ),
  adminGetSocialList: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(AdminGetSocialListSchema)
    .output(UserSocialListOutputSchema)
    .query(({ ctx, input }) =>
      new SocialRepository(ctx.prisma).adminGetSocialList(
        input.userId,
        input.section,
        input.page,
        input.limit,
        input.search,
      ),
    ),
  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS)
    .output(UserStatisticsOutputSchema)
    .query(({ ctx }) =>
      createUserService(ctx.prisma).statistics(createActorFromSession(ctx.session)),
    ),
  updateRole: permissionProcedure(PERMISSIONS.CHANGE_USER_ROLES)
    .input(UpdateUserRoleSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      createUserService(ctx.prisma).updateRole(createActorFromSession(ctx.session), input),
    ),
  delete: manageUsersProcedure
    .input(DeleteUserSchema)
    .output(MutationSuccessSchema)
    .mutation(({ ctx, input }) =>
      createUserService(ctx.prisma).delete(createActorFromSession(ctx.session), input.userId),
    ),
  searchUsers: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(SearchUsersSchema)
    .output(SearchUsersOutputSchema)
    .query(({ ctx, input }) =>
      createUserService(ctx.prisma).search(createActorFromSession(ctx.session), input),
    ),
  isVerifiedDeveloper: protectedProcedure
    .input(IsVerifiedDeveloperSchema)
    .output(VerifiedDeveloperOutputSchema)
    .query(({ ctx, input }) =>
      createUserService(ctx.prisma).isVerifiedDeveloper(
        createActorFromSession(ctx.session),
        input.emulatorId,
      ),
    ),
})
