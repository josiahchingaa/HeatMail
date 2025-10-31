# Redis Setup for HeatMail Background Workers

## What is Redis?

Redis is an in-memory data store used by HeatMail for **background job queues**. The workers handle automated tasks like:

- 📧 Sending warmup emails automatically
- 📬 Checking inboxes for replies
- 📊 Calculating health scores
- 🗄️ Archiving old email conversations
- 📅 Running scheduled campaigns
- 📈 Gradual email volume increases

## Do I Need Redis?

**No, not immediately!** The HeatMail API works perfectly without Redis:

✅ All REST API endpoints work
✅ User registration/login works
✅ Email account management works
✅ Template management works
✅ Admin dashboard works

❌ Automated background jobs won't run (manual email sending still works via API)

## Installing Redis on Windows

### Option 1: Memurai (Recommended for Windows)

Memurai is a Redis-compatible server optimized for Windows.

1. Download from: https://www.memurai.com/get-memurai
2. Install the free Developer Edition
3. Redis will run as a Windows service automatically

### Option 2: Official Redis (via WSL)

1. Install WSL2: `wsl --install`
2. Install Ubuntu from Microsoft Store
3. In Ubuntu terminal:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

### Option 3: Docker

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

## Verifying Redis is Running

Once Redis is installed, test the connection:

```bash
# Windows (if Redis is in PATH)
redis-cli ping
# Should return: PONG

# Or test from your app
curl http://localhost:5001/api/health
```

The HeatMail server logs will show:
- ✅ `Workers initialized successfully` - Redis is working
- ⚠️ `Workers disabled - Redis not available` - API works, but no background jobs

## Configuration

Redis connection settings are in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Testing Background Workers

After Redis is running, restart the HeatMail backend:

```bash
npm run dev
```

You should see worker initialization messages:
- Send warmup email worker initialized
- Send reply worker initialized
- Archive thread worker initialized
- Check inbox worker initialized
- Update health score worker initialized

## Troubleshooting

### "Queue error" messages
These appear when Redis is not running. They're harmless - the API still works.

### Workers not processing jobs
1. Check Redis is running: `redis-cli ping`
2. Check `.env` Redis configuration
3. Restart the backend server
4. Check backend logs for errors

### Port 6379 already in use
Another Redis instance is running. Either:
- Use the existing instance
- Change `REDIS_PORT` in `.env`
- Stop the conflicting service

## Manual Job Triggering (Without Redis)

If you don't want to install Redis, you can still use the API endpoints to:

- Send emails manually via POST `/api/mailboxes/:id/send`
- Check inbox manually via POST `/api/mailboxes/:id/check`
- View statistics via GET endpoints

Background automation requires Redis, but all core functionality works without it!
