# 🔧 SFE Mobile - Troubleshooting Guide

**Last Updated:** November 23, 2025

---

## 📋 Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
   - [Photo Upload Fails / Photos Not Showing](#issue-photo-upload-fails--photos-not-showing-in-call-report-detail)
3. [API Integration Issues](#api-integration-issues)
4. [Database Issues](#database-issues)
5. [Common Error Messages](#common-error-messages)
6. [Quick Fixes](#quick-fixes)

---

## 🔴 Backend Issues

### Issue: Backend Won't Start - Dist Folder Permission Error

**Error Message:**
```
Error EPERM: operation not permitted, scandir 'G:\orex-sfe\backend\dist'
```

**Root Cause:**
- Dist folder is locked by another process
- Or backend is already running from previous session

**Solution 1 - Check if already running:**
```bash
# Windows
netstat -ano | findstr ":3001"

# If you see output like:
# TCP 0.0.0.0:3001 ... LISTENING 25228
# Backend is already running with Process ID 25228
# No action needed!
```

**Solution 2 - Kill and restart:**
```bash
# Windows
taskkill /F /PID 25228  # Replace with actual PID
cd backend
npm run start:dev
```

**Solution 3 - Remove dist folder:**
```bash
cd backend
rmdir /s /q dist  # Windows
rm -rf dist       # Mac/Linux
npm run start:dev
```

---

### Issue: Backend API Returns 404

**Symptoms:**
- All API calls return 404
- Swagger docs not accessible at http://localhost:3001/api/docs

**Solution:**
```bash
# 1. Check if backend is running
netstat -ano | findstr ":3001"

# 2. If not running, start it
cd backend
npm run start:dev

# 3. Wait for "Nest application successfully started"

# 4. Test API
curl http://localhost:3001/api
```

**Expected Response:**
```json
{"message": "SFE API Server"}
```

---

### Issue: Database Connection Failed

**Error Message:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solution:**
```bash
# 1. Start Docker services
docker-compose up -d

# 2. Check PostgreSQL is running
docker ps

# Should see:
# sfe-postgres (port 5432)
# sfe-redis (port 6379)

# 3. If not running, restart Docker
docker-compose down
docker-compose up -d

# 4. Check database connection
cd backend
npm run prisma:generate
```

---

## 🔵 Frontend Issues

### Issue: Frontend Can't Connect to Backend

**Error Message:**
```
AxiosError: Network Error
or
Failed to fetch
```

**Root Cause:**
- Backend not running
- Wrong API URL configured

**Solution:**
```bash
# 1. Verify backend is running
netstat -ano | findstr ":3001"

# 2. Check API URL configuration
# File: frontend/src/lib/constants.ts
# Should be:
export const API_URL = 'http://localhost:3001';

# 3. Restart frontend
cd frontend
npm run dev
```

---

### Issue: "ไม่สามารถโหลดข้อมูลลูกค้าได้"

**Symptoms:**
- Pre-Call Plans create page shows error
- Customer dropdown empty
- Error in console

**Root Cause:**
- Using hardcoded wrong API URL
- Or wrong import

**Solution:**
```typescript
// ❌ WRONG - Don't do this:
import axios from 'axios';
await axios.get('http://localhost:3000/api/customers');

// ✅ CORRECT - Always use API service:
import { customersApi } from '@/services/api';
await customersApi.findAll();
```

**Files to Check:**
- `frontend/src/app/pre-call-plans/create/page.tsx`
- `frontend/src/app/call-reports/create/page.tsx`

---

### Issue: Notifications Not Loading

**Symptoms:**
- Bell icon shows number but panel is empty
- "ไม่มีการแจ้งเตือน" message when there should be notifications
- Console shows 404 errors for `/api/notifications/...`

**Root Cause:**
- NotificationCenter using hardcoded wrong URL

**Solution:**
```typescript
// File: frontend/src/components/NotificationCenter.tsx

// ❌ WRONG:
import axios from 'axios';
await axios.get('http://localhost:3000/api/notifications/...');

// ✅ CORRECT:
import { notificationsApi } from '@/services/api';
await notificationsApi.findByUser(userId, unreadOnly);
```

---

### Issue: Photo Upload Fails / Photos Not Showing in Call Report Detail

**Symptoms:**
- Photos upload but don't appear in Call Report Detail page
- Error 500 during photo upload
- Console shows "Cannot POST /api/api/call-reports/.../photos" (404 error)
- Photos saved in `frontend/public/uploads/` but not in database

**Root Cause:**
- **Duplicate `/api` in URL path** - The most common issue
- Frontend API route incorrectly constructs backend URL
- `NEXT_PUBLIC_API_URL` already includes `/api`, but code adds it again

**Example of the Problem:**
```typescript
// ❌ WRONG - Creates /api/api/ path:
const backendUrl = process.env.NEXT_PUBLIC_API_URL; // "http://localhost:3001/api"
const apiUrl = `${backendUrl}/api/call-reports/${id}/photos`;
// Results in: http://localhost:3001/api/api/call-reports/.../photos (404!)
```

**Solution:**

**Step 1: Fix the URL Construction**
```typescript
// File: frontend/src/app/api/upload-photo/route.ts

// ✅ CORRECT - Don't duplicate /api:
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const apiUrl = `${backendUrl}/call-reports/${callReportId}/photos`;
// Results in: http://localhost:3001/api/call-reports/.../photos ✓
```

**Step 2: Verify Environment Variable**
```bash
# Check frontend/.env.local
cat frontend/.env.local

# Should contain:
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# Note: Already includes /api at the end
```

**Step 3: Add Proper Error Handling**
```typescript
// ❌ BAD - Swallows errors:
try {
  const response = await fetch(apiUrl, ...);
  if (!response.ok) {
    console.error('Failed'); // User doesn't see the error!
  }
} catch (error) {
  console.error(error); // User doesn't know it failed!
}

// ✅ GOOD - Shows errors to user:
try {
  const response = await fetch(apiUrl, ...);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend API failed: ${response.status} - ${errorText}`);
  }
} catch (error) {
  console.error('Error:', error);
  throw error; // Let user see the error message
}
```

**Step 4: Restart Frontend**
```bash
# Kill old process
taskkill /F /PID <pid>

# Start fresh
cd frontend
npm run dev
```

**Step 5: Verify Photo Details Display**

Photos should show with complete metadata:
- 📷 Category (PRODUCT, CUSTOMER, POP_POSM, ACTIVITY, OTHER)
- 📅 Date and time
- 📍 GPS coordinates (if available)

If details don't show, check the render logic:

```typescript
// File: frontend/src/app/call-reports/[id]/page.tsx

// ✅ Handle both uppercase and lowercase:
{(photo.category?.toUpperCase() === 'CUSTOMER' ||
  photo.category?.toLowerCase() === 'customer') && '🏢 ลูกค้า'}

// ✅ Show timestamp:
{photo.timestamp && (
  <div>{format(new Date(photo.timestamp), 'dd/MM/yyyy HH:mm')}</div>
)}

// ✅ Show GPS if available:
{photo.lat && photo.lng && (
  <div>📍 {parseFloat(photo.lat).toFixed(4)}, {parseFloat(photo.lng).toFixed(4)}</div>
)}
```

**Testing the Fix:**

1. **Open Browser Console (F12)** to see error messages
2. **Go to Quick Photo page** and take a new photo
3. **Check Terminal logs** for upload success/failure
4. **Verify in Call Report Detail** that photo appears with metadata
5. **Test with different photo categories** (Customer, Product, etc.)

**Success Indicators:**
- ✅ Photo uploads without errors
- ✅ Photo appears in Call Report Detail
- ✅ Metadata shows correctly (category, date, GPS)
- ✅ No console errors
- ✅ No 404 or 500 errors in Network tab

**Common Mistakes to Avoid:**
1. Don't hardcode the backend URL - always use environment variable
2. Don't swallow errors - let them bubble up to user
3. Don't forget to restart frontend after code changes
4. Don't assume category is always uppercase or lowercase - handle both

**Debug Checklist:**
```bash
# 1. Check if photo file exists
ls frontend/public/uploads/

# 2. Test backend API directly
curl -X GET http://localhost:3001/api/call-reports/<id>/photos

# 3. Check database has photo records
# Use Prisma Studio: npm run prisma:studio (in backend folder)

# 4. Verify frontend can reach backend
curl http://localhost:3001/api
```

**Time Saved:**
This issue took ~2 hours to diagnose and fix. With this guide, it should take 5-10 minutes.

---

## 🟢 API Integration Issues

### Issue: Pre-Call Plan Not Appearing in Approvals

**Symptoms:**
- Create plan successfully
- But manager doesn't see it in Approvals page
- Plan status is DRAFT

**Root Cause:**
- Missing submit step after create

**Solution:**
```typescript
// ❌ WRONG - Only creates, doesn't submit:
const result = await preCallPlansApi.create(dto);
alert('สร้างแผนสำเร็จ!');
router.push('/pre-call-plans');

// ✅ CORRECT - Create AND submit:
const result = await preCallPlansApi.create(dto);
await preCallPlansApi.submit(result.id, user.id);  // Auto-submit!
alert('สร้างและส่งแผนขออนุมัติสำเร็จ!');
router.push('/pre-call-plans');
```

---

### Issue: Activities Showing Duplicates

**Symptoms:**
- Same activity appears multiple times
- Activity list looks messy

**Root Cause:**
- Database has duplicate entries
- Frontend not filtering

**Solution:**
```typescript
// Add filter before mapping:
activityTypes
  .filter((activity, index, self) =>
    index === self.findIndex((a) => a.nameTh === activity.nameTh)
  )
  .map((activity) => {
    // Render activity
  })
```

**Files to Apply:**
- `frontend/src/app/call-reports/create/page.tsx`
- `frontend/src/app/pre-call-plans/create/page.tsx`

---

### Issue: 401 Unauthorized Error

**Symptoms:**
- API calls return 401
- Redirected to login page
- "Access token expired" message

**Root Cause:**
- Token expired
- Token not being sent

**Solution 1 - Login again:**
```bash
# Simply login again to get new token
# Frontend will auto-redirect
```

**Solution 2 - Check token in localStorage:**
```javascript
// In browser console:
localStorage.getItem('sfe_access_token')

// Should return a JWT token
// If null, token was removed - need to login
```

**Solution 3 - Check API interceptor:**
```typescript
// File: frontend/src/services/api.ts
// Should have interceptor that adds token:

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sfe_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🟡 Database Issues

### Issue: Prisma Migration Failed

**Error Message:**
```
Error: Migration failed to apply cleanly
```

**Solution:**
```bash
cd backend

# Option 1: Reset database (⚠️ Loses all data)
npm run prisma:reset

# Option 2: Push schema without migration
npx prisma db push

# Option 3: Regenerate client
npm run prisma:generate

# Then seed demo data
npm run prisma:seed
```

---

### Issue: No Demo Data

**Symptoms:**
- Login doesn't work
- No customers/users in database

**Solution:**
```bash
cd backend

# Run seed script
npm run prisma:seed

# Verify seed completed
# Should see:
# ✅ Users created (4)
# ✅ Customers created (15)
# ✅ Activity types created (13)
```

---

## ⚠️ Common Error Messages

### "Cannot find module '@/services/api'"

**Solution:**
```typescript
// Check tsconfig.json has path mapping:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Restart TypeScript server in VS Code:
// Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### "Module not found: Can't resolve 'axios'"

**Solution:**
```bash
cd frontend
npm install axios

# Or if package-lock.json is corrupted:
rm package-lock.json
rm -rf node_modules
npm install
```

---

### "Hydration failed because the initial UI does not match"

**Solution:**
```typescript
// Use 'use client' directive at top of component
'use client';

// Or check for client-side only code:
if (typeof window !== 'undefined') {
  // Client-side code here
}
```

---

## ⚡ Quick Fixes

### Quick Fix 1: Restart Everything

```bash
# Terminal 1: Backend
cd backend
taskkill /F /PID <backend-pid>  # Find PID with netstat
npm run start:dev

# Terminal 2: Frontend
cd frontend
# Ctrl+C to stop
npm run dev

# Terminal 3: Database
docker-compose down
docker-compose up -d
```

---

### Quick Fix 2: Clear Browser Cache

```bash
# Chrome/Edge
Ctrl+Shift+Delete
# Select "Cached images and files"
# Click "Clear data"

# Or open in Incognito/Private window
Ctrl+Shift+N
```

---

### Quick Fix 3: Regenerate Everything

```bash
# Backend
cd backend
rm -rf dist node_modules
npm install
npm run build

# Frontend
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

---

## 🔍 Diagnostic Commands

### Check All Services Status

```bash
# Backend (should show port 3001)
netstat -ano | findstr ":3001"

# Frontend (should show port 3000)
netstat -ano | findstr ":3000"

# PostgreSQL (should show port 5432)
netstat -ano | findstr ":5432"

# Redis (should show port 6379)
netstat -ano | findstr ":6379"
```

---

### Test API Endpoints

```bash
# Test backend health
curl http://localhost:3001/api

# Test auth
curl -X POST http://localhost:3001/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"username":"sales1"}'

# Test customers (with token)
curl http://localhost:3001/customers \
  -H "Authorization: Bearer <your-token>"
```

---

### View Logs

```bash
# Backend logs
cd backend
npm run start:dev
# Watch console output

# Frontend logs
cd frontend
npm run dev
# Watch console output

# Docker logs
docker logs sfe-postgres
docker logs sfe-redis
```

---

## 📝 Best Practices to Avoid Issues

### ✅ DO:
1. Always use API services from `@/services/api`
2. Import types from `@/types`
3. Use `'use client'` for client-side components
4. Check backend is running before testing frontend
5. Keep both terminals open (backend + frontend)
6. Use TypeScript strict mode
7. Handle errors with try-catch
8. Add loading states

### ❌ DON'T:
1. Hardcode API URLs (use constants)
2. Use axios directly (use API services)
3. Duplicate interface definitions
4. Commit with TypeScript errors
5. Skip error handling
6. Leave console.log in production
7. Store sensitive data in frontend
8. Mix dev and prod environment variables

---

## 🆘 When All Else Fails

1. **Check this guide first** ✅
2. **Read PROGRESS.md** for recent changes ✅
3. **Check console logs** (both browser and terminal) ✅
4. **Restart everything** (backend, frontend, Docker) ✅
5. **Clear all caches** (browser, npm, Docker) ✅
6. **Verify ports** (3000, 3001, 5432, 6379) ✅
7. **Check git status** - any uncommitted changes? ✅
8. **Ask for help** with specific error message ✅

---

**Remember:** 90% of issues are solved by restarting services! 🔄
