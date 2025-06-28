# Authentication Setup Guide

## Add these Clerk environment variables to your `.env` file:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

# Setting Up Cloudflare Tunnel for Local Development

This guide explains how contributors can set up a Cloudflare Tunnel to expose their local development server for webhook testing and development.

---

## Prerequisites

- A Cloudflare account with your development domain added (e.g., `emuready.com`).
- Installed [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).
- Node.js and your project dependencies installed.

---

## Step 1: Authenticate with Cloudflare

Run the following command to authenticate your local machine with your Cloudflare account:

```bash
cloudflared tunnel login
```

This will open a browser window to complete authentication.

---

## Step 2: Create a Tunnel

Create a named tunnel for your local development environment:

```bash
cloudflared tunnel create <your-tunnel-name>
```

Replace `<your-tunnel-name>` with a descriptive name, e.g., `clerk-webhook-tunnel`.

---

## Step 3: Configure DNS Routing

Map your tunnel to a subdomain in Cloudflare DNS:

```bash
cloudflared tunnel route dns <your-tunnel-name> dev.emuready.com
```

Replace `dev.emuready.com` with the subdomain assigned for your development environment.

---

## Step 4: Create a Config File

Create the Cloudflare Tunnel config file at `~/.cloudflared/config.yml` with the following content:

```yaml
tunnel: <your-tunnel-name>
credentials-file: ~/.cloudflared/<your-credentials-file>.json

ingress:
  - hostname: dev.emuready.com
    service: http://localhost:<your-local-port>
  - service: http_status:404
```

- Replace `dev.emuready.com` with your assigned subdomain.
- Replace `<your-tunnel-name>` with your tunnel name.
- Replace `<your-username>` with your system username.
- Replace `<your-credentials-file>` with the JSON credentials filename created in Step 2.
- Replace `<your-local-port>` with the port your local development server runs on (commonly 3000).

---

## Step 5: Run Your Local Development Server

Start your local development server, for example:

```bash
npm run dev
```

Ensure the server is listening on the port specified in the config file.

---

## Step 6: Run the Cloudflare Tunnel

Start the tunnel to expose your local server:

```bash
cloudflared tunnel run <your-tunnel-name>
```

---

## Step 7: Configure Clerk Webhook

In the Clerk dashboard:

- Set the webhook endpoint URL to: `https://<your-subdomain>.<your-domain.com>/api/webhooks/clerk`

- Subscribe to relevant events (e.g., `user.created`, `user.updated`, `user.deleted`).

- Copy the webhook secret and add it to your local environment variables in `.env.local`:

```dotenv
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Notes

- **Do not commit any secrets** (like `CLERK_WEBHOOK_SECRET`) to the repository.
- Use `.env.example` with placeholder values for reference.
- Make sure your firewall and local environment allow incoming connections from Cloudflare.

---

## Troubleshooting

- Verify the tunnel is running and reachable at the specified subdomain.
- Confirm your local server is accessible on the configured port.
- Check that your webhook handler route matches `/api/webhooks/clerk`.
- For any permission or network issues, check your firewall and Cloudflare settings.

---

If you encounter issues or need help, please reach out to the maintainers.

---

## Using ngrok (Quick setup and doesn't require owning a domain)

If you don’t have a domain or Cloudflare account, you can use [ngrok](https://ngrok.com/) to expose your local development server.

1. Install ngrok and start your local server as usual.

2. Run ngrok on your local port (e.g., 3000):

```bash
ngrok http 3000
```

3. Copy the HTTPS forwarding URL provided by ngrok (e.g., https://abcd1234.ngrok.io).
4. In the Clerk dashboard, set the webhook endpoint to: `https://<your-ngrok-url>/api/webhooks/clerk`

Follow the same remaining steps as for Cloudflare Tunnel (subscribe to events, add the webhook secret to `.env.local`, etc.).

> _Note_: ngrok URLs change each time you start a new tunnel unless you have a paid plan with reserved domains.

---

If you are having issues with Clerk webhooks, see the [Webhook Troubleshooting Guide](WEBHOOK_TROUBLESHOOTING.md).
