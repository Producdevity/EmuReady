# Error Handling

Server procedures throw typed errors via helpers in `src/lib/errors.ts`. The tRPC error formatter serializes them, and the client reads them back — keeping codes and messages consistent and machine-readable.

## Throwing errors (server)

Use `AppError`, `ResourceError`, and `ValidationError` from `src/lib/errors.ts` instead of a raw `TRPCError`. That file is the source of truth for every helper and for the `ERROR_CODES` / `APP_ERROR_CODES` constants; add new ones there.

```typescript
import { AppError, ResourceError } from '@/lib/errors'

if (!user) ResourceError.user.notFound()
if (existing) ResourceError.deviceBrand.alreadyExists(input.name)
if (!allowed) AppError.forbidden()
```

Each helper throws a `TRPCError` with the appropriate HTTP status, so routers stay free of manual error construction.

## Structured error data

To send machine-readable data (not just a message), attach a plain object as the `cause`. The error formatter (`src/server/api/trpc.ts`, mirrored in `src/server/api/mobileContext.ts`) exposes it to the client at `data.appError` via `getSerializableAppError` (`src/lib/app-error-cause.ts`).

```typescript
AppError.conflict('Game already exists', {
  code: APP_ERROR_CODES.GAME_ALREADY_EXISTS,
  existingGameId,
})
```

`cause` fields must be plain JSON values (no nested `Error` instances).

## Reading errors (client)

Most call sites only display the message:

```typescript
import getErrorMessage from '@/utils/getErrorMessage'

toast.error(getErrorMessage(error))
```

When the client must _act_ on a specific error rather than just notify, branch on the structured code with `getAppErrorData` (`src/lib/trpc-client-errors.ts`). See `handleGameCreationError` (`src/app/games/new/search/utils/gameCreationErrors.ts`), which deep-links to the existing game on a duplicate and shows a tailored CTA on the submission limit:

```typescript
import { getAppErrorData } from '@/lib/trpc-client-errors'

const appError = getAppErrorData(error)
if (appError?.code === APP_ERROR_CODES.GAME_ALREADY_EXISTS) {
  router.push(`/listings/new?gameId=${appError.existingGameId}`)
}
```

## Key files

| File | Responsibility |
| --- | --- |
| `src/lib/errors.ts` | `AppError` / `ResourceError` / `ValidationError` helpers; `ERROR_CODES`, `APP_ERROR_CODES` |
| `src/lib/app-error-cause.ts` | Server: turn a `TRPCError` `cause` into a serializable `appError` payload |
| `src/lib/trpc-client-errors.ts` | Client: `getAppErrorData`, `isTRPCNotFoundError`, query retry policy |
| `src/server/api/trpc.ts` · `mobileContext.ts` | `errorFormatter` attaching `appError` / `zodError` to the client error shape |

Errors are unit-testable by asserting the thrown `TRPCError` (see the sibling `*.test.ts` files).
