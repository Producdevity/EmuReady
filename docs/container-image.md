# Container images

The manual **Container image** workflow builds on GitHub runners and optionally
publishes to private GHCR. It does not deploy or change DNS.

Configure `CONTAINER_PUBLIC_BUILD_ENV` as a JSON object in each GitHub environment:

| Branch | GitHub environment | Public URL | App environment | Clerk key |
| --- | --- | --- | --- | --- |
| `master` | `container-production` | `https://www.emuready.com` | `production` | `pk_live_` |
| `staging` | `container-staging` | `https://staging.emuready.com` | `staging` | `pk_test_` |

Restrict each environment to its corresponding branch. Only public Dockerfile
arguments are accepted. Never supply hosted database credentials or application
secrets: the workflow migrates an empty PostgreSQL 15 database on the runner for
Prisma generation. Public settings are baked into the image and require a rebuild
when changed.

After the exact commit passes CI, dispatch the workflow on the corresponding
branch with `publish` enabled. Deploy the returned immutable digest through
Coolify's Docker Image build pack. Preserve runtime credentials, domains, labels,
port 3000, health checks, certificate mounts and persistent storage. Disable
source auto-deployment so pushes cannot start builds on the application VPS.
Set runtime `APP_VERSION` to the image's exact source commit.

Verify image identity, readiness, TLS, canonical URLs, authentication and static
assets before switching public DNS. Keep the existing Vercel deployments and
aliases intact for rollback until the user explicitly approves retirement.
