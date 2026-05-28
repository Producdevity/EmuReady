# Project Guide

This file is the source of working guidance for AI coding agents in this repository.

## Commands

- Use `pnpm`, not `npm` or `npx`.
- Common checks:
  - `pnpm lint`
  - `pnpm types`
  - `pnpm test`
  - `pnpm check`
- Prisma:
  - `pnpm db:generate` generates Prisma Client and TypedSQL.
  - `pnpm prisma validate` validates the schema.
  - Database-backed Prisma commands must use the project scripts that wrap `scripts/db-cmd.sh` when available.
- Do not run `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm run deploy`, migrations, seeds, or data scripts unless the user explicitly asks.
- Never deploy, commit, or push unless the user explicitly asks for that exact
  action. Requests to fix a PR, update a PR, address review comments, check CI,
  or prepare changes do not imply permission to commit or push.
- Use the current git user as commit author; never add Codex/AI authorship or AI-themed branch names.

## Domain Rules

- A Listing is a handheld compatibility report: game plus handheld device plus emulator.
- A PC Listing is a PC compatibility report: game plus PC hardware plus emulator.
- User-facing UI should say "Compatibility Report", "Handheld Report", "PC Report", or "PC Compatibility Report", not "listing".
- Listings and PC Listings must stay behaviorally aligned for voting, comments, moderation, trust effects, notifications, and approval flows.
- Shared cross-listing behavior belongs in utilities instead of duplicated implementations.

## Architecture

- Feature folders should follow the project-structure guidance from Bulletproof React:
  https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
- Within `src/features/*`, prefer scoped subdirectories such as `components`, `hooks`, `utils`, `server`, and `shared` instead of flat feature folders.
- Routers in `src/server/api/routers/` are thin orchestration layers. They handle auth context, schema-validated input, repository/service calls, and response formatting.
- Do not put raw Prisma queries or business logic in routers.
- Define Zod schemas in `src/schemas/*`; do not define inline schemas in router `.input(...)` calls.
- All database access belongs in repository classes under `src/server/repositories/` extending `BaseRepository`.
- Repositories should use project error helpers and consistent database operation handling.
- Multi-step business logic, external API orchestration, and complex calculations belong in services under `src/server/services/`.
- Use `AppError` and `ResourceError` helpers instead of raw `Error`, raw strings, or one-off `TRPCError` usage.
- Use specialized procedures such as `protectedProcedure`, `adminProcedure`, and `permissionProcedure(...)` instead of ad hoc permission checks.

## Database And Prisma

- Treat database changes as high risk.
- Do not run migrations, seeds, `db:push`, or data scripts without explicit user approval.
- Prisma migration commands may only target the local database configured by `.env.local`, never a hosted or Supabase database, unless the user explicitly instructs otherwise.
- Do not create or edit migration SQL manually. Use Prisma migration commands.
- Do not edit an existing migration after it has been created. Create a new migration when a schema change is required.
- Prefer `migrate deploy` for applying migrations. Never use `db:push` outside disposable local development.
- Prisma Client is generated to `prisma/generated/client`; app imports use `@orm`, `@orm/client`, and `@orm/sql`.
- Use `pnpm prisma ...` or project `pnpm db:*` scripts, not `npx prisma`.

## TypeScript And Code Quality

- Do not use `any` or `z.any()`. Use concrete types, discriminated unions, or `unknown` with narrowing.
- Do not use `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` comments.
- Do not use casts to hide type problems. Fix the underlying type issue.
- Handle null and undefined explicitly.
- Use generated Prisma types where appropriate.
- Do not add unused functions, exports, or speculative helpers.
- Remove dead code when refactoring.
- Do not remove or rewrite existing TODO comments unless the user explicitly
  asks, or unless the TODO is directly made obsolete by the code change.
- Prefer function declarations for top-level functions/components.
- Component props interfaces should be named `Props`.
- Do not destructure component props in function parameters; use `props.foo`.
- Keep `useEffect` dependencies correct.
- Comments should be rare, factual, and explain only non-obvious external constraints or business invariants.

## Enums

- Import enum values from `@orm`; do not use string literals for enum values in application code.
- This applies to UI state, filters, schemas, comparisons, routers, services, and repositories.
- Prefer `z.nativeEnum(SomeEnum)` over hard-coded `z.enum([...])` when a Prisma enum exists.
- Tests may use string literals only when mocking requires it.

## UI

- Before adding custom UI markup, check existing components in `src/components/ui/`.
- Prefer extending shared UI components over duplicating badge, button, modal, table, loading, card, or form markup.
- Use `Button`, `Badge`, `Card`, table utilities, form components, `LoadingSpinner`, and dialog components from the shared UI library where applicable.
- Never use `window.confirm()`. Use `useConfirmDialog` from `@/components/ui`.
- Keep admin pages consistent: table controls, search/filtering, pagination, statistics, and bulk actions should follow existing admin patterns.

## Filters

- Controllers own filter behavior: interactions, analytics, collapsed badges, active summaries, and calls into presentational content.
- Content components should only render fields and call handlers passed by controllers.
- URL/state hooks own URL sync and local UI state; they must not emit per-filter analytics.
- Filter analytics should be emitted once from controllers, using `filterAnalytics` and `selectedLabels`.
- Call `onChange` before emitting analytics.
- Use shared filter UI pieces: `FilterSidebarShell`, `CollapsedBadges`, `ActiveFiltersSummary`, and `MobileFilterSheet`.
- Use shared option mappers from `src/utils/options.ts`.

## Async Multi-Selects

- Use `src/components/ui/form/async-multi-select/AsyncMultiSelect.tsx` as the base.
- Entity wrappers such as CPU, GPU, Device, and SoC selects should stay thin: call TRPC, map to `Option[]`, manage pagination state, and pass data to the base component.
- Selected chips must persist by deriving them from `options` plus `selectedByIds`.

## Security

- For write operations, never trust a user ID supplied by input when ownership matters. Use `ctx.session.user.id`.
- Pass `requestingUserRole` when admin override behavior is supported.
- Reads may accept user IDs for filtering, but writes must validate ownership or permission.
- Use transactions for multi-step writes that must stay consistent.
- Validate input at API boundaries with Zod schemas.

## Verification

- Run the smallest relevant checks first, then broader checks when risk warrants it.
- Before claiming a fix is complete, verify the actual failing behavior when possible.
- For API changes, exercise the endpoint or generated contract.
- For UI changes, run the relevant UI/test path.
- For Prisma changes, run schema validation and generation. Only run migration commands with explicit approval.
- If a check cannot be run, report the exact blocker.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
