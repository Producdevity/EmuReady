# Self-hosting

EmuReady runs as a standalone Next.js container behind Coolify and Cloudflare. Supabase, Clerk, R2, Sentry, and email remain managed services.

## Build and release contract

- Build the `app` target from `Dockerfile`; run the resulting immutable image in Coolify.
- Supply all `NEXT_PUBLIC_*` values while building. Runtime values cannot change the browser bundle.
- Use a migrated, disposable Postgres database while building because Prisma TypedSQL generation introspects the schema. Never use production for this.
- In Coolify, mark the build database URLs as build variables and enable **Use Docker Build Secrets**. Ordinary Docker build arguments expose their values in image metadata.
- Keep runtime-only secrets, such as `CLERK_SECRET_KEY`, out of the build phase.
- For a release containing migrations, build the `migrator` target from the same commit and run it with `DATABASE_DIRECT_URL` before deploying the `app` image.

The first VPS deployment is manual. The repository does not yet publish images or trigger Coolify automatically; add that workflow after the staging path has been verified.

## Coolify application

- Use the Dockerfile build pack, target `app`, and exposed port `3000`.
- Set `NEXT_BUILD_ID=$SOURCE_COMMIT` and enable **Include Source Commit in Build**.
- Use `/api/health/ready` for deployment health checks and `/api/health/live` for process liveness.

## Production configuration

- Use the Supabase session pooler on port 5432. The app defaults to five database connections; override with `connection_limit` in `DATABASE_URL`.
- Store production user uploads in R2. Set `R2_UPLOADS_BUCKET`, `R2_UPLOADS_PUBLIC_BASE_URL`, and the matching `NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL` together. Keep R2 credentials unset in staging for now so it cannot access production assets.
- Set `TRUST_CF_CONNECTING_IP=true` only after the origin accepts web traffic exclusively through Cloudflare.

## Deferred follow-ups

- Provision an isolated staging upload bucket, scoped token, and hostname before enabling upload testing in staging.
- Make APK objects private so entitlement checks cannot be bypassed with a known public R2 URL.
- Publish immutable images and trigger verified Coolify deployments from CI.
- Replace the current `staging` default branch and `master` production convention with a documented release and promotion flow.
- Consolidate the duplicate mobile tRPC paths and remove the unused transport.
- Audit the stale TransIP, FTP, and mail DNS records, then add DMARC after confirming the mail policy.

## Verification and cutover

1. Deploy with staging Clerk and Supabase credentials under a temporary hostname.
2. Verify `/api/health/live`, `/api/health/ready`, public pages, authentication, API routes, uploads, and image optimization.
3. Deploy the production configuration while the production domain still points to Vercel.
4. Point Cloudflare at the VPS and keep the previous Vercel deployment available for rollback.

Do not run an upload backfill unless a read-only production database inventory confirms that `/uploads/...` references still exist and the matching source files have been recovered.
