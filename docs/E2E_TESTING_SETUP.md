# E2E Testing Setup Guide

This guide explains the E2E testing setup for EmuReady using Playwright.

## Quick Start

```bash
# Run all tests with production build (fast)
./run-e2e.sh

# First time? Setup authentication
./run-e2e.sh --setup-auth

# Run with Playwright UI
./run-e2e.sh --ui

# Debug mode
./run-e2e.sh --debug

# Force rebuild
./run-e2e.sh --build
```

## Configuration

- Uses `playwright.config.ts` for all test scenarios
- Runs against production build by default (faster)
- Cookie banner disabled via `NEXT_PUBLIC_DISABLE_COOKIE_BANNER` in `.env.test.local`
- Separate test projects for different auth roles

## Installation

```bash
# Install dependencies (already done if you ran npm install)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Simple Commands

```bash
# Run all tests headless (fast)
npm run e2e

# Run with Playwright UI (interactive)
npm run e2e:ui

# Debug mode (step through tests)
npm run e2e:debug
```

### Using the Runner Script

The `run-e2e.sh` script handles everything automatically:

```bash
# Basic usage - runs all tests
./run-e2e.sh

# With UI mode
./run-e2e.sh --ui

# Force rebuild
./run-e2e.sh --build
```

## Test Modes

- **Production mode**: `USE_DEV_SERVER=false` (default)
- **Dev mode**: `USE_DEV_SERVER=true` (for debugging)


## Writing Tests

Tests go in the `tests/` directory with `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to games page', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Games')
  await expect(page).toHaveURL('/games')
})
```

## CI/CD

GitHub Actions uses the CI test runner:

```yaml
- name: Run E2E tests
  run: ./tests/run-ci-tests.sh
```

Or directly with Playwright:

```yaml
- name: Run E2E tests
  run: npx playwright test
```

## Troubleshooting

### Tests are slow
- The first run builds the app, subsequent runs are faster
- Use `./run-e2e.sh` which uses production build

### Cookie banner issues
- Disabled via `NEXT_PUBLIC_DISABLE_COOKIE_BANNER=true` in `.env.test.local`
- Make sure to rebuild after setting this: `npm run build:turbo`
- The banner won't render at all when this is set

### Need authenticated tests
- Run `./run-e2e.sh --setup-auth` to generate auth states
- Use specific projects: `--project=chromium-auth-user` or `--project=chromium-auth-admin`
- Most tests work fine without authentication

## Environment Variables

`.env.test.local` contains:
- `NEXT_PUBLIC_DISABLE_COOKIE_BANNER=true` - Disables cookie banner
- `NEXT_PUBLIC_LOCAL_STORAGE_PREFIX="@TestEmuReady_"` - Test localStorage prefix
- Test user credentials for each role

## Authentication Setup

For tests that require authentication:

```bash
# Generate auth states for all roles
./run-e2e.sh --setup-auth

# Or manually
npx playwright test --project=auth-setup
```

This creates auth files in `tests/.auth/` for:
- Regular user
- Author
- Moderator  
- Developer
- Admin

## Notes

- First run builds the app (takes longer)
- Use `--ui` mode to debug failing tests
- Rebuild with `npm run build:turbo` after changing environment variables
- Check `tests/.auth/` exists for authenticated tests