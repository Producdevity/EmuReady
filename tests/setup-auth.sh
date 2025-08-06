#!/bin/bash

echo "🔐 Setting up E2E test authentication..."

# Check if .env.test.local exists
if [ ! -f ".env.test.local" ]; then
    echo "❌ .env.test.local not found!"
    echo "📝 Creating from template..."
    cp .env.test.example .env.test.local
    echo "✅ Created .env.test.local - please update with your Clerk keys"
    exit 1
fi

# Load environment variables
export $(cat .env.test.local | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$TEST_USER_EMAIL" ] || [ -z "$TEST_USER_PASSWORD" ]; then
    echo "❌ Missing test credentials in .env.test.local"
    echo "Please ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are set"
    exit 1
fi

echo "📧 Test users found:"
echo "  - User: $TEST_USER_EMAIL"
echo "  - Author: $TEST_AUTHOR_EMAIL"
echo "  - Moderator: $TEST_MODERATOR_EMAIL"
echo "  - Developer: $TEST_DEVELOPER_EMAIL"
echo "  - Admin: $TEST_ADMIN_EMAIL"

# Run auth setup
echo ""
echo "🚀 Generating authentication states..."
npx playwright test --project=auth-setup

# Check if auth files were created
if [ -f "tests/.auth/user.json" ]; then
    echo "✅ Authentication setup complete!"
    echo ""
    echo "📁 Generated auth files:"
    ls -la tests/.auth/*.json 2>/dev/null | grep -v ".gitkeep"
    echo ""
    echo "🎯 You can now run authenticated tests:"
    echo "  npx playwright test --project=chromium-auth-user"
    echo "  npx playwright test --project=chromium-auth-admin"
else
    echo "❌ Authentication setup failed - no auth files generated"
    echo "Check the error messages above"
    exit 1
fi