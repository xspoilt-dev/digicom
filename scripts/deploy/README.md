# Deployment Scripts

This directory contains scripts to help you deploy your Next.js application with Nginx and SSL.

## Prerequisites

- A server running Ubuntu/Debian.
- A domain name pointing to your server's IP address.
- Root or sudo access.

## Files

- `setup.sh`: The main, one-time setup script. Installs dependencies, builds the app, configures PM2, Nginx, and Certbot.
- `nginx.template.conf`: The Nginx configuration template used by `setup.sh`.

## Usage

1.  SSH into your server and clone your repository.
2.  Navigate to the project root.
3.  Run the setup script:

```bash
./scripts/deploy/setup.sh
```

This will:
1.  Install system dependencies (Nginx, Certbot, Node.js, Bun, PM2).
2.  Install project dependencies.
3.  Build the Next.js application.
4.  Start the application with PM2.
5.  Configure Nginx as a reverse proxy for your domain.
6.  Obtain an SSL certificate from Let's Encrypt and configure HTTPS.

## Updates

To update your application later (e.g., after `git pull`):

```bash
# 1. Install new dependencies if any
bun install

# 2. Rebuild
bun run build

# 3. Restart PM2
pm2 restart facevaly
```
