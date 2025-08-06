#!/bin/bash
set -e

echo "Setting up E2E tests for CI..."

# Set environment variables for production testing
export NODE_ENV=production
export USE_DEV_SERVER=false
export CI=true

# Copy test environment if not exists
if [ ! -f .env.test.local ]; then
  echo "Creating .env.test.local from example..."
  cp .env.test.example .env.test.local
  
  # Override with CI environment variables if set
  if [ ! -z "$TEST_USER_EMAIL" ]; then
    sed -i.bak "s/TEST_USER_EMAIL=.*/TEST_USER_EMAIL=$TEST_USER_EMAIL/" .env.test.local
  fi
  if [ ! -z "$TEST_AUTHOR_EMAIL" ]; then
    sed -i.bak "s/TEST_AUTHOR_EMAIL=.*/TEST_AUTHOR_EMAIL=$TEST_AUTHOR_EMAIL/" .env.test.local
  fi
  if [ ! -z "$TEST_MODERATOR_EMAIL" ]; then
    sed -i.bak "s/TEST_MODERATOR_EMAIL=.*/TEST_MODERATOR_EMAIL=$TEST_MODERATOR_EMAIL/" .env.test.local
  fi
  if [ ! -z "$TEST_DEVELOPER_EMAIL" ]; then
    sed -i.bak "s/TEST_DEVELOPER_EMAIL=.*/TEST_DEVELOPER_EMAIL=$TEST_DEVELOPER_EMAIL/" .env.test.local
  fi
  if [ ! -z "$TEST_ADMIN_EMAIL" ]; then
    sed -i.bak "s/TEST_ADMIN_EMAIL=.*/TEST_ADMIN_EMAIL=$TEST_ADMIN_EMAIL/" .env.test.local
  fi
  if [ ! -z "$TEST_USER_PASSWORD" ]; then
    sed -i.bak "s/TEST_USER_PASSWORD=.*/TEST_USER_PASSWORD=$TEST_USER_PASSWORD/" .env.test.local
  fi
  
  # Clean up backup files
  rm -f .env.test.local.bak
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install --with-deps

# Build is already done in GitHub Actions, but verify it exists
if [ ! -f ".next/BUILD_ID" ]; then
  echo "ERROR: Production build not found. Please run 'npm run build' first."
  exit 1
fi

# Generate auth states (if needed)
if [ ! -d ".auth" ] || [ "$FORCE_AUTH_SETUP" = "true" ]; then
  echo "Generating auth states for test users..."
  npx playwright test --project=auth-setup
fi

# Run all tests with CI reporter
echo "Running all E2E tests in CI mode..."
npx playwright test --reporter=github --reporter=list

echo "E2E tests completed!"