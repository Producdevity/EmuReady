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
- Add test user credentials to `.env.test.local`

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

The auth setup creates state files for test users that already exist in your database. Tests check authentication status dynamically using the `isAuthenticated()` helper rather than relying on storage states.

Test roles configured in `.env.test.local`:
- Regular user
- Author
- Moderator  
- Developer
- Admin

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

# Test Users (must exist in database)
TEST_USER_EMAIL=user@emuready.com
TEST_USER_PASSWORD=DevPassword123!
TEST_AUTHOR_EMAIL=author@emuready.com
TEST_AUTHOR_PASSWORD=DevPassword123!
TEST_MODERATOR_EMAIL=moderator@emuready.com
TEST_MODERATOR_PASSWORD=DevPassword123!
TEST_DEVELOPER_EMAIL=developer@emuready.com
TEST_DEVELOPER_PASSWORD=DevPassword123!
TEST_ADMIN_EMAIL=admin@emuready.com
TEST_ADMIN_PASSWORD=DevPassword123!

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
- Verify test users exist in database
- Check Clerk keys are valid
- Ensure `.env.test.local` is configured correctly

### Rate limiting errors
Tests may hit rate limits during parallel execution. Reduce workers in playwright.config.ts if needed.

### Missing elements
- Tests expect certain data-testid attributes that may not exist
- Admin tests require actual admin authentication

## Test Status

Current test suite includes 238 tests covering:
- Accessibility
- Authentication flows
- Admin dashboard
- User flows
- Navigation
- Forms
- Comments
- Voting
- Error handling
- Performance

All tests should pass when the database is properly seeded with test users. The seeder creates all required test accounts with appropriate roles.