# Development Setup Guide

## Quick Start (No Webhooks Required!)

The easiest way to get started with development:

**Option 1: One command setup**
```bash
npm run dev:setup
```
This seeds the database and starts the dev server in one go!

**Option 2: Manual setup**  
1. **Start your app**: `npm run dev`
2. **Seed the database**: `npx prisma db seed` 
3. **Login with test users**:
   - **admin@emuready.com** / `DevPassword123!` 
   - **user@emuready.com** / `DevPassword123!`
   - etc.

That's it! 🎉 No webhook setup needed for development.

## Why No Webhooks for Development?

If you aren't planning to test or work on anything related to Clerk webhooks, you can skip the webhook setup entirely. 
The app will still function correctly with seeded test users and roles.
Just keep it in mind when something like `Roles` don't appear to be working as expected, this might be the reason.

Feel free to ask for help in the #dev channel on the [Discord server](https://discord.gg/YyWueNxmzM) if you run into any issues!

## Optional: Webhook Setup (For Production-Like Testing)

If you want to test the full production flow locally, you can set up webhooks:

### Prerequisites
- Sign up for [ngrok account](https://dashboard.ngrok.com/signup) (free)
- Get your authtoken: `ngrok config add-authtoken YOUR_TOKEN`

### Quick Webhook Setup
1. **Start development server**: `npm run dev`
2. **Start ngrok tunnel**: `ngrok http 3001` (note: app runs on port 3001 if 3000 is busy)
3. **Configure in Clerk Dashboard**:
   - Add endpoint: `https://YOUR_NGROK_URL.ngrok.io/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy webhook secret to `.env.local` as `CLERK_WEBHOOK_SECRET`

## Seeded Test Users

When you run `npm run db:seed`, the following users are created in both Clerk and your database:

- **superadmin@emuready.com** - SUPER_ADMIN role
- **admin@emuready.com** - ADMIN role  
- **author@emuready.com** - AUTHOR role
- **user@emuready.com** - USER role

**Default Password**: `DevPassword123!`

These users can be used immediately for testing different role permissions and features.

### Additional Test Users (Optional)

If you need more test users, you can create them through:

#### Option 1: Sign Up Through the App
1. Start your development server: `npm run dev`
2. Go to your app homepage
3. Click "Sign Up" and create additional test accounts

#### Option 2: Create Users in Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Users** in the sidebar
4. Click **Create User** 
5. Fill in user details
6. The webhook will automatically create the database record

### Assigning Roles to Additional Users

For users created outside the seeder:

#### Method 1: Through Admin Interface
1. Log in with `admin@emuready.com` (password: `DevPassword123!`)
2. Use the admin interface to assign roles to other users

#### Method 2: Direct Database Update
```sql
-- Make a user an admin
UPDATE "User" SET role = 'ADMIN' WHERE email = 'new-admin@test.com';

-- Make a user an author  
UPDATE "User" SET role = 'AUTHOR' WHERE email = 'author@test.com';
```

After updating roles in the database, sync them to Clerk:
```bash
curl -X POST http://localhost:3000/api/admin/sync-roles
```

### Testing Different Authentication Flows

1. **OAuth Testing**: Test GitHub, Google login flows
2. **Email/Password**: Test traditional signup/signin
3. **Role-based Access**: Test different user roles and permissions
4. **Profile Updates**: Test updating user information through Clerk

### Environment Variables for Development

Make sure you have these in your `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database
DATABASE_URL=your_database_url
DATABASE_DIRECT_URL=your_direct_database_url
```

### Troubleshooting

#### User Not Created in Database
- Check that webhooks are properly configured
- Verify ngrok tunnel is active and URL is correct in Clerk Dashboard  
- Check server logs for webhook errors

#### Role Not Updating in Frontend
- Verify role was updated in database
- Call the role sync endpoint: `POST /api/admin/sync-roles`
- Clear browser cache/cookies and re-login

#### Can't Access Admin Features
- Verify user has ADMIN role in database
- Check that role is synced to Clerk publicMetadata
- Ensure you're using the correct email for your admin user 
