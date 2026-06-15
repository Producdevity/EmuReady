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
- Feature-owned modules may colocate client, server, and shared code under
  `src/features/<domain>/<module>/`.
- Use this feature module structure for new or actively-refactored domain code:
  - `shared/` contains Zod schemas, types, constants, and pure formatting helpers usable by client and server.
  - `server/` contains repositories, services, policies, mappers, and feature-owned tRPC routers.
  - `client/` contains hooks, reusable components, and workflow views. Add client API wrappers only when they remove real duplication or encode a stable UI contract.
  - `client/admin/` is allowed for admin-only workflows.
- Import direction matters more than folder names:
  - `client/` may import from its feature `shared/` and app-wide client-safe utilities.
  - `server/` may import from its feature `shared/`, server utilities, and repositories.
  - `shared/` must not import from `client/`, `server/`, `src/app`, or server-only libraries.
  - `src/app/**` routes/pages should compose feature modules; feature modules should not import from `src/app/**`.
- tRPC routers are transport adapters. Feature-specific routers should live in the feature `server/` folder when that feature owns the full use case; `src/server/api/root.ts` should only compose them.
- Legacy routers in `src/server/api/routers/` are thin orchestration layers. They handle auth context, schema-validated input, repository/service calls, and response formatting.
- Do not put raw Prisma queries or business logic in routers.
- Define Zod schemas in feature `shared/*.schemas.ts` for feature-owned code, or in `src/schemas/*` for legacy/shared code. Do not define inline schemas in router `.input(...)` calls.
- Feature-owned tRPC procedures should declare `.output(...)` with Zod schemas. Compatibility transports that must keep legacy shapes should still have explicit legacy output schemas instead of returning raw Prisma payloads by convention.
- All database access belongs in repository classes. Feature-owned repositories may live in feature `server/` folders; legacy/shared repositories may remain under `src/server/repositories/`.
- New or actively-refactored feature-owned Prisma repositories should extend `PrismaRepository` or `PrismaWriteRepository` from `src/server/persistence/prisma.repository.ts` for Prisma client ownership and shared write handling. Do not extend the legacy `BaseRepository` unless the inherited behavior is deliberately required and documented.
- Do not add generic CRUD methods to shared repository bases. Prisma already provides typed CRUD; feature repositories should expose domain/use-case persistence operations with named select contracts.
- For feature-owned Prisma repositories, prefer a `server/persistence/` subfolder for named `select` contracts, query builders, and Prisma error translation. Derive repository record types from Prisma `GetPayload` plus those named `select` contracts instead of hand-maintaining structural copies.
- Services should depend on the concrete feature repository by default. Do not add service-owned `Pick<Repository, ...>` contracts only for tests.
- Add repository interfaces only for real boundaries: multiple implementations, external provider adapters, lifecycle concerns that route composition cannot handle directly, or domain/application layers that intentionally must not depend on infrastructure.
- Repositories should use project error helpers and consistent database operation handling.
- Multi-step business logic, external API orchestration, and complex calculations belong in services under feature `server/` folders or legacy `src/server/services/`.
- Use policy functions for reusable authorization/business access rules that must be shared across transports. Routers may still use broad auth procedures, but services should enforce feature-level capabilities when the use case can be called from multiple transports.
- Use `AppError` and `ResourceError` helpers instead of raw `Error`, raw strings, or one-off `TRPCError` usage.
- Use specialized procedures such as `protectedProcedure`, `adminProcedure`, and `permissionProcedure(...)` instead of ad hoc permission checks.

## API Compatibility And Legacy Contracts

- Before introducing any `legacy` select, repository method, route, endpoint,
  schema, type, mapper, compatibility branch, or response shape, audit known
  consumers first. For mobile/public API work, this includes
  `/Volumes/T9/Coding/personal/2026/Emulation/EmuReadyApp` when it is available,
  or a temporary clone of `Producdevity/EmuReadyApp` on the `master` branch when
  the local app checkout is unavailable or not production-synced.
- Record which fields consumers actually read. Do not preserve fields only
  because they existed in an old Prisma payload, old inferred type, or old API
  response.
- Decide compatibility case by case: remove unused old fields, migrate the
  consumer, keep one standardized endpoint with a small low-cost superset, or
  keep a separate legacy contract only when the audited consumer behavior truly
  requires it.
- Legacy contracts must have an owner, a reason, and an expected removal path.
  Remove legacy code as soon as audited consumers do not need it.

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
- Prefer deriving types from existing contracts instead of hand-maintaining
  structural copies. Use Prisma `GetPayload`, Zod `z.input`/`z.output`, tRPC
  `RouterInput`/`RouterOutput`, `ReturnType`, and `typeof` on const contracts
  before adding a new interface or structural type alias. Add new manual
  interfaces/types only for genuinely new UI/application state or external
  boundaries that cannot be inferred, and keep them narrow and local.
- Do not add unused functions, exports, or speculative helpers.
- Remove dead code when refactoring.
- Do not remove or rewrite existing TODO comments unless the user explicitly
  asks, or unless the TODO is directly made obsolete by the code change.
- Prefer function declarations for top-level functions/components.
- Avoid object destructuring when values are used only once or when it makes
  ownership less clear. Prefer `object.property` access unless destructuring
  materially improves readability.
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

## Filters And Selects

- Filter controllers own behavior and analytics: interaction handlers, collapsed badges, active summaries, and calls into presentational content.
- Filter content components should stay presentational. URL/state hooks own URL sync and local UI state, and must not emit per-filter analytics.
- Emit filter analytics once from controllers after calling `onChange`, using `filterAnalytics` and `selectedLabels`.
- Reuse shared filter primitives (`FilterSidebarShell`, `CollapsedBadges`, `ActiveFiltersSummary`, `MobileFilterSheet`) and option mappers from `src/utils/options.ts`.
- Async entity filters must wrap `src/components/ui/form/async-multi-select/AsyncMultiSelect.tsx`. CPU, GPU, Device, and SoC wrappers should only query, map options, manage pagination, and pass data to the base component.
- Selected async chips must derive from `options` plus `selectedByIds` so URL-loaded selections survive when their option is not on the current page.

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
