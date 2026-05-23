# Contributing to EmuReady

EmuReady is a community-maintained emulation compatibility platform. Keep contributions scoped, tested, and consistent with the existing architecture.

## Issues and Security

Before opening an issue, search existing [issues](https://github.com/Producdevity/emuready/issues) and check the [README](README.md) plus relevant files in [docs](docs).

Good bug reports include reproduction steps, expected vs actual behavior, relevant browser/device/emulator context, and logs or screenshots when useful.

Feature requests should describe the user or moderator problem, the proposed behavior, and any obvious data, moderation, security, or performance tradeoffs.

Do not report security issues in public GitHub issues. Contact a maintainer privately on Discord.

## Local Setup

Prerequisites:

- Node.js `v22.17.0`, matching [.nvmrc](.nvmrc)
- pnpm through Corepack; this repo uses `pnpm@11.1.0`
- PostgreSQL
- Clerk credentials for authenticated flows

```bash
corepack enable pnpm
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Use [.env.example](.env.example) as the source of truth for local environment variables. The usual required values are:

```env
DATABASE_URL=...
DATABASE_DIRECT_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=...
```

See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md), [docs/DOCKER.md](docs/DOCKER.md), and [docs/AUTHENTICATION_SETUP.md](docs/AUTHENTICATION_SETUP.md) for setup variants.

## Commands

```bash
pnpm dev              # Next.js dev server
pnpm dev:turbo        # Next.js dev server with Turbopack
pnpm check            # eslint --fix, Next typegen, and TypeScript
pnpm lint             # ESLint without fixes
pnpm types            # Next typegen and tsc --noEmit
pnpm format           # Prettier
pnpm test             # Unit tests
pnpm test:e2e         # Playwright UI runner
pnpm test:e2e:ci      # Playwright headless
pnpm build            # Production build
pnpm build:turbo      # Turbopack production build
```

`pnpm check` can modify files because it runs `eslint --fix`. Use `pnpm lint && pnpm types` for a read-only CI-style check.

## Database

This project uses PostgreSQL with Prisma. The Prisma client is generated into `prisma/generated/client`.

```bash
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:create
pnpm db:migrate:deploy
pnpm db:migrate:status
pnpm db:seed
pnpm db:studio
```

Use migrations for committed schema changes. Do not use `db:push` as a pull request substitute for migrations.

## Testing

Run the checks appropriate to the change. For most code changes:

```bash
pnpm lint
pnpm types
pnpm test
pnpm build
```

For UI, routing, authentication, moderation, or browser-flow changes, also run relevant Playwright coverage:

```bash
pnpm exec playwright install chromium
pnpm test:e2e:ci
```

Playwright reads `.env.test.local` and `.env.test`. See [docs/E2E_TESTING_SETUP.md](docs/E2E_TESTING_SETUP.md).

## Pull Requests

- Base the branch on the branch the PR targets. Use `master` unless the issue or release flow says to target `staging`.
- Keep scope tight. Avoid mixing feature work, unrelated refactors, and formatting churn.
- Add or update tests for behavior changes.
- Update docs for setup, routing, environment, API, or workflow changes.
- List the checks you ran in the PR description.
- Include screenshots or recordings for user-facing UI changes.

CI runs lint, type-check, unit tests, and a production build. The E2E workflow runs for relevant source, test, Playwright, package, and workspace changes.

Prefer [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## Code Style

- No `any`, `z.any()`, `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Prefer `unknown` plus type guards when input shape is unknown.
- Use generated Prisma types where they apply.
- Use enum values from `@orm` instead of string literals.
- Prefer top-level function declarations.
- Use `useConfirmDialog` from `@/components/ui` instead of `window.confirm()`.
- Keep comments rare, factual, and tied to constraints that code cannot express clearly.

### React Props

Do not destructure component props in the function signature. Use `props.foo`.

Component prop interfaces should be named `Props`.

Reference:

- [Breaking the Habit: The Overuse of Object Destructuring in React](https://medium.com/@Producdevity/breaking-the-habit-the-overuse-of-object-destructuring-in-react-5404ab53eb6d)
- [Destructuring Props in React: The Quiet Problem That Keeps Growing](https://medium.com/@Producdevity/destructuring-props-in-react-the-quiet-problem-that-keeps-growing-c58ab3bf2ce2)

### File Naming

- Use `PascalCase` for component files.
- Use `camelCase` for non-component TypeScript files.
- Name single-component files after the component.
- Name single-function files after the function.

## Architecture

- Put Zod schemas in `src/schemas/*`; do not define them inline in routers.
- Keep routers focused on orchestration, input validation, permissions, and response formatting.
- Put database access in repository classes under `src/server/repositories/`.
- Put multi-step business logic in services under `src/server/services/`.
- Use `adminProcedure` or `permissionProcedure(PERMISSION)` when available.
- Use `AppError` and `ResourceError` patterns for consistent errors.

Listings and PC listings should stay behaviorally aligned unless product requirements explicitly diverge. Shared behavior belongs in shared utilities or components.

Use `Listing` and `PcListing` for the existing internal models. User-facing copy should use compatibility reports, device reports, and PC reports instead of exposing internal model names.

Filter behavior belongs in controllers. Content components should render fields and call passed handlers. Page state hooks should own URL sync and local UI state, but not per-filter analytics.

Async multi-selects should use `src/components/ui/form/async-multi-select/AsyncMultiSelect.tsx` as the base. Entity wrappers should stay thin, and selected chips must remain visible even when the current search result page does not include them.
