# CORS Configuration Guide

## Overview

CORS (Cross-Origin Resource Sharing) controls which websites can access your API. This is a security feature that prevents unauthorized websites from using your API through users' browsers.

## Default Allowed Origins

The following origins are **ALWAYS allowed** by default (hardcoded):

### Your Domains
- `https://emuready.com` - Main production site
- `https://www.emuready.com` - WWW subdomain
- `https://dev.emuready.com` - Development environment
- `https://staging.emuready.com` - Staging environment

### Partner Sites
- `https://eden-emu.dev` - Eden emulator website (shows EmuReady listings)
- `https://eden-emulator-github-io.vercel.app` - Eden staging site

### Mobile Apps
- `capacitor://localhost` - Capacitor mobile apps
- `ionic://localhost` - Ionic mobile apps

## Adding Additional Origins

If you need to allow additional websites to access your API, you can add them using the `ALLOWED_ORIGINS` environment variable.

### Environment Variable

Add to your `.env` file:
```bash
# Single origin
ALLOWED_ORIGINS="https://custom-site.com"

# Multiple origins (comma-separated)
ALLOWED_ORIGINS="https://custom-site.com,https://another-site.com,https://third-site.com"
```

### Common Use Cases

1. **Local development with tunnels (ngrok, cloudflared)**:
   ```bash
   ALLOWED_ORIGINS="https://abc123.ngrok.io"
   ```

2. **Adding new partner sites**:
   ```bash
   ALLOWED_ORIGINS="https://partner-site.com,https://another-partner.com"
   ```

3. **Testing from different domains**:
   ```bash
   ALLOWED_ORIGINS="https://test.emuready.com,https://beta.emuready.com"
   ```

## How It Works

1. **Single Source of Truth**: All CORS configuration is centralized in `/src/lib/cors.ts`
2. **Used By**:
   - `middleware.ts` - Protects `/api/trpc/*` routes
   - Mobile API routes - `/api/mobile/*` endpoints
   - Other API endpoints

3. **Request Flow**:
   ```
   Website makes API request → 
   Server checks origin header → 
   If origin is in allowed list → Allow
   If not → Block (return 403)
   ```

## Server-to-Server API Calls

For server-to-server API calls (no browser involved), you can bypass CORS by using an API key:

1. Set the `INTERNAL_API_KEY` environment variable:
   ```bash
   INTERNAL_API_KEY="your-secret-api-key-here"
   ```

2. Include the API key in your requests:
   ```javascript
   fetch('https://emuready.com/api/trpc/listings.getAll', {
     headers: {
       'x-api-key': 'your-secret-api-key-here'
     }
   })
   ```

## Security Notes

- **Never use wildcard (`*`)** for CORS in production
- **Always specify exact origins** including protocol (https://)
- **Don't include trailing slashes** in origins
- **API keys should be kept secret** and rotated regularly

## Troubleshooting

### "Access denied. Invalid origin" Error

This means the website trying to access your API is not in the allowed list.

**Solution**: Add the origin to `ALLOWED_ORIGINS` environment variable.

### Mobile App Can't Connect

Mobile apps should work automatically as `capacitor://localhost` and `ionic://localhost` are always allowed.

**Check**:
- Make sure your mobile app is using the correct origin
- Check if the mobile app is sending the proper origin header

### Partner Site Can't Access API

If Eden or other partner sites can't access your API:

1. Check if they're in the hardcoded `PARTNER_ORIGINS` list in `/src/lib/cors.ts`
2. If not, add them to `ALLOWED_ORIGINS` environment variable
3. Make sure they're using HTTPS in production

## Testing CORS

You can test CORS configuration using curl:

```bash
# Test with origin header
curl -H "Origin: https://eden-emu.dev" \
     -I https://api.emuready.com/api/trpc/listings.getAll

# Should see: Access-Control-Allow-Origin: https://eden-emu.dev
```

## Environment Files

Make sure to update these files when deploying:
- `.env.local` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

Remember: The hardcoded origins are always included, so you only need to add **additional** origins via environment variables.
