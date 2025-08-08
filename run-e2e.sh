#!/bin/bash

# E2E test runner - uses production build because dev server is slow as shit

echo "🚀 Running E2E tests..."

# Always use production mode for speed (unless explicitly overridden)
if [ -z "$USE_DEV_SERVER" ]; then
    export USE_DEV_SERVER=false
fi

# Mark as Playwright test to disable cookie banner
export PLAYWRIGHT_TEST=true

# Kill any existing Next.js processes
pkill -f "next start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Check if we need to build
if [ ! -d ".next" ] || [ "$1" == "--build" ]; then
    echo "📦 Building production bundle..."
    npm run build:turbo
fi

# Setup auth if needed
if [ ! -d "tests/.auth" ] || [ "$1" == "--setup-auth" ]; then
    echo "🔐 Setting up authentication..."
    npx playwright test --project=auth-setup
fi

# Run tests
if [ "$1" == "--ui" ]; then
    npm run e2e:ui
elif [ "$1" == "--debug" ]; then
    npm run e2e:debug
else
    npm run e2e
fi

# Cleanup
pkill -f "next start" 2>/dev/null || true

echo "✅ Done!"
