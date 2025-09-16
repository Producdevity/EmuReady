**Duplication Audit (Listings, PC Listings, and Related UI)**

This document catalogs notable duplication across the codebase, with concrete file references and targeted abstraction proposals to improve maintainability, testability, and adherence to SOLID/DRY principles. Scope focuses on Listings, PC Listings, and adjacent UI/state patterns that repeat in multiple places.

---

**Summary Hotspots**

- Listings filter UI and logic are implemented in parallel variants: classic `/listings` and v2, plus `/pc-listings`.
- URL-driven filter state and query param assembly are recreated with similar patterns across pages.
- Repeated analytics tracking calls for filter changes.
- Repeated table headers, column visibility, sorting, and “actions” cells.
- Repeated mobile filter sheet overlay behavior.
- Option-mapping for MultiSelects repeated across systems, devices, emulators, SoCs, performance.

---

**1) URL Filter State + Query Param Assembly**

- Files:
  - `src/app/listings/hooks/useListingsState.ts`
  - `src/app/pc-listings/hooks/usePcListingsState.ts`
  - `src/hooks/useUrlState.ts` (+ `useUrlSearch`)
  - Pages assembling filter params:
    - `src/app/listings/ListingsPage.tsx` (filterParams)
    - `src/app/pc-listings/PcListingsPage.tsx` (filterParams)
    - `src/app/v2/listings/V2ListingsPage.tsx` (filterParams)
- Duplication:
  - Converging patterns to parse URL params, debounce search, and update URL via replace/push.
  - Similar `filterNullAndEmpty` usage with per-page manual assembly.
- Proposal:
  - Abstraction: `useFilterParams<T>()` + page-specific mappers.
    - Responsibilities: centralize building the tRPC input for listings/pc-listings based on URL state, with pluggable mappers for page-specific fields.
    - Inputs: page key (e.g., 'listings' | 'pcListings'), current URL-state hook values.
    - Output: stable `filterParams` object with memoization.
  - Abstraction: `useUrlFilters` presets
    - Provide preconfigured helpers: `useListingsUrlFilters()`, `usePcListingsUrlFilters()` returning common setters + debounced search.
  - Wins: reduces three near-identical code paths and ensures consistent debounce/reset-page behavior.

---

**3) Filter Panels and Option Mapping**

- Files:
  - Classic: `src/app/listings/components/ListingFilters.tsx`
  - V2: `src/app/v2/listings/components/ListingFilters.tsx`, `SearchBar.tsx`
  - PC: `src/app/pc-listings/components/PcListingsFilters.tsx`
- Duplication:
  - The same filter categories (systems, performance, devices, emulators, SoCs) appear across classic and v2, implemented with different layouts but identical value plumbing.
  - Option mapping (e.g., devices => `{ id, name }`) repeated in several components.
- Proposal:
  - Abstraction: `FilterCategory` primitives and mappers
    - `mapDeviceOptions`, `mapSocOptions`, `mapPerformanceOptions`, `mapSystemOptions`, `mapEmulatorOptions` in a shared `filters/options.ts`.
    - `FilterSection` component primitives (label, icon, MultiSelect wiring) that can be composed into classic or v2 layouts.
  - Abstraction: unify search input to a shared `ListingsSearchInput` (or reuse v2 `SearchBar` across pages) with consistent analytics and debounce.
  - Wins: reduce per-page boilerplate; consistent UX and analytics across pages.

**5) Table Structure, Headers, and Sorting**

- Files:
  - `src/app/listings/ListingsPage.tsx`
  - `src/app/pc-listings/PcListingsPage.tsx`
- Duplication:
  - Nearly identical table scaffolding: SortableHeader usage per column, an “Actions” column, and row click handlers.
  - Repeated badges and tooltip patterns for status/verification.
- Proposal:
  - Abstraction: `ListingsTable` primitive
    - Props: `columns`, `rows`, `renderers` per column, `onRowClick`, `actionsRenderer`, `sortState`/`onSort`.
    - Optionally integrate `ColumnVisibilityControl` directly.
  - Wins: consolidates duplicated table chrome and sorting wiring; isolates per-column rendering differences.

---

**6) Header Toolbars (My Listings, Add, Toggles, Column Visibility)**

- Files:
  - `src/app/listings/ListingsPage.tsx` (desktop header + mobile header variants)
  - `src/app/pc-listings/PcListingsPage.tsx` (same pattern)
- Duplication:
  - “My Listings” toggle button logic and labels.
  - “Add Listing”/“Add PC Listing” actions.
  - Display toggles (`DisplayToggleButton`) and `ColumnVisibilityControl` blocks.
- Proposal:
  - Abstraction: `ListingsHeader`
    - Props to toggle “my listings”, inject “add” link target/label, and add display/visibility controls.
  - Wins: consistent layout; easier to adjust styling/behavior across both listings.

---

**7) Analytics Filter Tracking**

- Files:
  - Classic filters: `src/app/listings/components/ListingFilters.tsx`
  - v2 filters: `src/app/v2/listings/components/ListingFilters.tsx`
  - v2 quick filters: `src/app/v2/listings/components/QuickFilters.tsx`
  - URL-state hooks: `src/app/listings/hooks/useListingsState.ts`, `src/app/pc-listings/hooks/usePcListingsState.ts`
- Duplication:
  - Repeated `analytics.filter.*` calls spread across components and hooks.
- Proposal:
  - Abstraction: `filterAnalytics` adapter
    - Provides typed helpers: `trackApply(filters)`, `trackClear()`, `trackSearch(term)`, `trackSort(field)`, etc.
    - Centralizes name-resolution for options (avoid re-deriving labels in each component).
  - Wins: consistent analytics and fewer edge-case divergences.

---

**8) MultiSelect Configuration and Behavior**

- Files:
  - Used in all filter components listed above; frequent repetition of `label`, `leftIcon`, `maxDisplayed`, placeholder strings.
- Duplication:
  - Many MultiSelect instances differ only in `options` and `onChange` handlers.
- Proposal:
  - Abstraction: `MultiSelectField` presets
    - Factory/utility to render a MultiSelect with standard props for common entities (`DeviceSelect`, `SystemSelect`, etc.).
  - Wins: consistent appearance and reduces repeated configuration wiring.

---

**10) Pagination Wiring**

- Files:
  - `src/app/listings/ListingsPage.tsx` and `src/app/pc-listings/PcListingsPage.tsx` use `<Pagination>` with similar `onPageChange` (to URL state) flows.
- Duplication:
  - Repeated logic to call `listingsState.setPage(newPage)` where page is managed within the same URL filter hook.
- Proposal:
  - Abstraction: pair `Pagination` with a small adapter hook `useUrlPagination()` that exposes `{ page, setPage, totalPages, itemsPerPage }` for list pages.
  - Wins: fewer places to remember to reset other filters when page changes; consistent push/replace behavior.

---

**11) Row Rendering (Badges, Tooltips, Status, Verification)**

- Files:
  - Both listings tables render `ApprovalStatus.PENDING` with a clock + tooltip, show verification badges, and author ban badges.
- Duplication:
  - Repeated row-cell conditionals and tooltip patterns.
- Proposal:
  - Abstraction: `ListingRowMeta` component
    - Responsible for rendering the meta badges/tooltip cluster consistently; receives a listing-like shape.
  - Wins: consistent semantics and styling; easier maintenance.

---

**Implementation Sketch (Non‑code)**

- New shared modules (suggested locations):
  - `src/app/listings/shared/hooks/useFilterParams.ts`
  - `src/app/listings/shared/components/ListingsTable.tsx`
  - `src/app/listings/shared/components/ListingsHeader.tsx`
  - `src/lib/analytics/filterAnalytics.ts` (adapter)

Each abstraction is small and composable (SOLID): single-responsibility primitives that pages compose, keeping page components thin and declarative.

---

**Expected Benefits**

- Reduced churn: styling or behavior changes apply in one place.
- Lower cognitive load: fewer bespoke implementations of the same patterns.
- Easier testability: focus tests on shared primitives and page-specific glue.
- More consistent UX across classic, v2, and PC listings pages.

---

**Next Steps (Suggested Order)**

1. Extract `ListingsTable` and `ListingsHeader`; refactor both listings pages.
2. Centralize analytics calls via `filterAnalytics` adapter (align v2 components).
3. Optional: create `useFilterParams` and `useUrlPagination` adapters to reduce per-page param assembly.

---

## Implementation TODOs (Per Item)

Below are concrete, low-risk TODOs for items we plan to implement, with acceptance checks and rollout notes. Items already completed are noted as such.

### 3) Filter Panels and Option Mapping — Status: PARTIALLY COMPLETED

- Done:
  - Shared mappers in `src/utils/options.ts` and adopted in classic Listings, PC Listings, and v2 page (systems/devices/emulators/SoCs).
  - V2 performance kept custom label-with-description mapping intentionally.
- TODO:
  - Consider a `performanceOptionsWithDesc` if we want a shared variant for v2, then swap in v2 only.
  - Acceptance: Display strings for all filters unchanged; no runtime type errors.

### 3a) FilterField primitive (new) — Status: PENDING

- Goal: Wrap label + icon + `MultiSelect` to remove repeated markup in classic + PC filters (not v2).
- Steps:
  - Create `src/app/listings/shared/components/FilterField.tsx` with props: `label`, `icon`, `value`, `onChange(values)`, `options`, `placeholder`, `maxDisplayed`, `leftIcon?`.
  - Replace Systems block in classic Listings, then in PC Listings.
  - Replace Devices/Emulators/SoCs in both pages in small PRs.
- Acceptance:
  - Visual parity; unchanged analytics calls; identical option counts and selections.
- Rollout: Systems first, then others; verify on mobile and desktop.

### 1) URL Filter State + Param Assembly — `useFilterParams` — Status: PENDING

- Goal: Centralize building tRPC filter input from URL/state for classic and PC listings.
- Steps:
  - Create `useFilterParams(pageKey, state, overrides?)` returning memoized `{ filterParams }`.
  - Provide mappers for classic listings and pc-listings (page-specific fields like limits, sort defaults).
  - Swap into one page (classic) and validate; then adopt in PC.
- Acceptance:
  - No shape changes in API requests; identical query behavior (diff check on inputs).
- Rollout: Behind a local flag in code or in small PRs per page.

### 11) Pagination Wiring — `useUrlPagination` — Status: PENDING

- Goal: Standardize pagination wiring to URL and list state.
- Steps:
  - Create `useUrlPagination()` exposing `{ page, setPage, limit, totalPages? }` backed by existing URL sync.
  - Replace ad-hoc `setPage` calls in classic + PC after validating the behavior.
- Acceptance:
  - Page changes persist via URL; refresh and back/forward keep the same page.

### 6) Centralized Analytics Adapter — `filterAnalytics` — Status: PENDING

- Goal: Normalize analytics calls for filter interactions to avoid drift.
- Steps:
  - Add `src/lib/analytics/filterAnalytics.ts` translating normalized calls to existing `analytics.filter.*`.
  - Replace calls in classic + PC filters first; keep payloads identical.
- Acceptance:
  - Analytics dashboards show no breaks or duplicates; event names unchanged.

### 4) Mobile Filter Sheet Primitive — Status: PENDING

- Goal: Extract bottom-sheet overlay used by mobile filter UIs into `MobileFilterSheet`.
- Steps:
  - Create `src/app/listings/shared/components/MobileFilterSheet.tsx` (props: `isOpen`, `onClose`, `title`, `children`).
  - Adopt in one page (classic) and verify; then apply to PC.
- Acceptance:
  - Identical open/close behavior, animations, and focus interactions on mobile.
- Risk: Low–medium (UI/animation). Roll out gradually.

### 12) Row Rendering Meta — `ListingRowMeta` — Status: PENDING

- Goal: Unify status/verification/ban badges and tooltips across tables.
- Steps:
  - Create `ListingRowMeta` with props for status, verification, and author ban flags.
  - Replace row fragments in classic + PC listings tables.
- Acceptance:
  - Visual parity and identical tooltip content; no regressions in a11y.

### 5) Table Structure, Headers, and Sorting — `ListingsTable` — Status: PENDING

- Goal: Extract table scaffolding and header sorting.
- Steps:
  - Create `ListingsTable` and `ListingsHeader` primitives.
  - Migrate classic listings first; keep existing `SortableHeader` wiring.
- Acceptance:
  - Sorting works identically; column visibility unaffected.
- Risk: Medium–high (table interactions). Do last after smaller wins.

### 14) Truncated Text Primitive — Status: PENDING

- Goal: Replace ad-hoc title truncation + tooltip logic.
- Steps:
  - Create `TruncatedText` (props: `text`, `max`, `tooltipSide?`, `href?`).
  - Adopt in listings tables where long titles are truncated.
- Acceptance:
  - Same truncation width and tooltip behavior.

### 15) Error State Component — Status: PENDING

- Goal: Replace repeated “Failed to load …” blocks with `ErrorBanner`.
- Steps:
  - Create `ErrorBanner` (props: `title`, `error`, `onRetry?`).
  - Adopt in listings and PC listings first; expand later.
- Acceptance:
  - Copy and retry actions preserved; visuals consistent.

### 13) Server-side Query Builders — Status: PENDING (High Risk)

- Goal: Unify where-building for approvals/NSFW/search ORs across repositories.
- Steps:
  - Add utilities: `buildSearchWhere`, `buildApprovalWhere`, `buildArrayWhere`, `composeWhere` under `src/server/repositories/utils/`.
  - Add focused tests that lock current behavior (approvals, NSFW, shadow-ban, myListings).
  - Migrate listings repository only; validate outputs; then roll out to others.
- Acceptance:
  - Identical query results on representative datasets; no behavior regressions.
- Risk: High. Gate behind tests and migrate incrementally.

This sequencing minimizes risk (start with hooks and leaf components) and yields early DRY wins without large cross-cutting refactors.

---

**Additional Cases (Extended Coverage)**

13. Server-side Filter Builders and Search OR Conditions

- Files:
  - `src/server/repositories/listings.repository.ts` (search across game.title, notes, device brand/model, emulator; device/SoC OR logic; approval/nsfw/shadow-ban filters)
  - `src/server/repositories/pc-listings.repository.ts` (similar where-building, approval, myListings, success-rate sorting, excludes Windows)
  - `src/server/repositories/games.repository.ts` (buildWhereClause for games; similar patterns)
- Duplication:
  - Rebuilding where clauses with recurring patterns: approval status handling, user-context (myListings), NSFW, search ORs, ID array filters.
  - Repeating large `include` maps for “forList”, “default”, etc., with similar shapes across repos.
- Proposal:
  - Abstraction: query-builder utilities per concern
    - `buildSearchWhere(filters, fields)` to produce OR clusters (shared across repos).
    - `buildApprovalWhere(userRole, userId, approvalStatus, authorField)` unified.
    - `buildArrayWhere(ids, field)` returns `{ [field]: { in: ids } } | undefined` (already partly exists) extended for PC entities.
    - `composeWhere(...clauses)` to merge AND/OR safely and predictably.
  - Extract shared `includes` presets for list/detail views where feasible to avoid drift.

14. Truncated Titles + Tooltip Pattern

- Files:
  - `src/app/listings/ListingsPage.tsx` and `src/app/pc-listings/PcListingsPage.tsx` render `{title.substring(0, 30)}` with a Tooltip for full title.
  - Admin games lists repeat the same pattern.
- Proposal:
  - Abstraction: `TruncatedLink`/`TruncatedText` component with props: `text`, `max`, `href?`, `tooltipSide='top'`.
  - Ensures consistent truncation rules, ellipsis, and tooltip behavior.

15. “Failed to load …” Error UI

- Files (examples):
  - Listings/PC Listings pages; several admin pages; profile selectors.
- Duplication:
  - Repeated red text blocks or light wrappers for “Failed to load X”.
- Proposal:
  - Abstraction: `ErrorState`/`ErrorBanner` component taking `title`, `error`, and optional retry callback.
  - Standardize getErrorMessage usage and styling.

16. Pagination Wiring Across Many Pages

- Files:
  - Numerous admin pages and listings pages invoke `<Pagination>` similarly, with `onPageChange` leading back to a URL/hook update.
- Proposal:
  - Abstraction: `useUrlPagination()` hook returning `{ page, setPage }` and a light `PaginationBar` that binds handlers, reducing per-page glue and aligning push/replace semantics.

17. Active Filters Count + Badges

- Files:
  - Count chips appear in classic filters, v2 filters, and mobile FABs in both listings and pc-listings.
- Proposal:
  - Abstraction: `useActiveFilterCount(filters)` and a `FilterCountBadge` component.
  - Eliminates counting logic duplication, normalizes what “active” means across pages.

Status: Partially Implemented

- Collapsed sidebar badges unified via `src/app/listings/shared/components/CollapsedBadges.tsx`.
- Adopted in: `ListingsFiltersSidebar` and `PcFiltersSidebar`.
- Mobile FAB badge count remains page-specific and is not changed.
  - Note: The FAB is shared; each page computes its count to preserve semantics (PC includes memory).

18. “My Listings” Toggle

- Files:
  - Classic listings, PC listings, and v2 quick filters each implement a “My Listings” toggle.
- Proposal:
  - Abstraction: `MyListingsToggle` component + unified state plumbing via hook (`useListingsOwnershipFilter`) that hides the user-check details and analytics.

19. Display Toggles (Icons vs Names, Logos vs Names)

- Files:
  - Classic/PC listings headers, admin approvals/games.
- Duplication:
  - Repeated `DisplayToggleButton` usage patterns with near-identical wiring and labels.
- Proposal:
  - Abstraction: `DisplayToggles` group component that receives an array of toggles with keys and labels, stores preferences in localStorage consistently, and exposes a single onChange callback.

20. Magic Numbers and Limit Constants

- Files:
  - Devices/SoCs fetched with `limit: 10000`; CPUs/GPUs with `limit: 1000`; per-page limits vary across pages (10 vs 15).
- Proposal:
  - Centralize in `src/data/constants.ts` (e.g., `OPTION_FETCH_LIMITS`), or move to Async data-selectors with server-side search + pagination to drop these limits.

21. Performance Scales Fetch + Mapping

- Files:
  - Classic/v2 listings and PC listings fetch `performanceScales` and map to options.
- Proposal:
  - Abstraction: `usePerformanceScales()` hook returning memoized option lists and a map by id/rank, reducing duplicated mapping.

23. Performance Scales Fetch + Mapping

- Files:
  - Classic/v2 listings and PC listings fetch `performanceScales` and map to options.
- Proposal:
  - Abstraction: `usePerformanceScales()` hook returning memoized option lists and a map by id/rank, reducing duplicated mapping.

24. Sort Handling Logic

- Files:
  - `useListingsState.ts` and PC state hook implement `handleSort` with similar tri-state logic.
- Proposal:
  - Abstraction: `useTriStateSort()` returning `{ sortField, sortDirection, handleSort }`, parameterized by default field/direction; share across pages.

25. URL Param Keys as Constants

- Files:
  - Inline strings like `'systemIds'`, `'deviceIds'`, `'search'`, `'page'`, etc., repeated across pages and hooks.
- Proposal:
  - Abstraction: `URL_PARAMS` constants module to avoid typos and keep naming consistent.

26. Empty State Components

- Files:
  - Classic uses `NoListingsFound`; v2 uses `EmptyState` with CTA to clear filters.
- Proposal:
  - Abstraction: a unified `EmptyState` that supports both “no data” and “no results with active filters” and customizable CTAs.

27. Derived Labels for Options

- Files:
  - Building device label as `brand + modelName`; SoC as `manufacturer + name`; repeated across multiple components.
- Proposal:
  - Abstraction: `formatDeviceName(device)`, `formatSocName(soc)`, `formatCpuName(cpu)`, etc., in `src/utils/formatters.ts` used by option mappers and tables.

28. Row Click Navigation + Stop Propagation for Action Cells

- Files:
  - Both listings pages attach `onClick` at row-level and stop propagation in actions.
- Proposal:
  - Abstraction: Table row wrapper `ClickableRow` and an `ActionsCell` helper to standardize propagation and accessibility (role/button mapping).

29. Error/Loading State Strategy

- Files:
  - Pages vary in handling `isPending`, showing spinners, and conditionally rendering content.
- Proposal:
  - Abstraction: `DataState` wrapper component that takes `{isLoading, error, hasData}` and slots for `loading`, `error`, `empty`, `content`.

30. Time Constants and Query Caching Policies

- Files:
  - Mixed use of `ms` utility vs raw numbers for `staleTime`/`gcTime` across components.
- Proposal:
  - Abstraction: `queryCachePolicies` constants and a small helper `useCachePolicy('short'|'medium'|'long')` to standardize cache durations.

31. Verified Developer and Verification Badges

- Files:
  - Badges appear in list rows and details views with similar conditions and tooltip usage.
- Proposal:
  - Abstraction: `DeveloperVerificationCluster` that renders the right badges and tooltips based on a standard listing shape.

32. Reusable Headers Across Admin Tables

- Files:
  - Many admin tables repeat header toolbars with search, add buttons, column visibility, and display toggles.
- Proposal:
  - Abstraction: `AdminTableHeader` combined with `useAdminTable` to reduce boilerplate in each admin page while preserving flexibility via render props.

33. Tooltip Side/Styling Consistency

- Files:
  - Tooltips frequently use `side="top"` with similar styles.
- Proposal:
  - Abstraction: Tooltip preset wrapper exporting `TopTooltip`, `RightTooltip`, etc., or a `withTooltip` helper for common patterns.

34. Row Styling and Hover Patterns

- Files:
  - Repeated classes: `hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors`.
- Proposal:
  - Abstraction: table row style constants or a `TableRow` component to ensure consistent hover states and accessibility roles.

35. Limits and Page Size Defaults (UX Consistency)

- Files:
  - Listings use limit 10; v2 uses 15; admin varies.
- Proposal:
  - Establish a default page-size policy per viewport (desktop/mobile) and centralize in constants to drive consistent UX and predictable pagination.

36. Clear All Filters CTA and Messaging

- Files:
  - Implemented multiple times with similar analytics calls.
- Proposal:
  - Abstraction: `ClearFiltersButton` that clears via central hook and tracks analytics in one place.

37. Preferences Banners (Devices/SoCs)

- Files:
  - Classic listings shows banners for active/available preference filtering with similar text and CTAs.
- Proposal:
  - Abstraction: `PreferencesBanner` component that adapts copy for Devices vs SoCs and exposes `onEnable`/`onDisable` hooks.

38. Search Bars Across Domains (Games, Listings, Admin)

- Files:
  - Games search, listings search, admin tables (via `useAdminTable`) all have search inputs with debounce.
- Proposal:
  - Abstraction: `SearchInput` preset that integrates with `useUrlSearch` or `useDebouncedValue` based on context, with consistent a11y and analytics.

39. Success Rate Bar Usage

- Files:
  - Listings and PC listings use `SuccessRateBar` similarly; admin pages may also reuse.
- Proposal:
  - Provide a compact variant preset (`<SuccessRateBar variant="compact" />`) and consolidated usage guidelines to avoid inline tweaks.

40. Repeated “Add” Buttons with Similar Styling

- Files:
  - “Add Listing”, “Add PC Listing”, “Add” in mobile headers.
- Proposal:
  - Abstraction: `AddEntityButton` that receives target URL and label; integrates with routing and analytics.

These additional items broaden the DRY opportunities and can be tackled incrementally. Each suggested abstraction preserves single responsibility and composes cleanly, enabling gradual adoption without large rewrites.
