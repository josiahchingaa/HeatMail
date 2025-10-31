# 🔥 HEATMAIL - Email Warmup Platform

## Project Overview

HEATMAIL is a production-ready email warmup platform that allows users to connect their email accounts and participate in a unified warmup pool where emails automatically send to each other, reply, and archive conversations to improve deliverability.

## Features

### Core Functionality
- **4 Connection Methods**: OAuth (Gmail/Outlook), Domain-Wide Delegation, SMTP/IMAP, App Passwords
- **Unified Warmup Pool**: All connected emails interact with each other
- **Auto-Reply System**: Intelligent conversation threads (2-4 exchanges)
- **Auto-Archive**: Automatic archiving using header tags
- **Health Scoring**: Mailbox health metrics (spam rate, inbox rate, opens, replies, bounces)
- **Gradual Volume Increase**: Safe warmup with automatic volume ramping
- **100+ Email Templates**: Varied content across multiple categories
- **Admin Campaigns**: Send campaigns to pool using Elastic Email

### User Roles
- **Admin**: Full platform management
- **User**: Manage own email accounts

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (Sequelize ORM)
- Redis + Bull Queue (async processing)
- JWT Authentication
- Google/Microsoft OAuth 2.0

### Frontend
- React + TypeScript
- Material-UI
- React Router
- Axios

### Infrastructure
- VPS: 147.93.123.174 (Hostinger)
- PM2 Process Manager
- Nginx Reverse Proxy
- Subdomain: heatmail.senditnow.cc

## Project Structure

```
/var/www/heatmail/
├── backend/                    # Node.js API (Port 5052)
│   ├── src/
│   │   ├── config/            # Database, Redis, OAuth configs
│   │   ├── models/            # Sequelize models
│   │   ├── controllers/       # API endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── auth/          # Authentication
│   │   │   ├── oauth/         # Gmail/Outlook OAuth
│   │   │   ├── email/         # Email sending/receiving
│   │   │   ├── warmup/        # Pool matching algorithm
│   │   │   └── health/        # Health scoring
│   │   ├── workers/           # Bull queue workers
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helpers
│   │   └── middleware/        # Express middleware
│   └── package.json
├── frontend/                   # React app (Port 3001)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/          # Login/Register
│   │   │   ├── admin/         # Admin panel
│   │   │   └── user/          # User dashboard
│   │   ├── components/        # UI components
│   │   └── services/          # API calls
│   └── package.json
├── ecosystem.config.js         # PM2 config
├── nginx.conf                  # Nginx config
└── .env                        # Environment variables
```

## Database Schema

### Core Tables
1. **Users** - Customer accounts with personal info and subscription details
2. **EmailAccounts** - Connected mailboxes with OAuth/SMTP credentials
3. **Packages** - Pricing tiers (to be determined)
4. **WarmupEmails** - All emails sent in the pool
5. **WarmupTemplates** - 100+ email content templates
6. **WarmupConversations** - Email thread tracking
7. **AdminCampaigns** - Admin campaigns sent via Elastic Email
8. **HealthScoreHistory** - Historical health metrics
9. **AuditLogs** - Activity tracking

## Installation & Setup

### Local Development

1. **Clone and Install Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

2. **Install Frontend:**
```bash
cd frontend
npm install
npm start
```

3. **Setup Database:**
```bash
# Connect to PostgreSQL
psql -U admin -h localhost

# Create database
CREATE DATABASE heatmail;
GRANT ALL PRIVILEGES ON DATABASE heatmail TO admin;

# Run migrations
cd backend
npm run migrate
npm run seed
```

### VPS Deployment

1. **Connect to VPS:**
```bash
ssh -i C:\Users\Admin\.ssh\id_ed25519 root@147.93.123.174
```

2. **Create Project Directory:**
```bash
cd /var/www
git clone <repository-url> heatmail
cd heatmail
```

3. **Install Dependencies:**
```bash
cd backend && npm install --production
cd ../frontend && npm install && npm run build
```

4. **Setup Environment:**
```bash
cd /var/www/heatmail
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values
```

5. **Setup Database:**
```bash
sudo -u postgres psql
CREATE DATABASE heatmail;
GRANT ALL PRIVILEGES ON DATABASE heatmail TO admin;
\q

cd /var/www/heatmail/backend
npm run migrate
npm run seed
```

6. **Configure PM2:**
```bash
cd /var/www/heatmail
pm2 start ecosystem.config.js
pm2 save
```

7. **Configure Nginx:**
```bash
cp nginx.conf /etc/nginx/sites-available/heatmail
ln -s /etc/nginx/sites-available/heatmail /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Environment Variables

See `backend/.env.example` for all required environment variables.

### Critical Variables:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database credentials
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_SECRET` - JWT token secret
- `ENCRYPTION_KEY` - For encrypting OAuth tokens and passwords
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth
- `ELASTIC_EMAIL_API_KEY` - For admin campaigns

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Email Accounts
- `GET /api/email-accounts` - List user's email accounts
- `POST /api/email-accounts` - Add new email account
- `PUT /api/email-accounts/:id` - Update account settings
- `DELETE /api/email-accounts/:id` - Remove account
- `POST /api/email-accounts/:id/test` - Test connection

### OAuth
- `GET /api/oauth/google` - Initiate Google OAuth
- `GET /api/oauth/google/callback` - Google OAuth callback
- `GET /api/oauth/microsoft` - Initiate Microsoft OAuth
- `GET /api/oauth/microsoft/callback` - Microsoft OAuth callback

### Admin Panel
- `GET /api/admin/users` - List all users
- `GET /api/admin/mailboxes` - List all mailboxes
- `GET /api/admin/templates` - List templates
- `POST /api/admin/templates` - Create template
- `GET /api/admin/campaigns` - List campaigns
- `POST /api/admin/campaigns` - Create campaign
- `GET /api/admin/stats` - Platform statistics

### User Dashboard
- `GET /api/user/dashboard` - User dashboard data
- `GET /api/user/mailboxes` - User's mailboxes with health scores
- `GET /api/user/activity` - Recent activity

## Warmup Pool Logic

### How It Works
1. **Pool Formation**: All connected emails join one unified pool
2. **Sender Selection**: Random pairing algorithm (avoid patterns)
3. **Email Sending**: System sends emails between pool members
4. **Auto-Reply**: Recipients auto-reply after 2-8 hours delay
5. **Conversation Depth**: 2-4 exchanges per thread (randomized)
6. **Auto-Archive**: Threads archived using `X-Warmup-Email: true` header
7. **Health Tracking**: Monitor spam rate, inbox rate, opens, replies

### Sender Selection Algorithm
```
1. Get all active mailboxes from pool
2. Filter out mailboxes that hit daily limit
3. For each sender:
   - Find potential recipients (exclude self, recent interactions)
   - Select random recipient
   - Check conversation history (avoid repeating pairs)
   - Create email job in queue
4. Schedule reply jobs for received emails
```

### Health Score Calculation
```javascript
healthScore = (
  (inboxRate * 0.35) +        // 35% weight
  (openRate * 0.25) +          // 25% weight
  (replyRate * 0.20) +         // 20% weight
  ((100 - spamRate) * 0.15) +  // 15% weight
  ((100 - bounceRate) * 0.05)  // 5% weight
)
```

### Gradual Volume Increase Schedule
| Week | Emails/Day | Strategy |
|------|------------|----------|
| 1    | 5-10       | Conservative start |
| 2    | 15-25      | Increase if no spam issues |
| 3    | 30-50      | Continue if health score is good |
| 4    | 60-80      | Approaching target |
| 5+   | 100        | Target volume reached |

## Bull Queue Jobs

### Job Types
1. **send-warmup-email** - Send email to pool member
2. **send-reply** - Send auto-reply to warmup email
3. **archive-thread** - Archive completed conversation
4. **check-inbox** - Poll IMAP for new emails
5. **update-health-score** - Calculate mailbox health
6. **send-admin-campaign** - Send admin campaign email
7. **gradual-increase-adjuster** - Adjust volume based on schedule

### Queue Configuration
```javascript
{
  prefix: 'heatmail:',
  limiter: {
    max: 100,      // Max 100 jobs per interval
    duration: 60000 // 1 minute
  },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
}
```

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project "HeatMail"
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://heatmail.senditnow.cc/api/oauth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register new application "HeatMail"
3. Add redirect URI: `https://heatmail.senditnow.cc/api/oauth/microsoft/callback`
4. Add Microsoft Graph permissions: `Mail.Send`, `Mail.ReadWrite`
5. Copy Application (client) ID and Client Secret to `.env`

### Domain-Wide Delegation (Google Workspace)
1. Create service account in Google Cloud Console
2. Enable Domain-Wide Delegation
3. Download JSON key file
4. In Google Workspace Admin Console:
   - Security > API Controls > Domain-Wide Delegation
   - Add service account client ID
   - Authorize scopes: `https://mail.google.com/`
5. Upload JSON key in HeatMail admin panel

## Monitoring & Logs

### PM2 Monitoring
```bash
pm2 status                  # Check process status
pm2 logs heatmail-backend   # View backend logs
pm2 logs heatmail-worker    # View queue worker logs
pm2 monit                   # Real-time monitoring
```

### PostgreSQL Monitoring
```bash
sudo -u postgres psql heatmail
SELECT COUNT(*) FROM "Users";
SELECT COUNT(*) FROM "EmailAccounts" WHERE status='active';
SELECT COUNT(*) FROM "WarmupEmails" WHERE status='sent' AND "sentAt" > NOW() - INTERVAL '24 hours';
```

### Redis Monitoring
```bash
redis-cli
INFO stats
KEYS heatmail:*
```

## Security Considerations

1. **Encryption**: All OAuth tokens and SMTP passwords encrypted with AES-256
2. **Rate Limiting**: API endpoints protected against abuse
3. **JWT Authentication**: Secure token-based auth with expiry
4. **Input Validation**: All inputs validated and sanitized
5. **CORS**: Restricted to frontend domain only
6. **HTTPS**: SSL/TLS encryption (Let's Encrypt)

## Future Enhancements (Post Phase 1)

- [ ] Pricing packages and Stripe integration
- [ ] Landing page with marketing content
- [ ] Advanced analytics dashboard
- [ ] Custom domain support
- [ ] API access for developers
- [ ] White-label solution
- [ ] Mobile app (React Native)
- [ ] Integration with SendItNow platform
- [ ] AI-powered template generation
- [ ] Multi-language support

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check PostgreSQL service
systemctl status postgresql
# Restart if needed
systemctl restart postgresql
```

**Redis Connection Failed:**
```bash
# Check Redis service
systemctl status redis-server
# Restart if needed
systemctl restart redis-server
```

**OAuth Redirect Not Working:**
- Check redirect URIs in Google/Microsoft console
- Verify FRONTEND_URL in .env matches actual domain
- Check Nginx configuration for proxy_pass

**Emails Not Sending:**
- Check Bull queue status: `pm2 logs heatmail-worker`
- Verify OAuth tokens haven't expired
- Test email account connection manually
- Check Redis connection

**Health Score Not Updating:**
- Verify cron job running: `pm2 logs heatmail-worker`
- Check email account has sufficient send history
- Verify IMAP polling is working

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Check database: `psql -U admin heatmail`
3. Check Redis: `redis-cli`
4. Review Nginx logs: `/var/log/nginx/error.log`

## License

Proprietary - All rights reserved

---

**Version:** 1.0.0
**Last Updated:** October 30, 2024
**Author:** HeatMail Team
