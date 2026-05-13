# Development Setup

## Local App

1. Copy `.env.example` to `.env.local` and fill in the database and Clerk values.
2. Enable pnpm with `corepack enable pnpm`, then install dependencies with `pnpm install`.
3. Apply migrations with `pnpm db:migrate:dev`.
4. Seed local data with `pnpm db:seed`.
5. Start the app with `pnpm dev`.

The seed script reconciles Clerk users and database users. The canonical seeded account list and password live in `prisma/seeders/usersSeeder.ts`.

## Webhooks

Webhook setup is only needed when working on Clerk webhook behavior. Local development with seeded users does not require webhooks.

To test webhooks locally:

1. Start the app with `pnpm dev`.
2. Expose the app with a tunnel such as `ngrok http 3000` or Cloudflare Tunnel.
3. Configure the Clerk webhook endpoint as `https://<tunnel-host>/api/webhooks/clerk`.
4. Subscribe to `user.created`, `user.updated`, and `user.deleted`.
5. Add the Clerk webhook secret to `.env.local` as `CLERK_WEBHOOK_SECRET`.

See `docs/AUTHENTICATION_SETUP.md` and `docs/WEBHOOK_TROUBLESHOOTING.md` for tunnel and webhook-specific details.

## Environment

Use `.env.example` as the source for supported local environment variables. The common required values are:

```env
DATABASE_URL=...
DATABASE_DIRECT_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

External provider keys such as `RAWG_API_KEY`, `THE_GAMES_DB_API_KEY`, and reCAPTCHA keys are only needed for the features that call those services.

## Troubleshooting

- If seeded login fails, rerun `pnpm db:seed` and confirm the Clerk keys point at the same Clerk app used by the seeder.
- If a webhook-created user is missing in the database, verify `CLERK_WEBHOOK_SECRET` and the Clerk webhook event subscriptions.
- If an admin role changed directly in the database, use the admin role sync endpoint or rerun the relevant seed/setup flow so Clerk metadata matches the database.
