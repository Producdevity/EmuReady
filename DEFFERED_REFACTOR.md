# Deferred refactors — `feat/platform` branch

This document captures every item from `BRANCH_REVIEW.md` that was deliberately deferred during the cleanup pass. Each entry has enough context to be picked up cold in a fresh session.

The branch ships with these items intentionally unfixed. Where tagged `🟢` they're backlog candidates; where tagged `🟡` they're worth doing in a focused follow-up PR but were judged to either (a) require schema/product decisions outside the scope of code cleanup, (b) trade duplication for a worse abstraction, or (c) stand to gain little for the cost.

---

## How to use this document

Each item follows the same structure:

- **Status**: severity tag.
- **Source files**: where the actual code lives, with line ranges current as of the most recent review pass.
- **What's currently there**: the existing pattern, with code excerpts.
- **What an "extraction" would look like**: the candidate refactor.
- **Why it was deferred**: the concrete reason a reviewer picked "leave it" over "fix it".
- **How to revisit**: what would change the calculus and make this worth doing.

---

## B.3 — Form-shell hook extraction (handheld + PC admin edit forms)

**Status**: 🟡 deferred

**Source files**:

- `src/app/admin/listings/[id]/edit/components/ListingEditForm.tsx`
- `src/app/admin/pc-listings/[id]/edit/components/PcListingEditForm.tsx`

**What's currently there**:

Each form sets up its own `useForm<TSchema>` plus a parallel set of `useState` initial-option captures, `useMemo`-wrapped loaders, a mutation hook with `onSuccess`/`onError` boilerplate, and the `useEmulatorCustomFieldsSync` wiring. The two `<form>` JSX skeletons follow the same field ordering.

```ts
// Both forms share roughly this shape
const router = useRouter()
const [isSubmitting, setIsSubmitting] = useState(false)
const utils = api.useUtils()

const [initialGame] = useState<GameOption>({ /* mapped from props */ })
// ...4 more initial-option captures

const updateMutation = api.<route>.update.useMutation({
  onSuccess: () => {
    toast.success('...')
    utils.<route>.<paths>.invalidate(...).catch(console.error)
    router.push('/admin/...')
  },
  onError: (error) => {
    toast.error(`...: ${getErrorMessage(error)}`)
    setIsSubmitting(false)
  },
})

const { register, handleSubmit, formState, setValue, watch, control, getValues } =
  useForm<TFormData>({ resolver: zodResolver(TSchema), defaultValues: {...} })

const { query, summary } = useEmulatorCustomFieldsSync({ /* form-specific wiring */ })
```

**What an "extraction" would look like**:

A `useAdminListingEditForm<TSchema, TFormData>` hook taking the schema, default-values factory, mutation factory, and redirect target.

```ts
function useAdminListingEditForm<TSchema extends ZodType, TFormData = z.infer<TSchema>>(opts: {
  schema: TSchema
  defaultValues: TFormData
  mutation: () => UseMutationResult<...>
  redirectOnSuccess: string
  customFieldsFieldName: FieldPath<TFormData>
}) { ... }
```

**Why it was deferred**:

1. The plan that drove this branch (`drifting-singing-gray.md`) explicitly forbade a generic edit-form abstraction:
   > RHF + zodResolver inference collapses through generic wrappers, and the handheld form has emulator-driven custom-field effects that a generic layout cannot host cleanly.
2. `Control<T>`, `FieldErrors<T>`, `FieldPathByValue<T, string>` all flow through the type parameter. Threading them through a hook adds noise at every consumption site.
3. The shared bits are thin (~15 lines per form). The differing bits — schemas, default-values shapes, mutation routes, redirect targets, field-name discriminators — have to be threaded as injection points and account for the bulk of the boilerplate anyway.

**How to revisit**:

Worth re-evaluating if a _third_ admin edit form lands (e.g., presets edit, custom-field-template edit). Two parallel forms is tolerable; three becomes a maintenance hot-spot.

---

## B.10 — `MutationOptions<unknown>` typing in `useListingApi`

**Status**: 🟢 deferred (consciously chose not to type)

**Source files**:

- `src/lib/api/useListingApi.ts:49-52`

**What's currently there**:

```ts
type MutationOptions<TData> = {
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

const vote = (input: VoteInput, options?: MutationOptions<unknown>) => { ... }
```

Every method on the hook accepts `MutationOptions<unknown>`, so `onSuccess` callbacks see `data: unknown`.

**What a "fix" would look like**:

Type each method with the actual mutation's data shape, unioning handheld + PC outputs:

```ts
const vote = (
  input: VoteInput,
  options?: MutationOptions<RouterOutput['listings']['vote'] | RouterOutput['pcListings']['vote']>,
) => { ... }
```

…repeated across 8 methods, each producing its own union.

**Why it was deferred**:

Traced every consumer (`CommentThread.tsx`, `VoteButtons.tsx`, `EditPcListingButton.tsx`, etc.). Not one of them reads `data` inside `onSuccess`. Every call site uses the form `{ onSuccess: refreshData }` where `refreshData` ignores its argument.

Adding 8 union types to give consumers access to data they don't use is exactly the speculative typing CLAUDE.md prohibits ("Don't add features beyond what the task requires").

**How to revisit**:

When a caller actually needs the returned data (e.g., to show "Your vote of N has been recorded"), type that _specific_ method's data parameter at that moment. The union approach should be avoided — instead, expose two separate hooks (`useHandheldVote`, `usePcVote`) where the data shapes differ meaningfully.

---

## B.7 — Verification routers split across namespaces

**Status**: 🟢 deferred (partial extraction done; full unification is a topology change)

**Source files**:

- Handheld: `src/server/api/routers/listingVerifications.ts` (top-level router at `api.listingVerifications.*`)
- PC: `src/server/api/routers/pcListings/verifications.ts` (re-exported flat onto `api.pcListings.verify`/`removeVerification`/`getVerifications`)

**What's currently there**:

After B.6 the PC verification procedures live in their own file but still under the `pcListings` namespace:

```ts
api.listingVerifications.create.useMutation() // handheld
api.pcListings.verify.useMutation() // PC
api.listingVerifications.remove.useMutation() // handheld
api.pcListings.removeVerification.useMutation() // PC
api.listingVerifications.getByListingId.useQuery() // handheld
api.pcListings.getVerifications.useQuery() // PC
```

**What an "extraction" would look like**:

A single `api.listingVerifications.*` (or `api.verifications.*`) router where each procedure takes a `{ kind: 'handheld' | 'pc', id }` discriminator.

**Why it was deferred**:

External clients (mobile API consumers) may already use `api.pcListings.verify` at its current path. Renaming or unifying breaks them. Needs deprecation + coordinated rollout.

**How to revisit**:

Open a tracked ticket. Add the unified procedures alongside the old ones. After clients migrate, remove the old paths.

---

## B.8 — `useListingApi.useCommentsQuery` returns a shape union

**Status**: 🟡 deferred (normalization either drops or fabricates information)

**Source files**:

- `src/lib/api/useListingApi.ts:99-122`
- Handheld returns an array: `api.listings.getSortedComments`
- PC returns a paginated envelope: `api.pcListings.getComments` returns `{ comments, pagination, hasMore, … }`

**What's currently there**:

```ts
return isPc ? pcQuery : handheldQuery
```

Consumers narrow on `isPc` or `Array.isArray(data)` at every call site.

**What an "extraction" would look like**:

Two options, both lossy:

1. Normalize in the hook: handheld gets a fabricated pagination envelope; PC passes through. Handheld consumers carry pagination they don't need.
2. Split into `useHandheldComments`/`usePcComments` and lose the unification benefit of `useListingApi`.

**Why it was deferred**:

The right fix is at the _router_ level: have handheld also return a paginated envelope. That's a schema change that breaks every existing handheld consumer. Bundle with B.16.

**How to revisit**:

In a "unify listing comment APIs" PR — add pagination to the handheld comments router, then remove the union here once both shapes match.

---

## B.16 — sortBy / approvalStatus terminology drift

**Status**: 🟢 deferred (separate PR — schema evolution)

**Source files**:

- `src/lib/api/useListingApi.ts:106-117` (the translation site)
- `src/server/api/routers/listings/core.ts` and `pcListings/comments.ts` (the diverging schemas)
- handheld bulk return: `listings/admin.ts:771-778`
- PC bulk return: `pcListings/admin.ts:317`

**What's currently there**:

Two parallel public APIs that disagree on the same concept:

```ts
api.listings.getSortedComments → sortBy: 'newest' | 'oldest' | 'popular'
api.pcListings.getComments     → sortBy: 'newest' | 'oldest' | 'score'

// useListingApi.ts has to translate at the boundary
sortBy: (input.sortBy === 'score' ? 'popular' : (input.sortBy ?? 'newest')) as ...

// Bulk operations also disagree on return shape
handheld bulkApprove → { success, approvedCount, rejectedCount, skippedCount, message, hasReportedUsers }
PC bulkApprove       → { count: number }
```

**Why it was deferred**:

Picking one canonical name for the sort enum breaks every external consumer that uses the loser. This is a backwards-incompatible schema change that needs:

- Deprecation period for mobile API consumers
- Coordinated client + server update
- Optional dual-name acceptance during the transition

That's a schema-evolution PR. The current `as` cast in `useListingApi.ts` is the bandage that lets the two sides coexist; removing it requires a real plan.

The bulk return-shape divergence is similar — handheld's richer shape carries information PC doesn't currently produce (e.g., banned-user counts, since PC doesn't auto-reject banned authors). Aligning the shapes also means aligning the _behavior_, which is a product call.

**How to revisit**:

Open a tracked ticket: "Unify listing sort enums and bulk-action return shapes". Decide whether PC gets banned-user handling first (B.17 territory), then unify. Order matters — change behavior, then unify the shape.

---

## B.17 — Post-edit redirect targets diverge

**Status**: 🟢 deferred (depends on missing UI page)

**Source files**:

- `src/app/admin/listings/[id]/edit/components/ListingEditForm.tsx:82` → `/admin/listings`
- `src/app/admin/pc-listings/[id]/edit/components/PcListingEditForm.tsx:91` → `/admin/pc-listing-approvals`

**Why it was deferred**:

The PC redirect points to the only PC list-style page that exists today. Building `/admin/pc-listings` (a general PC list page mirroring `/admin/listings`) is a feature, not a cleanup. Premature alignment now would either:

- Redirect users to a 404, or
- Block this cleanup PR on building the new page first.

**How to revisit**:

When `/admin/pc-listings` lands, change the redirect at `PcListingEditForm.tsx:91` to that path.

---

## C.2 — `validatePlatformForUpdate` near-duplicate

**Status**: 🟡 deferred (extraction would be net negative)

**Source files**:

- `src/server/repositories/listings.repository.ts:694-729` (handheld)
- `src/server/repositories/pc-listings.repository.ts:727-788` (PC)

**What's currently there**:

The two functions share an 8-line scaffold (fetch existing, compute `effectivePlatformId`, skip null, detect changes) and then diverge sharply. PC has:

- A third change axis (`os` in addition to `platform`/`emulator`)
- A `platformChanging && !context.requestedSlug` branch (handheld can't trigger this — its device-platform IDs are FK-checked)
- A legacy-null-os branch

```ts
// PC-only branches that can't move out
if (platformChanging && !context.requestedSlug) {
  throw ResourceError.platform.notFound()
}
if (!context.requestedSlug) return

if (os === null) {
  if (context.emulatorSupported.size > 0 && !context.emulatorSupported.has(effectivePlatformId)) {
    throw ResourceError.platform.notSupportedByEmulator()
  }
  return
}
```

**What an "extraction" would look like**:

```ts
async function validatePlatformForUpdateBase<TExisting>(args: {
  fetchExisting: () => Promise<TExisting | null>
  notFound: () => Error
  passedPlatformId: string | null | undefined
  getExistingPlatformId: (e: TExisting) => string | null
  detectAnyChange: (e: TExisting) => boolean
  validate: (e: TExisting, effectivePlatformId: string) => Promise<void>
}) { ... }
```

5 injection points to dedupe ~8 shared lines.

**Why it was deferred**:

Net-negative readability. The PC-specific branches around `requestedSlug` and `os === null` happen _inside_ the `validate` callback, where they originate, so they can't move out of the per-repo function. After extraction every reader traces five callbacks instead of reading one function top-to-bottom, and the shared base only saves ~8 lines per call site.

**How to revisit**:

If a third listing kind ever appears (unlikely — handheld and PC are the model boundaries), the math may change. Until then, the duplication is the lower-cost option.

---

## C.4 — `useInitialOption` hook

**Status**: 🟡 deferred (would obscure a React idiom)

**Source files**:

- `src/app/admin/listings/[id]/edit/components/ListingEditForm.tsx:49-71`
- `src/app/admin/pc-listings/[id]/edit/components/PcListingEditForm.tsx:52-79`

**What's currently there**:

```ts
const [initialGame] = useState<GameOption>({
  id: props.listing.game.id,
  title: props.listing.game.title,
  system: props.listing.game.system,
  status: props.listing.game.status,
})
```

**What an "extraction" would look like**:

```ts
function useInitialOption<T>(factory: () => T): T {
  const [option] = useState(factory)
  return option
}

const initialGame = useInitialOption<GameOption>(() => ({
  /* ...same... */
}))
```

**Why it was deferred**:

The destructuring `const [x] = useState(...)` is the React-native idiom for "captured initial value, no setter needed." Wrapping it adds a thin layer that future readers have to step into to confirm it does nothing extra. CLAUDE.md's "don't add abstractions beyond what the task requires" applies.

**How to revisit**:

Don't. This is a stylistic preference that doesn't earn its keep.

---

## C.8 — `Prisma.QueryMode.insensitive` constant

**Status**: 🟢 deferred (Prisma's named enum is already the abstraction)

**Source files**:

- 28 files use either `Prisma.QueryMode.insensitive` directly or a `const mode = Prisma.QueryMode.insensitive` local. List can be regenerated with `grep -rln "Prisma\.QueryMode\.insensitive\|mode: 'insensitive'" src --include="*.ts"`.

**What's currently there**:

```ts
import { Prisma } from '@orm'
const mode = Prisma.QueryMode.insensitive // declared at module top in some files

// usage
{
  contains: (search, mode)
}
```

**What an "extraction" would look like**:

```ts
// server/utils/query-builders.ts
export const INSENSITIVE = Prisma.QueryMode.insensitive

// 28 files
import { INSENSITIVE } from '@/server/utils/query-builders'
{ contains: search, mode: INSENSITIVE }
```

**Why it was deferred**:

`Prisma.QueryMode.insensitive` is already a typed Prisma enum constant. Re-exporting it under a project-local name adds an indirection over an upstream named constant without adding meaning, type safety, or behavior. The "duplication" is an idiomatic use of a Prisma type, not a magic value worth abstracting.

**How to revisit**:

Don't. If anything, the existing `const mode = Prisma.QueryMode.insensitive` aliases inside individual router files could be removed (use the qualified name inline), but that's the opposite direction.

---

## D.3 — `DeviceModal` prop-to-state useEffect

**Status**: 🟢 deferred (intentional given mount lifecycle)

**Source files**:

- `src/app/admin/devices/components/DeviceModal.tsx:30-44`

**What's currently there**:

```ts
const [brandId, setBrandId] = useState('')
const [modelName, setModelName] = useState('')
const [socId, setSocId] = useState('')

useEffect(() => {
  if (props.deviceData) {
    setBrandId(props.deviceData.brandId)
    setModelName(props.deviceData.modelName)
    setSocId(props.deviceData.socId ?? '')
  } else {
    setBrandId('')
    setModelName('')
    setSocId('')
  }
  setError('')
  setSuccess('')
}, [props.deviceData, props.isOpen])
```

This is the classic "sync prop to state" pattern that React core team recommends against in favor of `key`-based remounting.

**What an "extraction" would look like**:

Drop the `useEffect`, switch to `useState(() => initialFromProps)`, and rely on the parent's `key={editIdFromUrl ?? 'add'}` (already in place after A.1) to remount when the edit target changes.

**Why it was deferred**:

The parent currently keeps the modal mounted between opens (`isOpen={addModalOpen || …}`) so transitions render correctly. With `useState` initializers and no effect, a typed-but-unsaved form would persist its values across close→reopen of the _same_ edit target. The `useEffect` ensures fields reset on each open.

The "right" fix is either:

1. Conditionally render the modal (`{open && <DeviceModal/>}`) — loses transitions.
2. Add a per-open `key` (e.g. `key={`${editId}-${attemptId}`}` with `attemptId++` on close) — adds parent state.
3. Keep the existing useEffect.

Option 3 is the lowest-friction; the useEffect is deps-correct and small.

**How to revisit**:

If the modal grows additional state that would benefit from a remount-based reset (e.g. a multi-step wizard), switch to option 2 at that point. Until then, the prop-sync `useEffect` is the right pragmatic choice for a simple form modal.

---

## F.5 — Trust scores can now go negative (intentional)

**Status**: 🟢 documented (no code change)

**Source files**:

- `src/lib/trust/service.ts:48` (`logAction` path)
- `src/lib/trust/service.ts:117` (`reverseTrustAction` path)

**What changed in this branch**:

The `Math.max(0, currentScore + weight)` floor was removed. Trust scores can now go negative.

```ts
// Before:
const newTrustScore = Math.max(0, (currentUser?.trustScore || 0) + weight)
// After:
const newTrustScore = (currentUser?.trustScore || 0) + weight
```

**Why this is documented, not reverted**:

The change appears deliberate — the trust system supports several severe negative actions (`LISTING_REJECTED`, ban-related), and meaningful punishment requires the score to actually decrease beyond zero. Reverting without product context would silently re-clip those punishments.

**How to revisit**:

If a UI surface exposes trust scores to users, decide whether negative numbers should be displayed verbatim or clamped at the read site (e.g., `Math.max(0, score)` in the badge component) while keeping the underlying score honest. The DB column is `Int`, no constraints prevent negatives.

---

## H.2 / H.3 — Unrelated changes bundled into the platform-layer migration

**Status**: 🟢 advisory (migration is immutable)

**Migration file**:

- `prisma/migrations/20260419193344_add_platform_layer/migration.sql`

**What's bundled**:

- The platform layer itself (Platform, EmulatorPlatform, DevicePlatform, Device.defaultPlatformId, Listing.platformId, PcListing.platformId, UserPcPreset.platformId).
- Two unrelated index additions: `@@index([userId, nullifiedAt])` on `Vote` and `CommentVote`.
- A new enum value: `TrustAction.VOTE_CHANGE_REVERSAL`.
- Nullability changes: `PcListing.os` and `UserPcPreset.os` made `PcOs?`.

**Why deferred**:

Prisma migrations are append-only and immutable. Editing a deployed migration breaks the migration ledger. The unrelated changes are already committed.

**How to revisit (process discipline for future migrations)**:

When generating a migration touching multiple models, run `prisma migrate dev --create-only` and split the resulting SQL into multiple `migrate dev --name <focused-name>` invocations _before_ applying any of them. Bundling unrelated changes makes rollbacks impossible without dragging unrelated subsystems with you.

---

## I.1 — `?editId=` URL flow integration test

**Status**: 🟡 deferred to e2e (not a fit for unit testing in current setup)

**Source files**:

- The fix lives in `src/app/admin/devices/page.tsx`
- The pattern mirrors `src/app/admin/users/page.tsx:76-159`

**Why deferred**:

The right test for this is end-to-end: open `/admin/devices?editId=<id>` and assert the edit modal is visible and pre-filled with the device's data. That's a Playwright spec, not a unit test.

Unit-testing the page would require:

- `vi.mock('next/navigation')` with controllable `useSearchParams`/`useRouter`
- Stubs for `api.devices.byId.useQuery` (returning the right shape under both "primed" and "URL-driven" conditions)
- Stubs for `api.devices.get`, `api.devices.stats`, `api.deviceBrands.get`, `api.platforms.get`, `api.users.me` (the page reads all of these)

The mock surface dwarfs the assertion surface for what's ultimately page-level routing behavior.

**How to revisit**:

Add a Playwright spec under `tests/admin-devices-edit.spec.ts`:

```ts
test('?editId= opens the edit modal pre-filled', async ({ page }) => {
  await loginAsSuperAdmin(page)
  const fixture = await seedDevice(page) // self-seeded with fingerprint
  await page.goto(`/admin/devices?editId=${fixture.id}`)
  await expect(page.getByRole('dialog', { name: 'Edit Device' })).toBeVisible()
  await expect(page.getByLabel('Model Name')).toHaveValue(fixture.modelName)
})
```

The existing `tests/admin-platform-management.spec.ts` shows the self-seed-with-fingerprint convention.

---

## I.2 — `PlatformsSummary` star icon presence test

**Status**: 🟢 deferred (low value)

**Source files**:

- `src/components/ui/PlatformsSummary.tsx:30-31` (the `<Star>` icon)
- `src/components/ui/PlatformsSummary.test.tsx`

**Why deferred**:

The `<Star>` icon next to the default-platform badge is decorative. The test suite already covers the bug-prone surface (chip ordering, label text, "(default)" tooltip annotation). Asserting the icon's DOM presence would add a brittle Lucide-SVG selector for negligible regression-prevention.

**How to revisit**:

Don't, unless the icon ever becomes load-bearing for accessibility or visual regression. In that case, swap to `data-testid="default-platform-marker"` and `getByTestId` rather than relying on the icon's SVG.

---

## K.2 — `tests/helpers/data-factory.ts` not line-by-line audited

**Status**: 🟢 informational

**File**: `tests/helpers/data-factory.ts` (+372 lines vs `master`)

**Why deferred**:

The factory grew significantly to support platform-layer fixtures. The full e2e suite passes (`npx playwright test`), which is the strongest signal that the factory produces valid fixtures. Line-by-line audit of fixture-generation code has low ROI — any incorrect output would surface as test failures elsewhere.

**How to revisit**:

When adding a new e2e spec that needs platform-related fixtures, read the relevant factory function before extending it. If the function feels overloaded (>50 LOC, multiple branching paths), split it into focused factories.

---

## K.3 — New e2e specs not deeply reviewed

**Status**: 🟢 informational

**Files**:

- `tests/admin-platform-management.spec.ts`
- `tests/platform-layer.spec.ts`

**Why deferred**:

Per project convention (stored in user memory), e2e specs use self-seeded fixtures with fingerprint-based cleanup. The full suite passes.

**How to revisit**:

If a flake appears, walk the spec's setup/teardown to confirm the fingerprint cleanup deletes only what the spec created. The convention is documented in earlier specs (e.g., `tests/voting.spec.ts`).
