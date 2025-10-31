# >ê HeatMail - Testing & Deployment Guide

**Last Updated:** October 30, 2025
**Purpose:** Complete guide for testing the backend and deploying to production

---

## =Ë Table of Contents

1. [Pre-Testing Checklist](#pre-testing-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Backend Testing](#backend-testing)
5. [API Endpoint Testing](#api-endpoint-testing)
6. [Production Deployment](#production-deployment)
7. [OAuth Configuration](#oauth-configuration)
8. [Troubleshooting](#troubleshooting)

---

##  Pre-Testing Checklist

Before starting, ensure you have:

- [ ] Node.js v18+ installed
- [ ] PostgreSQL 14+ running
- [ ] Redis 7+ running
- [ ] Git installed
- [ ] Postman or Thunder Client for API testing
- [ ] VPS access (for production deployment)

---

## =€ Local Development Setup

### Step 1: Install Dependencies

```bash
cd C:\Users\Admin\CascadeProjects\HeatMail\backend
npm install
```

**Expected Result:** All 40+ dependencies installed successfully

**Common Issues:**
- If you get Python errors, install windows-build-tools: `npm install --global windows-build-tools`
- If bcrypt fails, try: `npm install bcrypt --build-from-source`

### Step 2: Create Environment File

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Server Configuration
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=Papapa987!
DB_NAME=heatmail

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_PREFIX=heatmail:

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Encryption Key (32 characters minimum)
ENCRYPTION_KEY=your-32-character-encryption-key-change-in-production!!

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/oauth/google/callback

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:5001/api/oauth/microsoft/callback

# Email Settings
DEFAULT_EMAILS_PER_DAY=20
MAX_CONVERSATION_STEPS=4
MIN_REPLY_DELAY_HOURS=2
MAX_REPLY_DELAY_HOURS=8
```

**  IMPORTANT:**
- Generate secure random strings for `JWT_SECRET` and `ENCRYPTION_KEY`
- Use at least 32 characters for cryptographic keys
- Never commit `.env` to Git

**Generate Secure Keys:**
```bash
# Generate JWT_SECRET (32 random characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (32 random characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Verify TypeScript Compilation

```bash
npm run build
```

**Expected Result:** TypeScript compiles without errors, `dist/` folder created

**Common TypeScript Errors:**
- Missing types: Install missing @types packages
- Import errors: Check file paths and exports
- Sequelize types: Ensure all model associations are correctly typed

---

## =Ä Database Setup

### Step 1: Create PostgreSQL Database

```sql
-- Connect to PostgreSQL as admin user
psql -U admin -h localhost

-- Create database
CREATE DATABASE heatmail;

-- Verify database created
\l

-- Exit
\q
```

### Step 2: Run Migrations

```bash
npm run migrate
```

**Expected Result:**
```
Starting database migration...
 Database connection established
 Database tables created/updated successfully
<‰ Migration completed successfully!
```

**Tables Created:**
- users (with bcrypt hooks)
- packages (pricing tiers)
- email_accounts (all connection types)
- warmup_emails (email tracking)
- warmup_templates (110 templates)
- warmup_conversations (thread tracking)
- admin_campaigns (admin broadcasts)
- health_score_histories (metrics over time)
- audit_logs (activity tracking)

### Step 3: Run Seeds

```bash
npm run seed
```

**Expected Result:**
```
<1 Starting database seeding...

=æ Seeding packages...
 Package created: Free ($0/monthly)
 Package created: Starter ($29/monthly)
 Package created: Pro ($79/monthly)
 Package created: Enterprise ($199/monthly)

=d Seeding admin user...
 Admin user created successfully
   IMPORTANT: Change the default admin password immediately!
   Email: admin@heatmail.io
   Password: Admin@123456

=ç Seeding email templates...
 Template created: business - Quick question about {{topic}}
 Template created: business - Following up on our conversation
... (110 templates total)
 Templates seeded: 110 created

<‰ All seeds completed successfully!
```

**Verify Seeds:**
```sql
-- Connect to database
psql -U admin -d heatmail

-- Check packages
SELECT id, name, price, "maxMailboxes" FROM packages;

-- Check admin user
SELECT id, email, role FROM users WHERE role = 'admin';

-- Check templates
SELECT category, COUNT(*) FROM warmup_templates GROUP BY category;

-- Expected: business(25), networking(25), feedback(20), collaboration(20), casual(20)
```

---

## >ê Backend Testing

### Step 1: Start Development Server

```bash
npm run dev
```

**Expected Result:**
```
 Database connection established
 Database models synchronized
=€ HeatMail API server running on port 5001
< Environment: development
=ç Frontend URL: http://localhost:3000
=% HeatMail is ready to warm up your emails!
```

**If Server Starts Successfully:**
- Server is listening on `http://localhost:5001`
- Database connected
- Models synchronized
- Workers initialized

**If Server Fails to Start:**
- Check PostgreSQL is running
- Check Redis is running
- Verify `.env` credentials
- Check logs in `logs/` folder
- See [Troubleshooting](#troubleshooting) section

### Step 2: Test Health Endpoint

Open browser or use curl:

```bash
curl http://localhost:5001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "HeatMail API is running",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Step 3: Check Logs

```bash
# Check application logs
tail -f logs/app.log

# Check error logs
tail -f logs/error.log
```

---

## = API Endpoint Testing

### Test Suite 1: Authentication

#### 1. Register New User

```http
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123456",
  "firstName": "Test",
  "lastName": "User",
  "company": "Test Company"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token** - you'll need it for authenticated requests!

#### 3. Get Current User

```http
GET http://localhost:5001/api/auth/me
Authorization: Bearer {YOUR_TOKEN}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user",
    "package": {
      "id": 1,
      "name": "Free",
      "maxMailboxes": 3,
      "maxEmailsPerDayPerMailbox": 20
    }
  }
}
```

### Test Suite 2: User Dashboard

#### 4. Get Dashboard

```http
GET http://localhost:5001/api/user/dashboard
Authorization: Bearer {YOUR_TOKEN}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMailboxes": 0,
      "activeMailboxes": 0,
      "averageHealthScore": 0,
      "emailsSentToday": 0,
      "activeConversations": 0
    },
    "accounts": [],
    "recentActivity": []
  }
}
```

#### 5. Get Mailboxes

```http
GET http://localhost:5001/api/user/mailboxes
Authorization: Bearer {YOUR_TOKEN}
```

#### 6. Get User Stats

```http
GET http://localhost:5001/api/user/stats
Authorization: Bearer {YOUR_TOKEN}
```

### Test Suite 3: Email Account Management

#### 7. Add Email Account (SMTP)

```http
POST http://localhost:5001/api/email-accounts
Authorization: Bearer {YOUR_TOKEN}
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "connectionType": "smtp",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUsername": "your-email@gmail.com",
  "smtpPassword": "your-app-password",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "imapUsername": "your-email@gmail.com",
  "imapPassword": "your-app-password"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Email account added successfully",
  "data": {
    "id": 1,
    "email": "your-email@gmail.com",
    "provider": "gmail",
    "connectionType": "smtp",
    "status": "active",
    "isWarmupEnabled": true,
    "healthScore": 0
  }
}
```

#### 8. Test Connection

```http
POST http://localhost:5001/api/email-accounts/1/test
Authorization: Bearer {YOUR_TOKEN}
```

#### 9. List Email Accounts

```http
GET http://localhost:5001/api/email-accounts
Authorization: Bearer {YOUR_TOKEN}
```

### Test Suite 4: Templates

#### 10. Get All Templates

```http
GET http://localhost:5001/api/templates?limit=10
Authorization: Bearer {YOUR_TOKEN}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 110,
    "templates": [
      {
        "id": 1,
        "category": "business",
        "subject": "Quick question about {{topic}}",
        "body": "Hi {{firstName}}...",
        "variables": ["firstName", "company", "topic", "senderFirstName"],
        "usageCount": 0
      }
    ]
  }
}
```

#### 11. Get Random Template

```http
GET http://localhost:5001/api/templates/random?category=business
Authorization: Bearer {YOUR_TOKEN}
```

#### 12. Get Template Categories

```http
GET http://localhost:5001/api/templates/categories
Authorization: Bearer {YOUR_TOKEN}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "business",
      "initialTemplates": 25,
      "replyTemplates": 0,
      "total": 25
    },
    {
      "category": "networking",
      "initialTemplates": 25,
      "replyTemplates": 0,
      "total": 25
    }
  ]
}
```

### Test Suite 5: Admin Panel

**  Use admin credentials:**
- Email: admin@heatmail.io
- Password: Admin@123456

#### 13. Admin Login

```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@heatmail.io",
  "password": "Admin@123456"
}
```

Save the admin token!

#### 14. Get Admin Dashboard

```http
GET http://localhost:5001/api/admin/dashboard
Authorization: Bearer {ADMIN_TOKEN}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 2,
      "activeUsers": 2,
      "totalMailboxes": 0,
      "activeMailboxes": 0,
      "emailsSentToday": 0,
      "activeConversations": 0,
      "averageHealthScore": 0
    },
    "healthDistribution": {
      "excellent": 0,
      "good": 0,
      "average": 0,
      "poor": 0,
      "critical": 0
    },
    "usersByPackage": [...],
    "recentActivity": [...]
  }
}
```

#### 15. Get All Users

```http
GET http://localhost:5001/api/admin/users?limit=50
Authorization: Bearer {ADMIN_TOKEN}
```

#### 16. Get Platform Stats

```http
GET http://localhost:5001/api/admin/stats
Authorization: Bearer {ADMIN_TOKEN}
```

---

## = OAuth Configuration

### Google OAuth Setup

1. **Go to Google Cloud Console:** https://console.cloud.google.com
2. **Create Project:** "HeatMail"
3. **Enable APIs:**
   - Gmail API
   - Google Workspace Admin SDK (for Domain-Wide Delegation)
4. **Create OAuth Credentials:**
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5001/api/oauth/google/callback` (dev)
     - `https://heatmail.yourdomain.com/api/oauth/google/callback` (prod)
5. **Copy Client ID and Secret** to `.env`
6. **Configure OAuth Consent Screen**
7. **Add Test Users** (for development)

### Microsoft OAuth Setup

1. **Go to Azure Portal:** https://portal.azure.com
2. **Register App:** "HeatMail"
3. **Add Redirect URIs:**
   - `http://localhost:5001/api/oauth/microsoft/callback`
   - `https://heatmail.yourdomain.com/api/oauth/microsoft/callback`
4. **API Permissions:**
   - Mail.ReadWrite
   - Mail.Send
5. **Create Client Secret**
6. **Copy Application (client) ID and Secret** to `.env`

### Domain-Wide Delegation (for 40 Gmail accounts)

1. **Create Service Account** in Google Cloud Console
2. **Download JSON Key File**
3. **Enable Domain-Wide Delegation**
4. **In Google Workspace Admin:**
   - Security ’ API Controls ’ Domain-wide Delegation
   - Add Client ID with scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
5. **Store Service Account JSON** securely (not in Git!)

---

## =€ Production Deployment

### Step 1: VPS Setup

Follow [QUICK_START.md](QUICK_START.md) for detailed VPS deployment instructions.

**Summary:**
1. SSH into VPS (147.93.123.174)
2. Install Node.js, PostgreSQL, Redis, PM2, Nginx
3. Clone repository
4. Install dependencies
5. Configure environment variables
6. Run migrations and seeds
7. Start with PM2
8. Configure Nginx reverse proxy
9. Setup SSL with Certbot

### Step 2: Environment Variables (Production)

Update production `.env`:

```env
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://heatmail.yourdomain.com

# Use production database credentials
# Use strong, randomly generated secrets
# Use production OAuth redirect URIs
```

### Step 3: PM2 Process Management

```bash
# Start server
pm2 start ecosystem.config.js

# Start workers
pm2 start npm --name "heatmail-workers" -- run worker

# View logs
pm2 logs heatmail

# Monitor
pm2 monit

# Save configuration
pm2 save
pm2 startup
```

### Step 4: Nginx Configuration

```nginx
server {
    listen 80;
    server_name heatmail.yourdomain.com;

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## =' Troubleshooting

### Issue: Server Won't Start

**Symptoms:** Error when running `npm run dev`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Check Redis is running: `redis-cli ping`
3. Verify `.env` credentials
4. Check port 5001 is not in use: `netstat -an | findstr :5001`
5. Check logs: `logs/error.log`

### Issue: Database Connection Error

**Symptoms:** `ECONNREFUSED` or authentication errors

**Solutions:**
1. Verify PostgreSQL is running
2. Check database name exists: `psql -l`
3. Verify credentials in `.env`
4. Check pg_hba.conf allows connections
5. Try connecting manually: `psql -U admin -d heatmail`

### Issue: TypeScript Compilation Errors

**Symptoms:** `tsc` errors during build

**Solutions:**
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Delete `dist` folder: `rm -rf dist`
3. Check TypeScript version: `npx tsc --version` (should be 5.3.3)
4. Check for missing types packages

### Issue: OAuth Redirect Errors

**Symptoms:** OAuth flow fails with redirect URI mismatch

**Solutions:**
1. Verify redirect URIs in Google/Microsoft console exactly match `.env`
2. Check port numbers match
3. Verify protocol (http vs https)
4. Clear browser cookies and try again

### Issue: Templates Not Loading

**Symptoms:** Template endpoints return empty arrays

**Solutions:**
1. Verify seeds ran successfully: `npm run seed`
2. Check database: `SELECT COUNT(*) FROM warmup_templates;`
3. Should have 110 templates
4. Re-run seed: `npm run seed:templates`

### Issue: Health Scores Always Zero

**Symptoms:** All mailboxes show 0 health score

**Solutions:**
1. No warmup emails sent yet (expected for new accounts)
2. Workers not running: Start with `npm run worker`
3. Check Bull Queue: Redis should have `heatmail:*` keys
4. Manually trigger: Call update health score endpoint

---

## =Ê Testing Checklist

Use this checklist to verify everything works:

### Backend Core
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Environment variables configured (`.env`)
- [ ] Database created and migrations run
- [ ] Seeds loaded (packages, admin, templates)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Health endpoint responds

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] Get current user with token
- [ ] Change password
- [ ] Update profile

### Email Accounts
- [ ] Add SMTP account
- [ ] Test connection
- [ ] List accounts
- [ ] Update account
- [ ] Pause warmup
- [ ] Resume warmup
- [ ] Delete account

### Templates
- [ ] Get all templates (110 total)
- [ ] Get random template
- [ ] Get categories (5 categories)
- [ ] Get template by ID
- [ ] Admin: Create template
- [ ] Admin: Update template
- [ ] Admin: Delete template

### User Dashboard
- [ ] Get dashboard stats
- [ ] Get mailboxes list
- [ ] Get health history
- [ ] Get activity log
- [ ] Get statistics

### Admin Panel
- [ ] Admin login
- [ ] Get admin dashboard
- [ ] List all users
- [ ] Get user details
- [ ] Update user
- [ ] Delete user (non-admin only)
- [ ] List all mailboxes
- [ ] Get mailbox details
- [ ] Update mailbox
- [ ] Pause/resume mailbox
- [ ] Get platform stats

### Workers (Advanced)
- [ ] Send warmup email worker
- [ ] Send reply worker
- [ ] Check inbox worker
- [ ] Archive thread worker
- [ ] Update health score worker
- [ ] Recurring jobs configured

---

## <¯ Next Steps After Testing

Once backend testing is complete:

1. **Fix any bugs found**
2. **Start frontend development**
3. **Build React dashboard**
4. **Integrate with backend API**
5. **Deploy to production VPS**
6. **Configure OAuth credentials**
7. **Connect your 40 Gmail accounts**
8. **Monitor and optimize**

---

## =Þ Need Help?

If you encounter issues:

1. Check this guide first
2. Review logs in `logs/` folder
3. Check [BUILD_PROGRESS.md](BUILD_PROGRESS.md) for current status
4. Review [QUICK_START.md](QUICK_START.md) for deployment steps
5. Check GitHub issues (if applicable)

---

**Backend is 90% complete - let's test it! =€**
