# 🗺️ HEATMAIL - Implementation Roadmap

## Overview

This document outlines the specific order of implementation to build HeatMail efficiently.

## Current Status

✅ **Completed:**
- Project structure created
- Configuration files (package.json, tsconfig.json, ecosystem.config.js, nginx.conf)
- Database and Redis configuration
- User and EmailAccount models
- Comprehensive documentation

⏳ **Remaining:** ~80-120 hours of development

## Implementation Order

### WEEK 1: Foundation & Core Backend

#### Day 1-2: Complete Database Layer
**Goal:** All models and migrations ready

```
Tasks:
1. Create remaining models:
   - Package.ts
   - WarmupEmail.ts
   - WarmupTemplate.ts
   - WarmupConversation.ts
   - AdminCampaign.ts
   - HealthScoreHistory.ts
   - AuditLog.ts

2. Create models/index.ts
   - Export all models
   - Define associations (User -> EmailAccount, etc.)

3. Create config/migrate.ts
   - Sync all models to database

4. Create seed files:
   - seeds/admin.seed.ts (create admin user)
   - seeds/packages.seed.ts (free, starter, pro, enterprise)
   - seeds/templates.seed.ts (50 templates to start)
```

**Test:** Run migration, check all tables created

#### Day 3: Authentication System
**Goal:** Users can register and login

```
Tasks:
1. Create utils/jwt.ts
   - generateToken(user)
   - verifyToken(token)

2. Create utils/encryption.ts
   - encrypt(text) - for OAuth tokens
   - decrypt(text)

3. Create middleware/auth.ts
   - Verify JWT token
   - Attach user to request

4. Create services/auth/register.ts
   - Validate input
   - Check duplicate email
   - Hash password
   - Create user

5. Create services/auth/login.ts
   - Find user by email
   - Validate password
   - Generate JWT token

6. Create controllers/auth.controller.ts
   - POST /api/auth/register
   - POST /api/auth/login
   - GET /api/auth/me
   - POST /api/auth/logout

7. Create routes/auth.routes.ts
   - Wire up controller
```

**Test:** Register user, login, get token

#### Day 4: Email Account Management (SMTP/IMAP)
**Goal:** Users can add email accounts manually

```
Tasks:
1. Create services/email/smtp.ts
   - sendEmail(account, to, subject, body)
   - testConnection(smtpConfig)

2. Create services/email/imap.ts
   - connect(imapConfig)
   - pollInbox(account)
   - searchEmails(account, criteria)

3. Create services/email/connection.ts
   - testSMTPConnection(config)
   - testIMAPConnection(config)

4. Create controllers/emailAccount.controller.ts
   - GET /api/email-accounts (list user's accounts)
   - POST /api/email-accounts (add account)
   - PUT /api/email-accounts/:id (update settings)
   - DELETE /api/email-accounts/:id (remove account)
   - POST /api/email-accounts/:id/test (test connection)

5. Create routes/emailAccount.routes.ts
   - Wire up controller
   - Add auth middleware
```

**Test:** Add email account via SMTP, test connection

#### Day 5: Main Backend Setup
**Goal:** Backend API running

```
Tasks:
1. Create middleware/errorHandler.ts
   - Catch all errors
   - Return JSON responses

2. Create middleware/rateLimiter.ts
   - Limit requests per IP

3. Create routes/index.ts
   - Import all route modules
   - Mount at /api

4. Create index.ts (main entry point)
   - Initialize Express
   - Connect to database
   - Connect to Redis
   - Mount routes
   - Start server

5. Create logs/ directory
   - Ensure PM2 can write logs
```

**Test:** Start backend, test auth endpoints

---

### WEEK 2: OAuth & Warmup Logic

#### Day 6-7: OAuth Integration
**Goal:** Users can connect via Gmail/Outlook OAuth

```
Tasks:
1. Create services/oauth/google.ts
   - getAuthUrl() - redirect to Google
   - handleCallback(code) - exchange code for tokens
   - refreshAccessToken(refreshToken)
   - sendEmail(account, message) - using Gmail API

2. Create services/oauth/microsoft.ts
   - getAuthUrl() - redirect to Microsoft
   - handleCallback(code) - exchange code for tokens
   - refreshAccessToken(refreshToken)
   - sendEmail(account, message) - using Microsoft Graph API

3. Create controllers/oauth.controller.ts
   - GET /api/oauth/google (redirect to Google)
   - GET /api/oauth/google/callback (handle callback)
   - GET /api/oauth/microsoft (redirect to Microsoft)
   - GET /api/oauth/microsoft/callback (handle callback)

4. Create routes/oauth.routes.ts
   - Wire up controller

5. Update services/email/smtp.ts
   - Add OAuth support
   - Detect if account uses OAuth vs SMTP
```

**Test:** Connect Gmail account via OAuth

#### Day 8: Domain-Wide Delegation
**Goal:** Admin can connect all accounts in domain

```
Tasks:
1. Create services/oauth/domainWide.ts
   - uploadServiceAccountKey(domain, jsonKey)
   - fetchAllAccountsInDomain(domain)
   - addAccountsToPool(domain, emailList)
   - testDomainAccess(domain)

2. Add admin endpoints in controllers/admin.controller.ts
   - POST /api/admin/domains (add domain)
   - GET /api/admin/domains/:id/accounts (fetch accounts)
   - POST /api/admin/domains/:id/add-accounts (add to pool)

3. Update routes/admin.routes.ts
   - Wire up domain endpoints
```

**Test:** Add domain, fetch accounts, add to pool

#### Day 9-10: Warmup Pool Logic
**Goal:** Emails automatically send to each other

```
Tasks:
1. Create services/warmup/poolMatcher.ts
   - getActiveMailboxes() - fetch all active, not at limit
   - selectRandomPairs() - match senders with receivers
   - avoidRecentPairs(sender, receiver) - check history
   - createEmailJob(from, to, template)

2. Create services/warmup/scheduler.ts
   - scheduleWarmupEmails() - runs every hour
   - calculateDelayForReply(email) - 2-8 hour delay
   - scheduleReplyJob(email, delay)

3. Create services/warmup/replyGenerator.ts
   - selectReplyTemplate(originalEmail)
   - generateReplyContent(template, context)
   - fillTemplateVariables(template, data)

4. Create services/warmup/archiver.ts
   - archiveGmailThread(account, threadId)
   - archiveOutlookThread(account, threadId)
   - archiveImapThread(account, threadId)

5. Create Bull Queue setup in config/queue.ts
   - Export queues: sendWarmupEmailQueue, sendReplyQueue, archiveThreadQueue

6. Create workers/sendWarmupEmail.worker.ts
   - Process send-warmup-email jobs
   - Get account credentials
   - Send email via SMTP or OAuth
   - Mark as sent in database
   - Update daily counters

7. Create workers/sendReply.worker.ts
   - Process send-reply jobs
   - Generate reply content
   - Send reply
   - Check if conversation is complete
   - Schedule archive job if complete

8. Create workers/archiveThread.worker.ts
   - Process archive-thread jobs
   - Archive via Gmail/Outlook/IMAP API
   - Mark conversation as archived

9. Create workers/index.ts
   - Start all workers
   - Handle graceful shutdown
```

**Test:** Add 2 email accounts, wait for them to email each other

#### Day 11: IMAP Polling for Auto-Reply
**Goal:** System detects warmup emails and auto-replies

```
Tasks:
1. Create workers/checkInbox.worker.ts
   - Run every 15 minutes
   - Poll all active accounts via IMAP
   - Search for emails with X-Warmup-Email: true header
   - Check if not already replied
   - Create reply job

2. Update services/warmup/scheduler.ts
   - Add cron job for inbox polling
```

**Test:** Send warmup email, verify auto-reply triggered

---

### WEEK 3: Health Scoring & Frontend

#### Day 12-13: Health Scoring System
**Goal:** Calculate and display mailbox health scores

```
Tasks:
1. Create services/health/tracker.ts
   - trackEmailLanding(email, folder) - inbox or spam?
   - trackEmailOpen(email)
   - trackEmailReply(email)
   - trackEmailBounce(email)

2. Create services/health/calculator.ts
   - calculateHealthScore(account)
   - Formula: (inboxRate*0.35 + openRate*0.25 + replyRate*0.20 + (100-spamRate)*0.15 + (100-bounceRate)*0.05)

3. Create workers/updateHealthScore.worker.ts
   - Run daily at midnight
   - Calculate health score for all accounts
   - Save to HealthScoreHistory table
   - Update EmailAccount.healthScore

4. Update controllers/user.controller.ts
   - GET /api/user/dashboard (include health scores)
   - GET /api/user/mailboxes/:id/health-history

5. Update controllers/admin.controller.ts
   - GET /api/admin/stats (platform-wide health stats)
```

**Test:** Send emails, verify health scores update

#### Day 14: Gradual Volume Increase
**Goal:** New mailboxes ramp up volume safely

```
Tasks:
1. Create services/warmup/gradualIncrease.ts
   - calculateCurrentVolume(account)
   - shouldIncreaseVolume(account)
   - adjustVolume(account)

2. Create workers/gradualIncrease.worker.ts
   - Run daily
   - Check accounts with useGradualIncrease=true
   - Adjust emailsPerDay based on schedule
   - Pause/reduce if spam rate increases

3. Update controllers/emailAccount.controller.ts
   - Add gradual increase settings to update endpoint
```

**Test:** Enable gradual increase, verify volume ramps up

#### Day 15-16: Frontend Setup & Authentication
**Goal:** Users can login via web interface

```
Tasks:
1. Initialize React app:
   - npx create-react-app frontend --template typescript
   - Install dependencies: @mui/material, react-router-dom, axios, recharts

2. Create src/services/api.ts
   - Axios instance with base URL
   - Interceptors for JWT token

3. Create src/contexts/AuthContext.tsx
   - Manage auth state
   - Login, logout, register functions

4. Create src/pages/auth/Login.tsx
   - Login form
   - Call /api/auth/login

5. Create src/pages/auth/Register.tsx
   - Registration form
   - Call /api/auth/register

6. Create src/App.tsx
   - React Router setup
   - Protected routes

7. Create src/components/Layout.tsx
   - Header, sidebar, main content area
```

**Test:** Login via web, see dashboard

#### Day 17-19: User Dashboard
**Goal:** Users see their mailboxes and health scores

```
Tasks:
1. Create src/pages/user/Dashboard.tsx
   - Overview cards (total mailboxes, emails sent today, avg health score)
   - Recent activity list

2. Create src/pages/user/Mailboxes.tsx
   - List all user's email accounts
   - Show health score for each
   - Add/edit/delete mailbox buttons

3. Create src/pages/user/AddMailbox.tsx
   - OAuth buttons (Connect Gmail / Connect Outlook)
   - Manual form (SMTP/IMAP)
   - App password form

4. Create src/components/HealthScoreCard.tsx
   - Display health score with color coding
   - Show breakdown (inbox rate, spam rate, etc.)
   - Show trend chart

5. Create src/services/emailAccount.service.ts
   - API calls for mailbox management
```

**Test:** Add mailbox via UI, view health score

#### Day 20-21: Admin Dashboard
**Goal:** Admin can manage users and mailboxes

```
Tasks:
1. Create src/pages/admin/Dashboard.tsx
   - Platform statistics
   - Health overview
   - Recent alerts

2. Create src/pages/admin/Users.tsx
   - List all users
   - Search/filter
   - Edit user modal (change package, limits)
   - Delete user

3. Create src/pages/admin/Mailboxes.tsx
   - List all mailboxes in pool
   - Search/filter by owner, provider, health score
   - Mailbox detail modal
   - Pause/resume warmup

4. Create src/pages/admin/Templates.tsx
   - List templates
   - Create/edit template modal
   - Activate/deactivate

5. Create src/services/admin.service.ts
   - API calls for admin operations
```

**Test:** Login as admin, manage users and mailboxes

---

### WEEK 4: Advanced Features & Deployment

#### Day 22-23: Template Management & Admin Campaigns
**Goal:** 100+ templates, admin can send campaigns

```
Tasks:
1. Create more templates in seeds/templates.seed.ts
   - 100+ templates across categories
   - Sales, support, invoice, meeting, general

2. Create services/campaign/elasticEmail.ts
   - sendCampaignEmail(campaign, recipient)
   - Track sends, opens, replies

3. Create workers/adminCampaign.worker.ts
   - Process admin-campaign jobs
   - Send to pool members
   - Respect rate limits

4. Create controllers/campaign.controller.ts
   - GET /api/admin/campaigns
   - POST /api/admin/campaigns (create)
   - GET /api/admin/campaigns/:id/stats

5. Create src/pages/admin/Campaigns.tsx
   - List campaigns
   - Create campaign modal
   - View campaign stats
```

**Test:** Create campaign, send to pool

#### Day 24: Testing & Bug Fixes
**Goal:** Fix any issues found

```
Tasks:
1. Test all connection methods
   - OAuth (Gmail, Outlook)
   - SMTP/IMAP
   - App Password
   - Domain-Wide Delegation

2. Test warmup flow
   - Emails send automatically
   - Auto-replies work
   - Threads archive correctly

3. Test health scoring
   - Scores calculate correctly
   - Historical data saves

4. Test gradual increase
   - Volume ramps up on schedule

5. Fix any bugs found
```

#### Day 25: VPS Deployment
**Goal:** Deploy to production

```
Tasks:
1. Commit code to Git repository

2. SSH to VPS and clone:
   ssh -i C:\Users\Admin\.ssh\id_ed25519 root@147.93.123.174
   cd /var/www
   git clone <repo-url> heatmail

3. Setup database:
   sudo -u postgres psql
   CREATE DATABASE heatmail;
   GRANT ALL PRIVILEGES ON DATABASE heatmail TO admin;

4. Install dependencies:
   cd /var/www/heatmail/backend && npm install --production
   cd /var/www/heatmail/frontend && npm install && npm run build

5. Configure environment:
   cp backend/.env.example backend/.env
   nano backend/.env  # Edit with production values

6. Run migrations:
   cd backend && npm run migrate && npm run seed

7. Start with PM2:
   pm2 start ecosystem.config.js
   pm2 save

8. Configure Nginx:
   cp nginx.conf /etc/nginx/sites-available/heatmail
   ln -s /etc/nginx/sites-available/heatmail /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx

9. Setup SSL:
   certbot --nginx -d heatmail.senditnow.cc

10. Test:
    Visit https://heatmail.senditnow.cc
    Login as admin
    Add test mailbox
    Verify emails send
```

#### Day 26-28: OAuth Setup & Final Testing
**Goal:** Configure OAuth, test with real accounts

```
Tasks:
1. Setup Google OAuth:
   - Create project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth credentials
   - Add redirect URI
   - Copy to .env

2. Setup Microsoft OAuth:
   - Create app in Azure Portal
   - Add redirect URI
   - Grant Mail.Send, Mail.ReadWrite permissions
   - Copy to .env

3. Setup Domain-Wide Delegation:
   - Create service account
   - Enable domain-wide delegation
   - Authorize in Workspace Admin Console
   - Download JSON key

4. Test with real accounts:
   - Connect your 40 Gmail accounts
   - Monitor warmup emails
   - Check health scores after 24-48 hours

5. Fine-tune settings:
   - Adjust reply delays
   - Tweak health score weights
   - Optimize queue performance

6. Monitor performance:
   - pm2 monit
   - Check database growth
   - Monitor Redis memory
   - Review Nginx logs
```

## Completion Checklist

### Backend
- [ ] All 8 models created and migrated
- [ ] Authentication working (register, login, JWT)
- [ ] Email accounts CRUD working
- [ ] OAuth working (Gmail + Outlook)
- [ ] Domain-Wide Delegation working
- [ ] SMTP/IMAP working
- [ ] Warmup pool sending emails automatically
- [ ] Auto-reply system working
- [ ] Auto-archive working
- [ ] Health scores calculating correctly
- [ ] Gradual increase working
- [ ] Admin campaigns working
- [ ] All Bull Queue workers running

### Frontend
- [ ] User can register and login
- [ ] User dashboard shows mailboxes and health scores
- [ ] User can add mailbox (OAuth + Manual)
- [ ] User can edit mailbox settings
- [ ] Admin dashboard shows platform stats
- [ ] Admin can manage users
- [ ] Admin can manage all mailboxes
- [ ] Admin can manage templates
- [ ] Admin can create and send campaigns

### Deployment
- [ ] Code pushed to Git
- [ ] VPS setup complete
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] PM2 processes running
- [ ] Nginx configured with SSL
- [ ] OAuth credentials configured
- [ ] Domain-Wide Delegation setup (if needed)
- [ ] Monitoring setup (logs, PM2)

### Testing
- [ ] Registered test user
- [ ] Connected test mailbox
- [ ] Warmup emails sending automatically
- [ ] Auto-replies working
- [ ] Threads archiving correctly
- [ ] Health scores updating
- [ ] All connection methods tested
- [ ] Admin panel fully functional

## Notes

- This is an aggressive but achievable timeline
- Assumes full-time work (8 hours/day)
- May need adjustments based on complexity encountered
- Testing is crucial - don't skip Day 24!

## Priority Order (if time-constrained)

If you need to cut scope, implement in this order:

1. **Must Have (MVP):**
   - Authentication
   - Email account management (SMTP only)
   - Basic warmup pool (send emails between accounts)
   - Auto-reply
   - User dashboard (view mailboxes)

2. **Should Have:**
   - OAuth (Gmail + Outlook)
   - Health scoring
   - Auto-archive
   - Admin dashboard

3. **Nice to Have:**
   - Domain-Wide Delegation
   - Gradual volume increase
   - Admin campaigns
   - 100+ templates
   - Advanced analytics

## Questions Before Starting?

- Do you want to build the full version or start with MVP?
- Any specific features to prioritize?
- Timeline constraints?
- Any specific pain points with existing warmup tools you want to address?

Ready to start building! Let me know how you want to proceed.
