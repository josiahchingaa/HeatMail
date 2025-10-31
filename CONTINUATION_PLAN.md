# 🔄 HEATMAIL - Continuation Plan

This document provides templates and guidance for completing the remaining components.

---

## 📋 WHAT'S BEEN BUILT (35% Complete)

✅ **Foundation (100% Complete)**
- All 11 database models with associations
- JWT authentication system
- Encryption utilities
- Input validators
- Middleware (auth, error handling, rate limiting)
- Logger setup
- Auth routes and controllers
- SMTP email service (basic)

✅ **Files Created:** 26 files, ~2,800 lines of code

---

## 🎯 WHAT NEEDS TO BE BUILT (65% Remaining)

### PRIORITY 1: Email Services (Complete IMAP & Connection Testing)

**File:** `backend/src/services/email/imap.ts`

```typescript
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

// Functions needed:
// - connectToIMAP(config) - Connect to IMAP server
// - pollInbox(emailAccount) - Check for new emails
// - searchWarmupEmails(connection) - Find emails with X-Warmup-Email header
// - markAsRead(connection, uid) - Mark email as read
// - archiveEmail(connection, uid) - Move to archive
// - getDecryptedIMAPConfig(emailAccount) - Decrypt IMAP credentials
```

**File:** `backend/src/services/email/connection.ts`

```typescript
// Functions needed:
// - testEmailConnection(emailAccount) - Test both SMTP and IMAP
// - reconnectEmailAccount(emailAccount) - Retry connection
// - refreshOAuthToken(emailAccount) - Refresh expired OAuth tokens
```

---

### PRIORITY 2: OAuth Services

**File:** `backend/src/services/oauth/google.ts`

```typescript
import { google } from 'googleapis';

// OAuth Flow:
// 1. getAuthUrl() - Generate Google OAuth URL
// 2. handleCallback(code) - Exchange code for tokens
// 3. refreshAccessToken(refreshToken) - Refresh expired tokens
// 4. sendEmailViaGmail(account, message) - Send using Gmail API
// 5. listGmailMessages(account) - List inbox messages
// 6. archiveGmailThread(account, threadId) - Archive conversation

// Google OAuth credentials from .env:
// - GOOGLE_CLIENT_ID
// - GOOGLE_CLIENT_SECRET
// - GOOGLE_REDIRECT_URI
```

**File:** `backend/src/services/oauth/microsoft.ts`

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';

// OAuth Flow:
// 1. getAuthUrl() - Generate Microsoft OAuth URL
// 2. handleCallback(code) - Exchange code for tokens
// 3. refreshAccessToken(refreshToken) - Refresh expired tokens
// 4. sendEmailViaOutlook(account, message) - Send using Graph API
// 5. listOutlookMessages(account) - List inbox messages
// 6. archiveOutlookThread(account, threadId) - Archive conversation

// Microsoft OAuth credentials from .env:
// - MICROSOFT_CLIENT_ID
// - MICROSOFT_CLIENT_SECRET
// - MICROSOFT_REDIRECT_URI
```

**File:** `backend/src/services/oauth/domainWide.ts`

```typescript
import { google } from 'googleapis';

// Domain-Wide Delegation for Google Workspace:
// 1. uploadServiceAccountKey(domain, jsonKey) - Store service account
// 2. testDomainAccess(domain) - Verify delegation works
// 3. fetchAllUsersInDomain(domain) - List all email accounts
// 4. impersonateUser(serviceAccount, userEmail) - Impersonate user
// 5. sendAsUser(serviceAccount, userEmail, message) - Send email as user
```

---

### PRIORITY 3: Email Account Management APIs

**File:** `backend/src/controllers/emailAccount.controller.ts`

```typescript
import { Request, Response } from 'express';

// Endpoints needed:
// - GET /api/email-accounts - List user's email accounts
// - POST /api/email-accounts - Add new email account (SMTP/IMAP/OAuth)
// - GET /api/email-accounts/:id - Get specific account details
// - PUT /api/email-accounts/:id - Update account settings
// - DELETE /api/email-accounts/:id - Remove account
// - POST /api/email-accounts/:id/test - Test connection
// - POST /api/email-accounts/:id/pause - Pause warmup
// - POST /api/email-accounts/:id/resume - Resume warmup
```

**File:** `backend/src/routes/emailAccount.routes.ts`

```typescript
import { Router } from 'express';
import * as controller from '../controllers/emailAccount.controller';
import { authenticate } from '../middleware/auth';
import { connectionTestLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', authenticate, controller.list);
router.post('/', authenticate, controller.create);
router.get('/:id', authenticate, controller.getOne);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);
router.post('/:id/test', authenticate, connectionTestLimiter, controller.testConnection);
router.post('/:id/pause', authenticate, controller.pauseWarmup);
router.post('/:id/resume', authenticate, controller.resumeWarmup);

export default router;
```

---

### PRIORITY 4: Warmup Pool Logic

**File:** `backend/src/services/warmup/poolMatcher.ts`

```typescript
// Core warmup algorithm:
// 1. getActiveMailboxes() - Fetch all active, not at daily limit
// 2. selectSenderReceiverPairs() - Random pairing algorithm
// 3. avoidRecentPairs(sender, receiver) - Check interaction history
// 4. createConversation(sender, receiver) - Create new conversation
// 5. scheduleInitialEmail(conversation) - Queue first email
```

**File:** `backend/src/services/warmup/scheduler.ts`

```typescript
// Schedule warmup emails:
// 1. scheduleWarmupBatch() - Run hourly, schedule emails for active accounts
// 2. calculateReplyDelay() - Random delay between 2-8 hours
// 3. scheduleReply(email) - Queue reply job
// 4. checkDailyLimits(account) - Ensure not exceeding limits
// 5. resetDailyCounters() - Reset at midnight
```

**File:** `backend/src/services/warmup/replyGenerator.ts`

```typescript
// Generate natural replies:
// 1. selectReplyTemplate(originalTemplate) - Choose matching reply template
// 2. generateReplyContent(template, context) - Fill variables
// 3. addNaturalDelay() - Random 2-8 hour delay
// 4. determineConversationEnd(currentStep, maxSteps) - Check if conversation done
```

**File:** `backend/src/services/warmup/archiver.ts`

```typescript
// Auto-archive conversations:
// 1. archiveGmailThread(account, threadId) - Archive in Gmail
// 2. archiveOutlookThread(account, threadId) - Archive in Outlook
// 3. archiveIMAPThread(account, threadId) - Archive via IMAP
// 4. markConversationComplete(conversation) - Update database
```

---

### PRIORITY 5: Bull Queue Configuration & Workers

**File:** `backend/src/config/queue.ts`

```typescript
import Bull from 'bull';
import { bullRedisClient } from './redis';

export const sendWarmupEmailQueue = new Bull('send-warmup-email', {
  redis: bullRedisClient,
  prefix: 'heatmail',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

export const sendReplyQueue = new Bull('send-reply', { /* same config */ });
export const archiveThreadQueue = new Bull('archive-thread', { /* same config */ });
export const checkInboxQueue = new Bull('check-inbox', { /* same config */ });
export const updateHealthScoreQueue = new Bull('update-health-score', { /* same config */ });
```

**File:** `backend/src/workers/sendWarmupEmail.worker.ts`

```typescript
import { sendWarmupEmailQueue } from '../config/queue';
import { EmailAccount, WarmupEmail } from '../models';
import { sendWarmupEmail as sendViaSMTP } from '../services/email/smtp';
import { sendEmailViaGmail } from '../services/oauth/google';
import { sendEmailViaOutlook } from '../services/oauth/microsoft';

sendWarmupEmailQueue.process(async (job) => {
  const { emailId } = job.data;

  // 1. Fetch WarmupEmail record
  // 2. Get sender and receiver EmailAccounts
  // 3. Determine connection type (OAuth vs SMTP)
  // 4. Send email using appropriate method
  // 5. Update WarmupEmail status to 'sent'
  // 6. Update EmailAccount dailyEmailsSent counter
  // 7. Schedule reply job (if needed)
});
```

**File:** `backend/src/workers/checkInbox.worker.ts`

```typescript
import { checkInboxQueue } from '../config/queue';
import { pollInbox } from '../services/email/imap';
import { listGmailMessages } from '../services/oauth/google';

// Run every 15 minutes for each active email account
checkInboxQueue.process(async (job) => {
  const { emailAccountId } = job.data;

  // 1. Fetch EmailAccount
  // 2. Poll inbox (IMAP or OAuth)
  // 3. Find emails with X-Warmup-Email header
  // 4. Check if reply needed (not already replied)
  // 5. Schedule reply job
});
```

---

### PRIORITY 6: Health Scoring System

**File:** `backend/src/services/health/calculator.ts`

```typescript
// Health score formula:
export const calculateHealthScore = (metrics: {
  inboxRate: number;
  spamRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
}): number => {
  return (
    (metrics.inboxRate * 0.35) +
    (metrics.openRate * 0.25) +
    (metrics.replyRate * 0.20) +
    ((100 - metrics.spamRate) * 0.15) +
    ((100 - metrics.bounceRate) * 0.05)
  );
};

// Functions needed:
// - calculateInboxRate(account)
// - calculateSpamRate(account)
// - calculateOpenRate(account)
// - calculateReplyRate(account)
// - calculateBounceRate(account)
// - updateAccountHealthScore(account)
// - saveHealthHistory(account)
```

---

### PRIORITY 7: Admin & User Controllers

**File:** `backend/src/controllers/admin.controller.ts`

```typescript
// Admin endpoints:
// - GET /api/admin/dashboard - Platform stats
// - GET /api/admin/users - List all users
// - GET /api/admin/users/:id - User details
// - PUT /api/admin/users/:id - Update user (package, limits)
// - DELETE /api/admin/users/:id - Delete user
// - GET /api/admin/mailboxes - List all mailboxes
// - GET /api/admin/mailboxes/:id - Mailbox details
// - POST /api/admin/domains - Add domain (Domain-Wide Delegation)
// - GET /api/admin/domains/:id/accounts - Fetch accounts in domain
// - GET /api/admin/stats - Platform statistics
```

**File:** `backend/src/controllers/user.controller.ts`

```typescript
// User endpoints:
// - GET /api/user/dashboard - User dashboard data
// - GET /api/user/mailboxes - User's mailboxes with health scores
// - GET /api/user/mailboxes/:id/health-history - Historical health data
// - GET /api/user/activity - Recent activity
// - GET /api/user/stats - User statistics
```

---

### PRIORITY 8: Main Express Application

**File:** `backend/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/database';
import { redisClient } from './config/redis';
import authRoutes from './routes/auth.routes';
// Import other routes
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5052;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
// Mount other routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    }

    app.listen(PORT, () => {
      logger.info(`🔥 HeatMail backend running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

---

### PRIORITY 9: Database Seeds

**File:** `backend/src/seeds/admin.seed.ts`

```typescript
import { User } from '../models';

export const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@heatmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await User.findOne({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      maxMailboxes: 999,
      maxEmailsPerDay: 999
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  }
};
```

**File:** `backend/src/seeds/packages.seed.ts`

```typescript
import { Package } from '../models';

export const seedPackages = async () => {
  const packages = [
    {
      name: 'Free',
      description: 'Get started with email warmup',
      maxMailboxes: 1,
      maxEmailsPerDayPerMailbox: 20,
      features: { advancedAnalytics: false, apiAccess: false },
      displayOrder: 1
    },
    {
      name: 'Starter',
      description: 'Perfect for small teams',
      price: 29.00,
      billingCycle: 'monthly',
      maxMailboxes: 5,
      maxEmailsPerDayPerMailbox: 50,
      features: { advancedAnalytics: true, apiAccess: false },
      displayOrder: 2
    },
    {
      name: 'Pro',
      description: 'For growing businesses',
      price: 79.00,
      billingCycle: 'monthly',
      maxMailboxes: 20,
      maxEmailsPerDayPerMailbox: 100,
      features: { advancedAnalytics: true, apiAccess: true, prioritySupport: true },
      displayOrder: 3
    },
    {
      name: 'Enterprise',
      description: 'Unlimited warmup power',
      price: 199.00,
      billingCycle: 'monthly',
      maxMailboxes: 999,
      maxEmailsPerDayPerMailbox: 200,
      features: { advancedAnalytics: true, apiAccess: true, prioritySupport: true, whiteLabel: true, domainWideDelegation: true },
      displayOrder: 4
    }
  ];

  for (const pkg of packages) {
    await Package.findOrCreate({ where: { name: pkg.name }, defaults: pkg });
  }

  console.log('✅ Packages seeded');
};
```

**File:** `backend/src/seeds/templates.seed.ts`

```typescript
// Create 100+ email templates across categories
// Sales, Support, Invoice, Meeting, General
// See full template list in your original spec
```

---

## 🎨 FRONTEND DEVELOPMENT

Once backend is complete, build frontend with:

### Setup
```bash
cd frontend
npx create-react-app . --template typescript
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom axios recharts
```

### Key Components
1. **Authentication** - Login, Register, Protected Routes
2. **User Dashboard** - Mailbox list, health scores, add mailbox
3. **Admin Panel** - Users, Mailboxes, Templates, Campaigns
4. **Components** - HealthScoreCard, MailboxCard, Stats, Charts

---

## 📦 DEPLOYMENT CHECKLIST

Before deploying:
1. ✅ Complete all backend services
2. ✅ Test locally (npm run dev)
3. ✅ Build frontend (npm run build)
4. ✅ Setup .env with production values
5. ✅ Run migrations (npm run migrate)
6. ✅ Seed database (npm run seed)
7. ✅ Test all APIs with Postman/curl
8. ✅ Deploy to VPS (follow QUICK_START.md)
9. ✅ Setup OAuth credentials
10. ✅ Test with real email accounts

---

## 💡 DEVELOPMENT TIPS

1. **Test incrementally** - Don't wait to test everything at once
2. **Use Postman** - Test each API endpoint as you build it
3. **Check logs** - Use `pm2 logs` to debug issues
4. **Database first** - Run migrations before testing
5. **Environment variables** - Double-check all are set correctly

---

## 🚀 YOU'RE 35% DONE!

What's complete:
- ✅ All database models
- ✅ Authentication system
- ✅ Core utilities and middleware
- ✅ SMTP service basics

What's next:
- ⏳ Complete email services (IMAP, OAuth)
- ⏳ Build warmup logic
- ⏳ Create all API endpoints
- ⏳ Build frontend
- ⏳ Deploy and test

**Keep building! You got this! 🔥**
