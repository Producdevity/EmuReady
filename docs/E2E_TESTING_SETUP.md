# E2E Testing Setup

## Quick Start

```bash
# Run tests with UI (for development)
npm run test:e2e

# Run tests headless (for CI)
npm run test:e2e:ci
```

## Prerequisites

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Configure test environment:
- Copy `.env.test.example` to `.env.test.local`
- Set database and Clerk environment variables
- Seed the database with `npm run db:seed`

## Configuration

Tests use `playwright.config.ts` with the following setup:
- Runs against production build on port 3000
- Uses `.env.test.local` for environment variables
- Auth setup runs automatically before tests
- Global setup initializes Clerk

## Test Structure

```
tests/
├── .auth/              # Authentication states (gitignored)
├── helpers/            # Test utilities
├── pages/              # Page object models
├── auth.setup.ts       # Authentication setup
├── global.setup.ts     # Global initialization
└── *.spec.ts          # Test files
```

## Authentication

The auth setup creates Playwright storage states for seeded Clerk users.

## Writing Tests

Tests go in `tests/` directory with `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to games page', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Games')
  await expect(page).toHaveURL('/games')
})
```

## Running Specific Tests

```bash
# Run a specific test file
npx playwright test tests/navigation.spec.ts

# Run tests matching a pattern
npx playwright test -g "should display"

# Run with specific reporter
npx playwright test --reporter=html
```

## CI/CD Integration

GitHub Actions example:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e:ci
```

## Environment Variables

Required in `.env.test.local`:

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_DIRECT_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Test Configuration
NEXT_PUBLIC_DISABLE_COOKIE_BANNER=true
NEXT_PUBLIC_LOCAL_STORAGE_PREFIX="@TestEmuReady_"
```

## Troubleshooting

### Port 3000 already in use
Kill existing processes:
```bash
pkill -f "next start" || pkill -f "next dev"
```

### Tests timing out
- Increase timeout in playwright.config.ts
- Check if production build is up to date: `npm run build`

### Authentication issues
- Verify the database was seeded
- Check Clerk keys are valid
- Ensure `.env.test.local` is configured correctly
