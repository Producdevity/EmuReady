# Self-hosting

EmuReady runs as a standalone Next.js container behind Coolify and Cloudflare. Supabase, Clerk, R2, Sentry, and email remain managed services.

## Build and release contract

- Build the `app` target from `Dockerfile`; run the resulting immutable image in Coolify.
- Supply all `NEXT_PUBLIC_*` values while building. Runtime values cannot change the browser bundle.
- Set `BUILD_DATABASE_URL` to a migrated, disposable Postgres database because Prisma TypedSQL generation introspects the schema. Never use production or a restored production backup for this. Apply the existing migrations to an empty database; seeds are unnecessary.
- Optionally set `BUILD_DATABASE_DIRECT_URL` for that same disposable database. It defaults to `BUILD_DATABASE_URL`. The builder maps these names to Prisma's `DATABASE_URL` and `DATABASE_DIRECT_URL` only for `pnpm build`, and fails if `BUILD_DATABASE_URL` is missing.
- In Coolify, make `BUILD_DATABASE_URL` and `BUILD_DATABASE_DIRECT_URL` build-only variables and enable **Use Docker Build Secrets**. Ordinary Docker build arguments expose their values in image metadata.
- Keep the real `DATABASE_URL`, `DATABASE_DIRECT_URL`, and other runtime-only secrets, such as `CLERK_SECRET_KEY`, out of the build phase. Backups and environment files must remain excluded from the Docker context.
- For a release containing migrations, build the `migrator` target from the same commit and run it with `DATABASE_DIRECT_URL` before deploying the `app` image.

The VPS currently builds from source in Coolify. Staging uses the GitHub App webhook to deploy its configured branch; production is configured for manual deployments. Publishing prebuilt immutable images remains deferred.

## Coolify application

- Use the Dockerfile build pack, target `app`, and exposed port `3000`.
- Set `NEXT_BUILD_ID=$SOURCE_COMMIT` and enable **Include Source Commit in Build**.
- Use `/api/health/ready` for deployment health checks and `/api/health/live` for process liveness.

## Production configuration

- Use the Supabase session pooler on port 5432. Outside Vercel, the app retains one warm connection and allows at most five by default; override the maximum with `connection_limit` in `DATABASE_URL`.
- Store production user uploads in R2. Set `R2_UPLOADS_BUCKET`, `R2_UPLOADS_PUBLIC_BASE_URL`, and the matching `NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL` together. Keeping R2 credentials unset in staging prevents authenticated R2 API access and writes, but public objects remain readable when their URLs are known.
- Set `TRUST_CF_CONNECTING_IP=true` only after the origin accepts web traffic exclusively through Cloudflare. Enabling it on a directly reachable origin lets clients forge the trusted header.

## Deferred follow-ups

- Provision an isolated staging upload bucket, scoped token, and hostname before enabling upload testing in staging.
- Make APK objects private so entitlement checks cannot be bypassed with a known public R2 URL.
- Move builds to GitHub-hosted Actions, publish immutable images to GHCR, and have Coolify deploy them by digest. Do not run the build runner on the application VPS.
- Replace the current `staging` default branch and `master` production convention with a documented release and promotion flow.
- Consolidate the duplicate mobile tRPC paths and remove the unused transport.
- Define how authored handheld and PC Compatibility Reports are retained when a Clerk user is deleted; their required author relations currently block deletion (observed as `Listing_authorId_fkey`).
- Define how duplicate-email `user.created` events should reconcile different Clerk identities instead of retrying indefinitely.
- Audit the stale TransIP, FTP, and mail DNS records, then add DMARC after confirming the mail policy.

## Verification and cutover

1. Deploy with staging Clerk and Supabase credentials under a temporary hostname.
2. Verify `/api/health/live`, `/api/health/ready`, public pages, authentication, API routes, and image optimization.
3. Measure baseline and burst performance against staging, including p95 latency, errors, CPU, memory, image processing, disk use, and Supabase pool usage.
4. Deploy the production configuration while the production domain still points to Vercel. Verify web and mobile Clerk flows through the temporary hostname.
5. Point both the apex and `www` Cloudflare records at the VPS, preserve the current apex-to-`www` canonical redirect, and keep the previous Vercel deployment available for rollback.

Do not run an upload backfill unless a read-only production database inventory confirms that `/uploads/...` references still exist and the matching source files have been recovered.
