# Vercel Deployment Guide for Backend

## Important: Environment Variables Setup

Backend ko Vercel par deploy karne ke liye yeh environment variables set karni hongi:

### Vercel Dashboard me Environment Variables kaise set karein:

1. Vercel Dashboard me jao
2. Apne backend project ko select karo
3. Settings > Environment Variables me jao
4. Yeh variables add karo:

```
SUPABASE_URL=https://kidbzkigwgnepkspokrg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZGJ6a2lnd2duZXBrc3Bva3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzk0NjEsImV4cCI6MjA3Nzc1NTQ2MX0.C-uOIIJpF27hGnkNN9gYZwbLza4yoS4Fx1ksZQ8UuAo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZGJ6a2lnd2duZXBrc3Bva3JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE3OTQ2MSwiZXhwIjoyMDc3NzU1NDYxfQ.ppVAnPnPnkHXmz5loFY9-P4CWRX1KFzPLO5jX6TlW1s
SUPABASE_BUCKET=images
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://*.vercel.app
NODE_ENV=production
```

**Important Notes:**
- `CORS_ORIGINS` me apne frontend ka production URL add karo (comma-separated)
- Agar multiple environments hai (Production, Preview, Development), to har ek ke liye alag se set karo
- `SUPABASE_URL` aur keys ko apne actual Supabase credentials se replace karo

### Deployment Steps:

1. GitHub repository me code push karo
2. Vercel me project import karo (if not already done)
3. **Root Directory**: `scholarship-blogs-web-app-backend` set karo
4. **Framework Preset**: Other (or leave blank)
5. **Build Command**: `npm run build` (optional, Vercel auto-detects)
6. **Output Directory**: (leave empty for API)
7. Environment variables set karo (as shown above)
8. Deploy karo!

### Testing:

Deploy ke baad, backend API URL hoga: `https://your-backend-name.vercel.app/api/health`

Is URL ko test karo browser me ya Postman me.

### Frontend Configuration:

Frontend me `NEXT_PUBLIC_API_URL` environment variable ko backend ke production URL se set karo:
```
NEXT_PUBLIC_API_URL=https://your-backend-name.vercel.app/api
```

