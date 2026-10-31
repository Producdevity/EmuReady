# Container images

Merges into `staging` and `master` run CI, including browser tests. Once all jobs
pass, CI calls **Container image** to build on GitHub runners, publish to private
GHCR, and deploy the immutable digest through Coolify. `staging` deploys to
staging; `master` deploys to production. DNS and hosted databases are not changed.

Manual dispatch on `master` or `staging` builds and optionally publishes an image, with `publish`
defaulting to false. Automatic deployment is called from CI after all checks pass.
For automatic deployments, the branch head is checked before building and
immediately before selecting the image. If it has advanced at either check, the release stops.
GitHub and Coolify do not share an atomic revision lock: a merge after that check
can briefly leave the earlier revision running until the next release finishes.
A running release is not cancelled by a newer push, so Coolify verification can
finish after image selection and deployment have started. The next release waits
for it and must pass its own CI and deployment checks.

Authenticated browser CI runs for repository branches and their pull requests.
Fork pull requests skip that job because GitHub does not provide repository
secrets to them; browser tests still run after an accepted merge into `staging`
or `master`, before publication or deployment.

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

Each environment also needs a `COOLIFY_APPLICATION_UUID` variable and a
`COOLIFY_TOKEN` secret. Use a team-scoped token with `read`, `write`, and `deploy`
permissions. It inspects the non-sensitive application configuration, selects the
image digest and source commit, triggers the deployment and reads its status.
It does not need `root`, `read:sensitive` or `write:sensitive`. Store it only in
the matching branch-restricted GitHub environment and rotate it before expiry.

The deployment script refuses source build packs, the wrong branch/image
repository, missing readiness checks and pre/post deployment commands. Disable
runtime overrides for `APP_VERSION` and `NEXT_BUILD_ID` in Coolify: the image
already embeds its source commit. The public `/api/health` version and readiness
must match after Coolify finishes. A queued request alone is not success.

The schema and migration files are compared with the current public deployment's
source commit. Any difference blocks deployment unless the exact schema digest
has been approved after migration verification. The live version must identify
an exact source commit; an unknown baseline must be investigated before release.
This workflow migrates only its
disposable runner database; the application does not migrate on startup.

For a schema change, verify a fresh backup and obtain explicit approval before
applying hosted migrations. Build the same-commit `migrator` target off the
application VPS and follow
[Self-hosting](SELF_HOSTING.md#build-and-release-contract). After the migration
is verified, set the environment variable `CONTAINER_APPROVED_SCHEMA_DIGEST` to
the exact digest printed by:

```sh
GITHUB_SHA="$(git rev-parse HEAD)" python3 scripts/container_deploy.py --schema-digest
```

This approval matches only that schema/migration file set; it does not authorize
future changes. Never set it before the backup, approval and migration checks.

Before deployment, configure GHCR authentication for the Docker account used by
Coolify on every deployment server. Use a pull-only credential with `read:packages`
and access to the private EmuReady package; track its expiration and rotate it
before it expires. Verify that the server can pull the exact published digest.
The workflow's GitHub token authenticates only the publishing runner.

Deploy that immutable digest through Coolify's Docker Image build pack.
Preserve runtime credentials, domains, labels, port 3000, health checks,
certificate mounts and persistent storage. Disable
source auto-deployment so pushes cannot start builds on the application VPS.
The image supplies `APP_VERSION` from the exact build commit.

If a release fails, inspect its deployment UUID and workflow logs before retrying.
Coolify keeps the previous container when the new container fails readiness.
The workflow prints the previous image selection for manual rollback; it does
not apply database changes or initiate an extra rollback deployment.

Verify image identity, readiness, TLS, canonical URLs, authentication and static
assets before switching public DNS. Keep the existing Vercel deployments and
aliases intact for rollback until the user explicitly approves retirement.

## Production promotions

When master contains production fixes absent from staging, prepare a promotion
branch from master and merge the reviewed staging revision. Resolve conflicts
without reverting production dependencies or schema; include an upgrade or
migration only when it is part of the approved release.

Run CI on the resolved head before merging into master. The production workflow
builds a new image from that merge commit with `container-production` settings;
do not reuse an image built with staging settings.
