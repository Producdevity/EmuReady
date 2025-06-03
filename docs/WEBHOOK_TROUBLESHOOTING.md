# Webhook Troubleshooting Guide

This guide helps you debug issues where users are created in Clerk but not in your database.

## Quick Diagnostics

### 1. Check Environment Variables

Ensure you have the required environment variables set in your `.env` or `.env.local` file:

```bash
# Check if CLERK_WEBHOOK_SECRET is set
echo "CLERK_WEBHOOK_SECRET: ${CLERK_WEBHOOK_SECRET:+SET}"

# If not set, you need to get it from Clerk dashboard
```

### 2. Check Webhook Configuration in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Webhooks** in the left sidebar
3. Verify you have a webhook configured with:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events**: `user.created`, `user.updated`, `user.deleted`
   - **Status**: Active (green checkmark)

### 3. Check Server Logs

Look for webhook-related logs in your application console. The enhanced webhook route now logs:

- 🔗 When webhooks are received
- 📥 Header validation status
- ✅ Signature verification success
- 👤 User creation attempts
- ❌ Any errors with detailed information

## Common Issues and Solutions

### Issue 1: Missing CLERK_WEBHOOK_SECRET

**Symptoms:**

- Console shows: `❌ Missing CLERK_WEBHOOK_SECRET environment variable`
- Webhook returns 500 status

**Solution:**

1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Copy the "Signing Secret"
4. Add to your `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```
5. Restart your development server

### Issue 2: Webhook Endpoint Not Accessible

**Symptoms:**

- No webhook logs in console
- Clerk shows failed webhook attempts in dashboard

**Solution:**
For local development, you need to expose your local server:

#### Option A: Using ngrok (Recommended for testing)

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Expose your local server (assuming port 3000)
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your Clerk webhook endpoint to:
# https://abc123.ngrok.io/api/webhooks/clerk
```

#### Option B: Using Cloudflare Tunnel (For persistent setup)

Follow the guide in `docs/AUTHENTICATION_SETUP.md`

### Issue 3: Signature Verification Failed

**Symptoms:**

- Console shows: `❌ Webhook verification failed`
- Webhook returns 400 status

**Solution:**

1. Verify the `CLERK_WEBHOOK_SECRET` matches exactly with Clerk dashboard
2. Ensure there are no extra spaces or characters
3. Make sure the webhook endpoint URL in Clerk matches your actual endpoint

### Issue 4: Database Connection Issues

**Symptoms:**

- Console shows: `❌ Failed to create user in database`
- Database errors in the detailed error output

**Solution:**

1. Check your database connection:
   ```bash
   # Test database connection
   npx prisma db pull
   ```
2. Ensure your database schema is up to date:
   ```bash
   npx prisma db push
   ```
3. Check if the `User` table exists and has the correct schema

### Issue 5: Email Address Issues

**Symptoms:**

- Console shows: `❌ No primary email found for user`
- Lists available emails but none match expected format

**Solution:**
This usually indicates a change in Clerk's webhook payload format. Check:

1. The webhook payload structure in Clerk documentation
2. Update the `primaryEmail` finding logic if needed

## Testing Your Webhook

### Manual Test via Clerk Dashboard

1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook
3. Click "Send Test Event"
4. Select "user.created" event
5. Check your server logs for the test event processing

### Create a Test User

1. Open your app in incognito/private mode
2. Sign up with a new test email
3. Watch the server console for webhook logs
4. Check your database to see if the user was created:
   ```sql
   SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
   ```

## Debugging Checklist

- [ ] `CLERK_WEBHOOK_SECRET` environment variable is set
- [ ] Webhook endpoint is accessible from internet (for production) or via tunnel (for development)
- [ ] Webhook is configured in Clerk dashboard with correct URL
- [ ] Webhook is subscribed to `user.created`, `user.updated`, and `user.deleted` events
- [ ] Database connection is working
- [ ] Prisma schema is up to date (`npx prisma db push`)
- [ ] Server logs show webhook events being received
- [ ] No errors in webhook processing logs

## Getting Help

If you're still experiencing issues:

1. **Check the enhanced logs** - The webhook route now provides detailed logging
2. **Test with a simple case** - Try creating a user with a basic email
3. **Verify each step** - Go through this checklist systematically
4. **Check Clerk status** - Visit [Clerk Status Page](https://status.clerk.com/) for any service issues

## Production Considerations

- Ensure webhook endpoints use HTTPS
- Set up proper error monitoring (Sentry, LogRocket, etc.)
- Consider webhook retry logic for failed attempts
- Monitor webhook performance and response times
- Set up alerts for webhook failures
