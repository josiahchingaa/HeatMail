# 🚀 HEATMAIL - Quick Start Guide

## Overview

This guide will help you get HeatMail up and running on your VPS in about 30-60 minutes.

## Prerequisites

✅ VPS Server: 147.93.123.174
✅ SSH Key: `C:\Users\Admin\.ssh\id_ed25519`
✅ PostgreSQL installed (shared with SendItNow)
✅ Redis installed (shared with SendItNow)
✅ Nginx installed
✅ PM2 installed
✅ Node.js 18+ installed

## Phase 1: Local Development Setup (Optional but Recommended)

### Step 1: Install Dependencies Locally

```bash
# Navigate to project
cd C:\Users\Admin\CascadeProjects\HeatMail

# Install backend dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your local database credentials
code .env
```

### Step 2: Test Locally (Optional)

```bash
# Start backend in development mode
cd backend
npm run dev

# In another terminal, start frontend
cd frontend
npm install
npm start
```

## Phase 2: VPS Deployment (Production)

### Step 1: Connect to VPS

```bash
ssh -i C:\Users\Admin\.ssh\id_ed25519 root@147.93.123.174
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE heatmail;
GRANT ALL PRIVILEGES ON DATABASE heatmail TO admin;
\q
```

### Step 3: Upload Project to VPS

**Option A: Using Git (Recommended)**

```bash
# On VPS
cd /var/www
git clone <your-repository-url> heatmail
cd heatmail
```

**Option B: Using SCP from Local Machine**

```bash
# From your local machine (Windows)
scp -i C:\Users\Admin\.ssh\id_ed25519 -r C:\Users\Admin\CascadeProjects\HeatMail root@147.93.123.174:/var/www/heatmail
```

### Step 4: Install Dependencies on VPS

```bash
# On VPS
cd /var/www/heatmail

# Install backend dependencies
cd backend
npm install --production

# Go back to root
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
```

### Step 5: Configure Environment Variables

```bash
cd /var/www/heatmail/backend
cp .env.example .env
nano .env
```

**Edit these critical values:**

```env
NODE_ENV=production
PORT=5052
FRONTEND_URL=https://heatmail.senditnow.cc

# Database (using shared PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=Papapa987!
DB_NAME=heatmail

# Redis (using shared Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PREFIX=heatmail:

# JWT Secret (generate a random secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-NOW

# Encryption Key (generate a 32-character key)
ENCRYPTION_KEY=your-32-character-encryption-key

# Admin Account (change password!)
ADMIN_EMAIL=admin@heatmail.com
ADMIN_PASSWORD=ChangeThisPassword123!

# Google OAuth (setup later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://heatmail.senditnow.cc/api/oauth/google/callback

# Microsoft OAuth (setup later)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=https://heatmail.senditnow.cc/api/oauth/microsoft/callback

# Elastic Email (for admin campaigns)
ELASTIC_EMAIL_API_KEY=your-elastic-email-key
ELASTIC_EMAIL_FROM=admin@senditnow.cc
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Run Database Migrations

```bash
cd /var/www/heatmail/backend
npm run migrate
npm run seed
```

This will create all tables and insert default data (admin user, packages, templates).

### Step 7: Configure PM2

```bash
cd /var/www/heatmail
pm2 start ecosystem.config.js
pm2 save
```

**Check status:**

```bash
pm2 status
pm2 logs heatmail-backend
pm2 logs heatmail-worker
```

### Step 8: Configure Nginx

```bash
# Copy nginx configuration
cp /var/www/heatmail/nginx.conf /etc/nginx/sites-available/heatmail

# Create symbolic link
ln -s /etc/nginx/sites-available/heatmail /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 9: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot if not already installed
apt-get update
apt-get install certbot python3-certbot-nginx

# Get certificate for subdomain
certbot --nginx -d heatmail.senditnow.cc

# Follow prompts and choose redirect HTTP to HTTPS
```

### Step 10: Test the Application

1. **Open browser:** https://heatmail.senditnow.cc
2. **Login with admin credentials:**
   - Email: admin@heatmail.com
   - Password: (whatever you set in .env)

## Phase 3: OAuth Setup (Google & Microsoft)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "HeatMail"
3. **Enable APIs:**
   - Gmail API
   - Google+ API (for user info)
4. **Create OAuth 2.0 Credentials:**
   - Go to: APIs & Services > Credentials
   - Click: Create Credentials > OAuth client ID
   - Application type: Web application
   - Name: "HeatMail Production"
   - Authorized redirect URIs:
     - `https://heatmail.senditnow.cc/api/oauth/google/callback`
   - Click Create
5. **Copy credentials to .env:**
   ```bash
   ssh -i C:\Users\Admin\.ssh\id_ed25519 root@147.93.123.174
   cd /var/www/heatmail/backend
   nano .env
   # Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   ```
6. **Restart backend:**
   ```bash
   pm2 restart heatmail-backend
   ```

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. **Register application:**
   - Azure Active Directory > App registrations > New registration
   - Name: "HeatMail"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI (Web): `https://heatmail.senditnow.cc/api/oauth/microsoft/callback`
   - Click Register
3. **Add API permissions:**
   - Go to: API permissions > Add a permission
   - Microsoft Graph > Delegated permissions
   - Select: `Mail.Send`, `Mail.ReadWrite`, `offline_access`
   - Click Add permissions
   - Click "Grant admin consent" (if you're admin)
4. **Create client secret:**
   - Go to: Certificates & secrets > New client secret
   - Description: "HeatMail Production"
   - Expires: 24 months
   - Click Add
   - **COPY THE SECRET NOW** (you won't see it again)
5. **Copy credentials to .env:**
   ```bash
   cd /var/www/heatmail/backend
   nano .env
   # Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET
   ```
6. **Restart backend:**
   ```bash
   pm2 restart heatmail-backend
   ```

## Phase 4: Domain-Wide Delegation Setup (Optional - For Your 40 Gmail Accounts)

### Prerequisites
- You must be a Google Workspace admin
- Your 40 Gmail accounts must be on a Google Workspace domain you control

### Steps

1. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Same project as OAuth: "HeatMail"
   - IAM & Admin > Service Accounts > Create Service Account
   - Name: "HeatMail Domain-Wide"
   - Click Create and Continue
   - Skip role assignment
   - Click Done

2. **Enable Domain-Wide Delegation:**
   - Click on the service account you just created
   - Click "Show Domain-Wide Delegation"
   - Click "Enable Domain-Wide Delegation"
   - Product name: "HeatMail"
   - Click Save

3. **Download JSON Key:**
   - Go to Keys tab
   - Add Key > Create new key
   - Key type: JSON
   - Click Create
   - **Save the JSON file** (you'll upload it in HeatMail admin panel)

4. **Authorize in Google Workspace Admin Console:**
   - Go to [Google Workspace Admin Console](https://admin.google.com/)
   - Security > API Controls > Domain-Wide Delegation
   - Click "Add new"
   - Client ID: (copy from service account details in Cloud Console)
   - OAuth Scopes: `https://mail.google.com/`
   - Click Authorize

5. **Add Domain in HeatMail:**
   - Login to HeatMail as admin
   - Go to: Admin Panel > Mailboxes > Add Domain
   - Enter domain: `@yourdomain.com`
   - Upload the JSON key file
   - Click "Fetch Accounts"
   - Select the 40 accounts you want to add
   - Click "Add to Pool"

## Phase 5: Connecting Your First Email Account

### Method 1: OAuth (Easiest for Gmail/Outlook)

1. **Login to HeatMail**
2. **Go to: User Dashboard > Email Accounts**
3. **Click: "Connect Gmail" or "Connect Outlook"**
4. **Authorize access** (follow OAuth flow)
5. **Done!** Email is now in the warmup pool

### Method 2: SMTP + IMAP (For Custom Domains)

1. **Login to HeatMail**
2. **Go to: User Dashboard > Email Accounts > Add Manually**
3. **Enter SMTP details:**
   - SMTP Host: `smtp.yourdomain.com`
   - SMTP Port: `587` (or 465 for SSL)
   - Username: `your@email.com`
   - Password: `your-password`
4. **Enter IMAP details:**
   - IMAP Host: `imap.yourdomain.com`
   - IMAP Port: `993`
   - Username: `your@email.com`
   - Password: `your-password`
5. **Click: Test Connection**
6. **If successful, click: Save**

### Method 3: App Password (For Gmail with 2FA)

1. **Generate app password:**
   - Go to [Google Account](https://myaccount.google.com/)
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
2. **Login to HeatMail**
3. **Go to: User Dashboard > Email Accounts > Add with App Password**
4. **Enter:**
   - Email: `your@gmail.com`
   - App Password: (paste the 16-character password)
5. **Click: Connect**

## Phase 6: Monitor the System

### Check Backend Logs
```bash
pm2 logs heatmail-backend
```

### Check Worker Logs
```bash
pm2 logs heatmail-worker
```

### Check Database
```bash
sudo -u postgres psql heatmail
SELECT COUNT(*) FROM "Users";
SELECT COUNT(*) FROM "EmailAccounts";
SELECT * FROM "EmailAccounts" LIMIT 5;
```

### Check Redis Queue
```bash
redis-cli
KEYS heatmail:*
LLEN heatmail:send-warmup-email
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/heatmail-access.log
tail -f /var/log/nginx/heatmail-error.log
```

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs heatmail-backend --lines 50

# Common issues:
# 1. Database connection failed - check DB_PASSWORD in .env
# 2. Redis connection failed - check Redis is running: systemctl status redis-server
# 3. Port already in use - check: lsof -i :5052
```

### OAuth Not Working
```bash
# Check redirect URIs match exactly
# Google Console: https://console.cloud.google.com/
# Azure Portal: https://portal.azure.com/
# HeatMail .env file

# Restart backend after changing .env:
pm2 restart heatmail-backend
```

### Emails Not Sending
```bash
# Check worker logs
pm2 logs heatmail-worker --lines 50

# Check queue
redis-cli
KEYS heatmail:*
LLEN heatmail:send-warmup-email

# Common issues:
# 1. OAuth token expired - re-connect email account
# 2. SMTP credentials wrong - test connection in UI
# 3. Daily limit reached - check EmailAccount.dailyEmailsSent
```

### Frontend Not Loading
```bash
# Check Nginx configuration
nginx -t

# Check if frontend is built
ls -la /var/www/heatmail/frontend/build

# Rebuild if needed
cd /var/www/heatmail/frontend
npm run build

# Reload Nginx
systemctl reload nginx
```

## Next Steps

1. **Connect your 40 email accounts** using Domain-Wide Delegation or OAuth
2. **Monitor the warmup pool** - emails should start sending automatically
3. **Check health scores** - after a few days, you'll see deliverability metrics
4. **Adjust settings** - modify emails per day, enable gradual increase
5. **Review templates** - customize or add more templates
6. **Set up admin campaigns** (optional) - send campaigns to the pool

## Important Notes

- **First emails**: The system will start sending emails within 15-30 minutes of connecting accounts
- **Reply delays**: Replies are delayed 2-8 hours to mimic natural behavior
- **Health scores**: Need at least 100 sent emails before scores are accurate
- **Spam management**: If emails land in spam, manually mark as "Not Spam"
- **Daily limits**: Reset at midnight UTC

## Getting Help

- **Check logs first**: `pm2 logs`
- **Check database**: `psql -U admin heatmail`
- **Check Redis**: `redis-cli`
- **Review Nginx logs**: `/var/log/nginx/heatmail-error.log`

---

**Estimated Setup Time:** 30-60 minutes
**Difficulty:** Intermediate
**Prerequisites:** Basic Linux and Node.js knowledge

Good luck! 🚀
