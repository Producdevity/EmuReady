# Container images

The manual **Container image** workflow builds on GitHub runners and optionally
publishes to private GHCR. It does not deploy or change DNS.

Create a GitHub Actions environment **variable** named `CONTAINER_PUBLIC_BUILD_ENV`
containing a JSON object in each environment below. The workflow reads it through
`vars`; configuring an environment secret instead will leave this value empty.

| Branch | GitHub environment | Public URL | App environment | Clerk key prefix |
| --- | --- | --- | --- | --- |
| `master` | `container-production` | `https://www.emuready.com` | `production` | `pk_live_` |
| `staging` | `container-staging` | `https://staging.emuready.com` | `staging` | `pk_test_` |

Restrict each environment to its corresponding branch. Only public Dockerfile
arguments are accepted. Supply the full Clerk publishable key in the JSON; the
table shows only the required prefix. Never supply hosted database credentials or
application secrets: the workflow migrates an empty PostgreSQL 15 database on the runner for
Prisma generation. Public settings are baked into the image and require a rebuild
when changed.

After the exact commit passes CI, dispatch the workflow on the corresponding
branch with `publish` enabled. Before deployment, check the target database's
applied migrations against that commit. This workflow migrates only its disposable
database and publishes only the `app` target; the application does not migrate on
startup. If migrations are pending, stop until a fresh backup is verified and the
user explicitly approves applying them. Build the same-commit `migrator` target
off the application VPS and apply the migrations as described in
[Self-hosting](SELF_HOSTING.md#build-and-release-contract) before deploying the app.

Before deployment, configure GHCR authentication for the Docker account used by
Coolify on every deployment server. Use a pull-only credential with `read:packages`
and access to the private EmuReady package; track its expiration and rotate it
before it expires. Verify that the server can pull the exact published digest.
The workflow's GitHub token authenticates only the publishing runner.

Deploy that immutable digest through Coolify's Docker Image build pack.
Preserve runtime credentials, domains, labels, port 3000, health checks,
certificate mounts and persistent storage. Disable
source auto-deployment so pushes cannot start builds on the application VPS.
Set runtime `APP_VERSION` to the image's exact source commit.

Verify image identity, readiness, TLS, canonical URLs, authentication and static
assets before switching public DNS. Keep the existing Vercel deployments and
aliases intact for rollback until the user explicitly approves retirement.
