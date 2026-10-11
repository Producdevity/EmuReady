# Production container image

The manual **Container image** workflow builds on a GitHub runner so compilation
does not compete with applications on the VPS. It never calls Coolify or changes
DNS. Publishing an image and deploying it are separate actions.

## Configure once

Create a GitHub environment named `container-production`, restricted to `master`.
Set its variable `CONTAINER_PUBLIC_BUILD_ENV` to a JSON object containing the
production public build settings. Keys must be declared Dockerfile arguments
starting with `NEXT_PUBLIC_`, or `NEXT_IMAGE_UNOPTIMIZED`. Values must be strings.
Copy these from the reviewed production configuration, not the staging CI secrets.
The workflow requires the final www URL, production environment and live Clerk
publishable key. Changes to public settings require a new image.

Do not supply application secrets or hosted database credentials. The workflow
creates and migrates an empty PostgreSQL 15 service on the runner for Prisma
TypedSQL, runs unit tests, then builds the `app` target including Next.js's normal
TypeScript check. The database disappears with the runner.

## Build and publish

Run the workflow on `master` after that exact commit's required CI passes.
Leave `publish` false for a build check, or explicitly select it to publish to
`ghcr.io/producdevity/emuready`. The image uses a unique commit/run/attempt tag and
records the source revision. Copy the immutable digest from the run summary.
The workflow has not established runtime or physical Android sign-in proof.

Keep the GHCR package private unless public distribution is separately approved.
For a private package, configure the VPS with a read-only package credential using
stdin; never put the credential in application environment variables or logs.

## Coolify deployment

Save the existing application settings and previous image before switching its
build pack from `dockerfile` to `dockerimage`. Preserve runtime environment,
domains, custom labels, port 3000, health checks, CA mount and persistent storage.
Set runtime `APP_VERSION` to the image's exact source commit; do not retain a
`$SOURCE_COMMIT` expression that depends on a Git-based Coolify build.
Set the image name to `ghcr.io/producdevity/emuready` and pin the returned digest.
Coolify 4.3.17 internally represents a digest in `docker_registry_image_tag` as
`sha256-<hex>`; verify the displayed deployment target is `image@sha256:<hex>`.
Ensure an inline Dockerfile is not configured because it takes precedence in
this version's image-name selection. Do not preload an image into Dockerfile
mode and assume that prevents another build.

Deploy only with release authorization. Verify the running image digest, build
identity, readiness, final-host routing, TLS, canonical URLs, downloads and auth
behavior before approving public cutover. Production still uses the same Supabase
database; this workflow never migrates it. Preserve Vercel as the public rollback.

Retain the previous container, image and generated Compose configuration until
validation passes. Prepare its exact runtime restore before deployment; switching
back to Dockerfile mode and clicking Deploy can start another build. Do not use
that as a rollback shortcut, restore the shared database, or change public DNS.

Reference: [Coolify Docker Image deployment](https://coolify.io/docs/applications/deployments/docker-image).
