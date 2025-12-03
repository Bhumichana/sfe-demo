# SFE (Sales Force Effectiveness) - Implementation Plan

## 🎯 Project Overview
Sales Force Effectiveness (SFE) - ระบบบริหารจัดการพนักงานขาย พร้อมระบบอนุมัติและรายงานแบบ Real-time

## ⚠️ IMPORTANT: Architecture Clarification

**นี่คือ Web Application แบบ Mobile-First Design ไม่ใช่ Native Mobile App**

โครงสร้างโปรเจกต์:
- **Frontend (Web)**: Next.js 16 + React + TypeScript - รองรับทั้ง Desktop และ Mobile Browser
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Design**: Mobile-First Responsive Design (ออกแบบให้ใช้งานบนมือถือผ่าน Web Browser ได้ดี)

**หมายเหตุ**: แม้จะมีโฟลเดอร์ `mobile/` ในโปรเจกต์ แต่นั่นเป็นส่วนทดลองเท่านั้น **ระบบหลักที่ใช้งานจริงคือ Web Application** ที่อยู่ในโฟลเดอร์ `frontend/`

## 📱 Tech Stack (Current Implementation)

### Frontend (Web - Mobile-First)
- **Next.js 16** (React Framework with App Router)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Utility-first CSS)
- **shadcn/ui** (UI Components)
- **React Hook Form** + **Zod** (Form validation)
- **TanStack Query** (Data fetching & caching)
- **Zustand** (State management)
- **date-fns** (Date manipulation)
- **Axios** (HTTP client)

### ~~Mobile App (Not in Use)~~
~~แม้มีโฟลเดอร์ mobile/ แต่ไม่ได้ใช้งานจริง - โปรเจกต์นี้เป็น Web Application เท่านั้น~~

### Backend
- **Node.js** + **Express** หรือ **NestJS**
- **PostgreSQL** (Main database)
- **Redis** (Caching & sessions)
- **Prisma** หรือ **TypeORM** (ORM)
- **Passport.js** + **passport-google-oauth20** (Google SSO)
- **Socket.io** (Real-time notifications)
- **Bull** (Job queue สำหรับ notifications, reports)
- **Sharp** (Image processing & compression)
- **PDFKit** หรือ **Puppeteer** (PDF export)
- **csv-writer** (CSV export)

### Infrastructure
- **AWS S3** หรือ **Cloudinary** (Photo storage)
- **Firebase Cloud Messaging** (Push notifications)
- **Docker** (Containerization)
- **PM2** หรือ **Kubernetes** (Process management)

## 📊 Database Schema

### Core Tables

```sql
-- Users & Authentication
users
  - id (uuid)
  - username
  - email
  - password_hash
  - full_name
  - phone
  - role (enum: SR, SUP, SM, PM, MM)
  - manager_id (self-reference)
  - company_id
  - territory_id
  - is_active
  - last_login
  - google_id (for SSO)
  - created_at
  - updated_at

companies
  - id
  - name
  - logo_url
  - settings (jsonb)
  - storage_used_mb (for 100GB limit tracking)
  - storage_limit_mb (default 100000)
  - created_at

territories
  - id
  - code (BKK1, BKK2, CT1, etc.)
  - name_th
  - name_en
  - description
  - provinces (jsonb array)
  - is_active
  - created_at

-- Customers & Contacts
customers (Places)
  - id
  - code
  - name
  - type (enum: A, B, C)
  - monthly_revenue (decimal)
  - address
  - lat
  - lng
  - district
  - province
  - postal_code
  - phone
  - territory_id
  - required_visits_per_month (based on type: A=8-16, B=4-8, C=1-2)
  - response_time_hours (based on type: A=2, B=4, C=24)
  - is_active
  - created_by
  - created_at
  - updated_at

contacts (Persons)
  - id
  - customer_id
  - name
  - position
  - phone
  - email
  - line_id
  - is_primary
  - created_at

-- Pre-Call Planning
pre_call_plans
  - id
  - sr_id (user_id)
  - customer_id
  - contact_id
  - plan_date
  - objectives (text)
  - planned_activities (jsonb array)
  - status (enum: draft, pending, approved, rejected)
  - approved_by
  - approved_at
  - rejection_reason
  - comments (jsonb array)
  - created_at
  - updated_at

-- Call Reports
call_reports
  - id
  - pre_call_plan_id (nullable)
  - sr_id
  - customer_id
  - contact_id
  - call_date
  - check_in_time
  - check_in_lat
  - check_in_lng
  - check_out_time
  - check_out_lat
  - check_out_lng
  - activity_type (enum: virtual, face_to_face)
  - activities_done (jsonb array)
  - customer_response (text)
  - customer_request (text)
  - customer_objections (text)
  - customer_needs (text)
  - customer_complaints (text)
  - next_action (text)
  - status (enum: draft, submitted)
  - is_planned (boolean)
  - duration_minutes
  - photos (jsonb array)
  - created_at
  - updated_at

-- Photos
photos
  - id
  - call_report_id
  - category (enum: product, pop_posm, customer, activity, other)
  - url
  - thumbnail_url
  - lat
  - lng
  - timestamp
  - metadata (jsonb) -- camera info, filters, etc
  - created_at

-- Activities Master Data
activity_types
  - id
  - code
  - name_th
  - name_en
  - category
  - requires_photo
  - is_active
  - sort_order

-- Manager Coaching
coaching_records
  - id
  - call_report_id
  - manager_id
  - comments
  - rating (1-5)
  - coaching_points (jsonb)
  - created_at

-- Calendar & Planning
calendar_events
  - id
  - user_id
  - title
  - event_type (enum: pre_call_plan, meeting, training, leave)
  - reference_id (pre_call_plan_id or other)
  - start_date
  - end_date
  - all_day
  - location
  - notes
  - created_at

-- Notifications
notifications
  - id
  - user_id
  - type (enum: plan_approved, plan_rejected, plan_pending, reminder, etc)
  - title
  - message
  - reference_type
  - reference_id
  - is_read
  - created_at

-- Notification Preferences (NEW - Added 2025-12-03)
notification_preferences
  - id
  - user_id (unique)
  - plan_approved (boolean, default: true)
  - plan_rejected (boolean, default: true)
  - plan_pending (boolean, default: true)
  - reminder (boolean, default: true)
  - coaching (boolean, default: true)
  - system (boolean, default: true)
  - email_notifications (boolean, default: false)
  - push_notifications (boolean, default: true)
  - sound_enabled (boolean, default: true)
  - vibration_enabled (boolean, default: true)
  - created_at
  - updated_at
```

## 🏗️ Project Structure

```
orex-sfe/
├── frontend/                 # 🌐 Web Application (PRIMARY - Next.js 16)
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (auth)/     # Auth pages
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx
│   │   │   │   └── sr/      # Sales Rep Dashboard
│   │   │   ├── manager/     # Manager Dashboard & Features
│   │   │   │   ├── dashboard/
│   │   │   │   └── approval/
│   │   │   └── settings/    # Settings Pages
│   │   │       ├── page.tsx               # Main Settings
│   │   │       ├── notifications/         # 🆕 Notification Preferences
│   │   │       ├── users/
│   │   │       ├── teams/
│   │   │       ├── territories/
│   │   │       ├── activities/
│   │   │       ├── profile/
│   │   │       └── company/
│   │   ├── components/      # Reusable React components
│   │   │   ├── layouts/     # Layout components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   └── features/    # Feature-specific components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── lib/             # Utilities & helpers
│   │   └── types/           # TypeScript types
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
├── mobile/                   # ⚠️ EXPERIMENTAL ONLY - NOT IN USE
│   └── (Legacy React Native code - not actively used)
│
├── backend/                  # 🔧 NestJS Backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── customers/
│   │   │   ├── pre-call-plans/
│   │   │   ├── call-reports/
│   │   │   ├── photos/
│   │   │   ├── calendar/
│   │   │   ├── analytics/
│   │   │   └── notifications/
│   │   ├── common/
│   │   │   ├── middleware/
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   └── filters/
│   │   ├── config/
│   │   └── database/
│   ├── prisma/              # Prisma schema
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                    # Admin Web Dashboard (Optional)
│   └── Next.js or React
│
└── shared/                   # Shared types, constants
    └── types/
```

## 🎨 Features Breakdown

### Phase 1: Core Foundation (Week 1-2)

#### 1.1 Authentication & Authorization
- [ ] Login screen (ตามรูปที่ 1)
  - Username/Email input
  - Password input
  - Remember me checkbox
  - Role selection (SR/Manager)
  - Single Sign-On option
  - Demo mode
- [ ] Multi-role support (SR, Sup, SM, PM, MM)
- [ ] JWT token authentication
- [ ] Role-based access control (RBAC)
- [ ] Password reset flow

#### 1.2 User Management
- [ ] User CRUD (Admin)
- [ ] User profile
- [ ] Company settings
- [ ] Role management

### Phase 2: Sales Rep Features (Week 3-4)

#### 2.1 SR Dashboard (ตามรูปที่ 2)
- [ ] Header: Name, Role, Logout button
- [ ] Stats Cards:
  - Calls วันนี้ (Today's calls)
  - ABC Coverage %
  - Calls เดือนนี้ (Month's calls)
  - รอ Approve (Pending approvals)
- [ ] Quick Actions Section:
  - Check-in Now (with GPS)
  - Quick Photo
- [ ] งานประจำวัน Section:
  - Pre-Call Plan button
  - Full Report button
  - ดูเม็นิว (View menu)
  - My Reports
- [ ] Recent Calls List with status badges

#### 2.2 Pre-Call Planning
- [ ] สร้าง Pre-Call Plan
  - เลือก Customer (Place)
  - เลือก Contact (Person)
  - เลือก Date
  - ระบุ Objectives
  - เลือก Planned Activities (multi-select)
  - บันทึก Draft / Submit
- [ ] แสดงรายการ Pre-Call Plans
  - Filter: Draft, Pending, Approved, Rejected
  - Sort by date
  - Search
- [ ] แก้ไข/ลบ Draft plans
- [ ] ดู Approval status & comments
- [ ] Deadline reminder (ภายใน 28)

#### 2.3 Check-in & GPS Verification
- [ ] Check-in from today's plan
- [ ] GPS capture & verification
  - ตรวจสอบระยะห่างจาก Customer location
  - Alert ถ้าห่างเกินกำหนด
- [ ] Auto-create Call Report from check-in
- [ ] Check-out with GPS

#### 2.4 Quick Photo
- [ ] Camera integration
- [ ] Photo categories:
  - Product
  - POP/POSM
  - Customer
  - Activity
  - Other
- [ ] Auto-timestamp & GPS stamp
- [ ] Photo preview & delete
- [ ] Upload to Call Report

#### 2.5 Call Report
- [ ] Auto-fill from Pre-Call Plan
- [ ] Form fields:
  - Customer, Contact, Date (auto-filled)
  - Activity type (virtual/face-to-face)
  - Activities done (checklist)
  - Customer response
  - Customer request
  - Customer objections
  - Customer needs
  - Customer complaints
  - Next action
  - Photos
- [ ] Save as Draft
- [ ] Submit (ภายใน 2 วันก่อนเที่ยงคืน)
- [ ] View submitted reports
- [ ] Edit Draft reports

#### 2.6 Calendar View
- [ ] Month view
- [ ] List view
- [ ] Show Pre-Call Plans
- [ ] Show Call Reports
- [ ] Color coding by status
- [ ] Add/Edit events

### Phase 3: Manager Features (Week 5)

#### 3.1 Supervisor/Sales Manager
- [ ] Pre-Call Plan Approval (ภายใน 29)
  - View plan details
  - Approve button
  - Reject with reason
  - Add comments
  - Notification to SR
- [ ] Call Report Review
  - Daily/Weekly/Monthly views
  - Filter by SR, Customer, Date
  - Read reports
  - Add coaching comments
  - Rating system (optional)
- [ ] Team Dashboard
  - Team member list
  - Individual performance
  - Pending approvals count

#### 3.2 Product/Marketing Manager
- [ ] Analytics Dashboard:
  - **Call Metrics:**
    - Total calls/month
    - Average calls/day
    - Calls by type (Planned/Unplanned/Missed/Virtual)
  - **Coverage:**
    - ABC coverage %
    - Coverage by territory
  - **Activities:**
    - Activity breakdown (pie chart)
    - Time allocation to ABC customers
  - **Customer Insights:**
    - Top objections
    - Top needs
    - Top complaints
    - Customer requests summary
  - **Team Performance:**
    - SR ranking
    - Team trends
- [ ] Report export (PDF/Excel)
- [ ] Date range filter
- [ ] Drill-down capabilities

### Phase 4: Advanced Features (Week 6-7)

#### 4.1 Activities Master Data
Pre-configured activities:
- Detail product
- วาง POP/POSM
- เสนอสินค้าเข้า
- Present product
- Sampling
- Handle customer problems
- รับ sales order
- เช็ค stock
- ติดตาม product spec
- วางบิล/ตามบิล/เก็บเงิน
- Business meal
- ออก booth
- ประมาณงบการ engage

#### 4.2 Notifications
- [ ] Push notifications
  - Plan approved/rejected
  - Approaching deadline
  - Manager comments
  - Daily reminders
- [ ] In-app notification center
- [ ] Notification settings

#### 4.3 Offline Support (Hybrid Mode)
- [ ] Local storage implementation
  - AsyncStorage for small data (preferences, tokens)
  - SQLite/WatermelonDB for structured data (customers, plans, reports)
  - File system for photos
- [ ] Cache master data (auto-refresh when online)
  - Customers & Contacts
  - Territories
  - Activity types
  - User's approved Pre-Call Plans
  - User's submitted Call Reports
- [ ] Draft management
  - Save Pre-Call Plan drafts offline
  - Save Call Report drafts offline
  - Store photos locally with drafts
  - Show draft count badge
- [ ] Sync when online
  - Auto-detect online/offline status
  - Background sync queue
  - Retry failed uploads
  - Progress indicator
- [ ] Conflict resolution (Server wins - last-write-wins strategy)
- [ ] Offline indicator in UI
  - Status bar showing "Offline" or "Online"
  - Disable Submit buttons when offline
  - Show cached data timestamp

#### 4.4 Settings
- [ ] Company profile
- [ ] User list management
- [ ] Role configuration
- [ ] Activity types management
- [ ] Customer type settings (ABC criteria)
- [ ] Notification preferences
- [ ] Language (Thai/English)

### Phase 5: Polish & Launch (Week 8)

#### 5.1 UI/UX Refinement
- [ ] Follow design from screenshots
- [ ] Thai language support
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Animations & transitions

#### 5.2 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit

#### 5.3 Deployment
- [ ] Backend deployment
- [ ] Database setup
- [ ] Photo storage setup
- [ ] Push notification setup
- [ ] App store submission (iOS)
- [ ] Play store submission (Android)

## 🔐 Security Considerations

1. **Authentication:**
   - JWT with refresh tokens
   - Password hashing (bcrypt)
   - Session management
   - Device tracking

2. **Authorization:**
   - Role-based access control
   - Resource-level permissions
   - API endpoint guards

3. **Data Protection:**
   - HTTPS only
   - Input validation
   - SQL injection prevention (use ORM)
   - XSS prevention
   - Rate limiting

4. **Privacy:**
   - GPS data encryption
   - Photo access permissions
   - Data retention policy
   - PDPA compliance

## 📈 Performance Optimization

1. **Mobile App:**
   - Image compression before upload
   - Lazy loading
   - Pagination
   - Caching (React Query)
   - Code splitting

2. **Backend:**
   - Database indexing
   - Query optimization
   - Redis caching
   - CDN for images
   - API response compression

3. **Database:**
   - Proper indexes on:
     - user_id, customer_id, date fields
     - Foreign keys
     - Search fields
   - Partitioning for large tables
   - Regular vacuum/analyze

## 🔄 Workflow Rules

### Pre-Call Plan Workflow
```
SR creates plan (by 28th)
  ↓
Status: Pending
  ↓
Sup/SM reviews (by 29th)
  ↓
  ├─→ Approved → SR can check-in
  └─→ Rejected → SR revises & resubmit
```

### Call Report Workflow
```
Check-in (GPS verified - REQUIRES ONLINE)
  ↓
Fill Call Report (CAN WORK OFFLINE)
  ↓
Save Draft (OFFLINE OK - stored locally)
  ↓
Submit (REQUIRES ONLINE - within 2 days before midnight)
  ↓
Status: Submitted
  ↓
Manager reviews & coaches
```

### Offline Mode Workflow (Hybrid)
```
OFFLINE CAPABILITIES:
✅ View cached data:
   - Pre-Call Plans (approved)
   - Call Reports (draft & submitted)
   - Customer list
   - Contact list
   - Master data (activities, territories)

✅ Create/Edit drafts:
   - Pre-Call Plan (draft only)
   - Call Report (draft only)
   - Take photos (stored locally)

❌ Cannot do offline:
   - Check-in (requires GPS verification + online)
   - Submit Pre-Call Plan (requires manager approval)
   - Submit Call Report (requires online sync)
   - View real-time analytics
   - Receive notifications

SYNC PROCESS:
1. App goes online → Auto-detect
2. Check for pending drafts
3. Show "You have N drafts to sync" notification
4. User can:
   - Review drafts
   - Submit selected drafts
   - Discard drafts
5. Auto-upload photos when draft is submitted
6. Sync conflicts: Server wins (last-write-wins)
```

## 📱 Navigation Structure

```
Root Navigator (Stack)
├── Auth Stack
│   ├── Login
│   └── Role Selection
│
└── Main Tab Navigator
    ├── 🏠 Home (Dashboard)
    │   └── Stack: Dashboard → Report Detail → Customer Detail
    │
    ├── 📅 Calendar
    │   └── Stack: Calendar → Day View → Pre-Call Form → Call Report
    │
    ├── 📊 Reports
    │   └── Stack: Report List → Report Detail → Edit Report
    │
    ├── 📸 Quick Actions (Modal)
    │   ├── Check-in
    │   └── Quick Photo
    │
    └── ⚙️ Settings
        └── Stack: Settings → Profile → Company → Users
```

## 🎨 Design System (Based on Screenshots)

### Colors
```typescript
const theme = {
  primary: '#6366F1',      // Indigo/Purple (main buttons)
  secondary: '#8B5CF6',    // Purple variant
  success: '#10B981',      // Green (approved)
  warning: '#F59E0B',      // Orange
  error: '#EF4444',        // Red (rejected)
  background: '#F3F4F6',   // Light gray
  surface: '#FFFFFF',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
  },
  border: '#E5E7EB',
}
```

### Components
- Rounded cards with shadow
- Purple gradient buttons
- Icon + Text buttons
- Stats cards with large numbers
- Badge components for status
- Bottom tab bar with icons

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login                             # Username/Password login
POST   /api/auth/google                            # Google SSO login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/demo                              # Demo mode login (mock data)
```

### Users
```
GET    /api/users/me
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/subordinates
```

### Customers
```
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
GET    /api/customers/:id/contacts
```

### Pre-Call Plans
```
GET    /api/pre-call-plans                    # List (with filters)
GET    /api/pre-call-plans/:id                # Detail
POST   /api/pre-call-plans                    # Create
PUT    /api/pre-call-plans/:id                # Update
DELETE /api/pre-call-plans/:id                # Delete (draft only)
POST   /api/pre-call-plans/:id/submit         # Submit for approval
POST   /api/pre-call-plans/:id/approve        # Approve (Manager)
POST   /api/pre-call-plans/:id/reject         # Reject (Manager)
POST   /api/pre-call-plans/:id/comment        # Add comment
GET    /api/pre-call-plans/pending            # Pending approvals (Manager)
```

### Call Reports
```
GET    /api/call-reports
GET    /api/call-reports/:id
POST   /api/call-reports                      # Create/Check-in
PUT    /api/call-reports/:id                  # Update
POST   /api/call-reports/:id/submit           # Submit
POST   /api/call-reports/:id/check-out        # Check-out
POST   /api/call-reports/:id/photos           # Upload photo
DELETE /api/call-reports/:id/photos/:photoId  # Delete photo
POST   /api/call-reports/:id/coach            # Add coaching (Manager)
```

### Calendar
```
GET    /api/calendar/events                   # Get events
POST   /api/calendar/events                   # Create event
PUT    /api/calendar/events/:id
DELETE /api/calendar/events/:id
```

### Analytics (Manager/PM/MM)
```
GET    /api/analytics/overview                # Dashboard stats
GET    /api/analytics/calls                   # Call metrics
GET    /api/analytics/coverage                # ABC coverage
GET    /api/analytics/activities              # Activity breakdown
GET    /api/analytics/insights                # Customer insights
GET    /api/analytics/team                    # Team performance
POST   /api/analytics/export                  # Export report
```

### Master Data
```
GET    /api/master/activities                 # Activity types
GET    /api/master/customer-types             # A/B/C types
GET    /api/master/roles                      # User roles
GET    /api/master/territories                # Territories (BKK1, BKK2, etc.)
```

### Territories
```
GET    /api/territories                       # List all territories
GET    /api/territories/:id                   # Get territory details
GET    /api/territories/:id/users             # Get users in territory
GET    /api/territories/:id/customers         # Get customers in territory
GET    /api/territories/:id/stats             # Territory statistics
```

### Notifications & Preferences
```
# Notifications
GET    /api/notifications/user/:userId                      # Get user notifications
GET    /api/notifications/user/:userId/unread-count        # Get unread count
PUT    /api/notifications/:id/read                         # Mark as read
PUT    /api/notifications/user/:userId/read-all            # Mark all as read
DELETE /api/notifications/:id                              # Delete notification

# Notification Preferences (NEW - Added 2025-12-03)
GET    /api/notifications/preferences/:userId              # Get preferences (auto-create default)
PUT    /api/notifications/preferences/:userId              # Update preferences
POST   /api/notifications/preferences/:userId/reset        # Reset to defaults
```

**Notification Preferences Features**:
- ✅ Per-user customizable notification settings
- ✅ Control notification types: Plan Approved, Plan Rejected, Plan Pending, Reminders, Coaching, System
- ✅ Choose delivery methods: Push Notifications, Email
- ✅ Configure sound and vibration settings
- ✅ Auto-create default preferences on first access
- ✅ Real-time updates with optimistic UI updates
- ✅ Reset to defaults functionality
- ✅ Web UI at `/settings/notifications` (Mobile-First Design)

## ⚡ Key Features Implementation Notes

### GPS Verification
```typescript
// Check-in validation (STRICT: 10 meters maximum)
const MAX_DISTANCE = 10; // meters
const distance = calculateDistance(
  currentLocation,
  customerLocation
);

if (distance > MAX_DISTANCE) {
  alert(`คุณอยู่ห่างจากลูกค้า ${distance}m (สูงสุด ${MAX_DISTANCE}m)`);
  // Deny check-in - strict enforcement
  return false;
}
```

### ABC Customer Classification
```typescript
// Auto-calculate customer type based on monthly revenue
const classifyCustomer = (monthlyRevenue: number): 'A' | 'B' | 'C' => {
  if (monthlyRevenue > 500000) return 'A';
  if (monthlyRevenue >= 100000) return 'B';
  return 'C';
};

// Get required visits per month
const getRequiredVisits = (type: 'A' | 'B' | 'C'): { min: number; max: number } => {
  switch (type) {
    case 'A': return { min: 8, max: 16 };  // 2-4 times/week
    case 'B': return { min: 4, max: 8 };   // 1-2 times/week
    case 'C': return { min: 1, max: 2 };   // 1-2 times/month
  }
};

// Response time SLA
const getResponseTimeSLA = (type: 'A' | 'B' | 'C'): number => {
  switch (type) {
    case 'A': return 2;   // hours
    case 'B': return 4;   // hours
    case 'C': return 24;  // hours
  }
};
```

### Deadline Enforcement
```typescript
// Pre-Call Plan deadline (28th)
const PLAN_DEADLINE_DAY = 28;

// Call Report deadline (2 days after call)
const REPORT_DEADLINE_DAYS = 2;
const deadline = addDays(callDate, REPORT_DEADLINE_DAYS);
const now = new Date();

if (isAfter(now, endOfDay(deadline))) {
  // Lock submission or show warning
}
```

### Photo Auto-Stamp
```typescript
// Watermark format
const watermark = {
  timestamp: format(new Date(), 'dd/MM/yyyy HH:mm'),
  location: `${lat}, ${lng}`,
  user: userName,
  customer: customerName,
};

// Apply to photo corner using Sharp
```

### Photo Storage Management (100 GB Limit)
```typescript
// Before upload - check company storage quota
const checkStorageQuota = async (companyId: string, photoSizeMB: number): Promise<boolean> => {
  const company = await getCompany(companyId);
  const newTotal = company.storage_used_mb + photoSizeMB;

  if (newTotal > company.storage_limit_mb) {
    throw new Error(`Storage limit exceeded. Used: ${company.storage_used_mb}MB / ${company.storage_limit_mb}MB`);
  }

  return true;
};

// After upload - update storage usage
const updateStorageUsage = async (companyId: string, photoSizeMB: number) => {
  await updateCompany(companyId, {
    storage_used_mb: { increment: photoSizeMB }
  });
};

// After delete - decrease storage usage
const decreaseStorageUsage = async (companyId: string, photoSizeMB: number) => {
  await updateCompany(companyId, {
    storage_used_mb: { decrement: photoSizeMB }
  });
};

// Photo compression before upload
const compressPhoto = async (photoBuffer: Buffer): Promise<Buffer> => {
  return await sharp(photoBuffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
};
```

### Offline Mode Implementation (Hybrid)
```typescript
// 1. Network status detection
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
};

// 2. Local database setup (WatermelonDB recommended)
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

const adapter = new SQLiteAdapter({
  schema: appSchema,
  migrations,
  jsi: true, // Performance boost
  onSetUpError: error => {
    // Handle setup errors
  }
});

const database = new Database({
  adapter,
  modelClasses: [Customer, Contact, PreCallPlan, CallReport, Activity],
});

// 3. Draft management
interface DraftMetadata {
  id: string;
  type: 'pre_call_plan' | 'call_report';
  created_at: Date;
  updated_at: Date;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  photos: string[]; // Local file paths
}

const saveDraftLocally = async (draft: any, type: string) => {
  const draftId = uuid();

  // Save to local database
  await database.write(async () => {
    await draftsCollection.create(draft => {
      draft.id = draftId;
      draft.type = type;
      draft.data = JSON.stringify(draft);
      draft.syncStatus = 'pending';
    });
  });

  // Save photos to file system
  for (const photo of draft.photos) {
    await FileSystem.moveAsync({
      from: photo.uri,
      to: `${FileSystem.documentDirectory}drafts/${draftId}/${photo.id}.jpg`
    });
  }

  return draftId;
};

// 4. Sync queue
const syncDrafts = async () => {
  const pendingDrafts = await database
    .get('drafts')
    .query(Q.where('sync_status', 'pending'))
    .fetch();

  for (const draft of pendingDrafts) {
    try {
      await draft.update(d => {
        d.syncStatus = 'syncing';
      });

      // Upload photos first
      const photoUrls = await uploadDraftPhotos(draft.id);

      // Submit draft to server
      const response = await api.post(`/api/${draft.type}s`, {
        ...JSON.parse(draft.data),
        photos: photoUrls,
      });

      // Mark as synced
      await draft.update(d => {
        d.syncStatus = 'synced';
        d.serverId = response.data.id;
      });

      // Delete local files
      await deleteDraftPhotos(draft.id);

    } catch (error) {
      await draft.update(d => {
        d.syncStatus = 'failed';
        d.errorMessage = error.message;
      });
    }
  }
};

// 5. Cache strategy
const cacheCustomers = async () => {
  const customers = await api.get('/api/customers');

  await database.write(async () => {
    for (const customer of customers.data) {
      await customersCollection.create(c => {
        c.id = customer.id;
        c.name = customer.name;
        c.type = customer.type;
        // ... other fields
        c.cachedAt = new Date();
      });
    }
  });
};

// 6. Offline indicator component
const OfflineIndicator = () => {
  const isOnline = useNetworkStatus();
  const pendingDrafts = usePendingDraftsCount();

  if (isOnline && pendingDrafts === 0) return null;

  return (
    <View style={styles.offlineBar}>
      {!isOnline && (
        <Text>🔴 Offline Mode - Drafts will sync when online</Text>
      )}
      {isOnline && pendingDrafts > 0 && (
        <TouchableOpacity onPress={syncDrafts}>
          <Text>📤 {pendingDrafts} drafts ready to sync - Tap to upload</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 7. Check-in validation (must be online)
const checkIn = async (customerId: string, location: Location) => {
  const isOnline = await NetInfo.fetch().then(state => state.isConnected);

  if (!isOnline) {
    throw new Error('Check-in requires internet connection for GPS verification');
  }

  // Proceed with check-in
  const response = await api.post('/api/call-reports', {
    customer_id: customerId,
    check_in_lat: location.latitude,
    check_in_lng: location.longitude,
    check_in_time: new Date(),
  });

  return response.data;
};
```

## 🚀 Deployment Architecture

```
┌─────────────────┐
│  Mobile Apps    │
│  (iOS/Android)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌────────┐
│ API 1  │ │ API 2  │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (Primary)     │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (Replica)     │
└─────────────────┘

┌─────────────────┐
│     Redis       │
│   (Cache)       │
└─────────────────┘

┌─────────────────┐
│   S3/CDN        │
│   (Photos)      │
└─────────────────┘

┌─────────────────┐
│      FCM        │
│ (Push Notif)    │
└─────────────────┘
```

## 🔌 Future Integration: SAP B1

### Architecture Preparation
Design the API to be integration-ready for SAP Business One:

```typescript
// Design principles for SAP B1 integration
interface IntegrationReadyDesign {
  // 1. External ID fields for all entities
  customer: {
    sap_customer_id?: string;
    sap_sync_status?: 'pending' | 'synced' | 'failed';
    sap_last_sync?: Date;
  };

  // 2. Webhooks for real-time sync
  webhooks: {
    onCallReportSubmit: (report) => sendToSAP(report);
    onCustomerCreate: (customer) => syncToSAP(customer);
  };

  // 3. Data mapping layer
  mappers: {
    customerToSAP: (customer) => SAPBusinessPartner;
    callReportToSAPActivity: (report) => SAPActivity;
  };

  // 4. Sync queue for reliability
  syncQueue: {
    retry: 3;
    backoff: 'exponential';
    deadLetterQueue: true;
  };
}

// Potential sync scenarios
// - Customer master data sync
// - Sales order creation from call reports
// - Inventory check integration
// - Payment/billing sync
```

### Database Schema Additions for SAP B1
```sql
-- Integration tracking table
sap_sync_logs
  - id
  - entity_type (customer, call_report, order, etc.)
  - entity_id
  - action (create, update, delete)
  - status (pending, success, failed)
  - sap_response (jsonb)
  - error_message
  - retry_count
  - created_at
  - updated_at

-- Add to customers table
ALTER TABLE customers ADD COLUMN sap_customer_code VARCHAR(50);
ALTER TABLE customers ADD COLUMN sap_sync_status VARCHAR(20);
ALTER TABLE customers ADD COLUMN sap_last_sync TIMESTAMP;
```

## 📅 Timeline Estimation

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 2 weeks | Auth (Google SSO), User Management, Foundation |
| Phase 2 | 2 weeks | SR Dashboard, Pre-Call, Call Report, Check-in, Photos |
| Phase 3 | 1 week | Manager features, Approval workflow |
| Phase 4 | 2 weeks | Analytics, Notifications, Settings, i18n |
| Phase 5 | 1 week | Polish, Testing, Deployment |
| **Total** | **8 weeks** | Full MVP |
| Future | TBD | Offline mode (if required) + SAP B1 integration |

## 🎯 Success Metrics

1. **User Adoption:**
   - 80%+ SR active daily
   - 90%+ plans submitted on time (by 28th)
   - 85%+ reports submitted on time (within 2 days)

2. **Performance:**
   - App launch < 3s
   - API response < 500ms
   - Photo upload < 10s
   - 99% uptime

3. **Business Impact:**
   - ABC coverage improvement
   - Call frequency increase
   - Better data for PM/MM decisions
   - Reduced approval time

## 🔧 Development Setup

### Prerequisites
```bash
# Required
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- React Native dev environment (Xcode/Android Studio)

# Optional
- Docker & Docker Compose
- VS Code with extensions
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
AWS_S3_BUCKET=...
AWS_ACCESS_KEY=...
FCM_SERVER_KEY=...

# Mobile (.env)
API_URL=https://api.sfe.example.com
GOOGLE_MAPS_API_KEY=...
```

## 📝 Next Steps

1. **Review & Approve this plan**
2. **Setup project repositories**
   - Initialize backend (NestJS/Express)
   - Initialize mobile (React Native + Expo)
   - Setup database
3. **Design detailed mockups** (Figma)
4. **Setup CI/CD pipeline**
5. **Start Phase 1 development**

---

## ✅ Requirements Confirmed

1. **Demo Mode:** ✅ Mock data (ไม่ต้องใช้ separate database)
2. **Single Sign-On:** ✅ Google Sign-In
3. **Customer ABC Classification:** ✅ Revenue-based classification:
   - **Class A (VIP):** > 500K/month | 20% customers = 80% revenue | 8-16 visits/month | Response < 2hrs
   - **Class B (Important):** 100-500K/month | 30% customers = 15% revenue | 4-8 visits/month | Response < 4hrs
   - **Class C (Standard):** < 100K/month | 50% customers = 5% revenue | 1-2 visits/month | Response < 24hrs
4. **Distance threshold:** ✅ 10 meters maximum (strict GPS verification)
5. **Photo storage:** ✅ 100 GB limit (total storage quota)
6. **Offline mode:** ✅ Hybrid mode - Draft offline ได้, Submit ต้อง online (GPS verification requires online)
7. **Report export:** ✅ PDF, CSV formats
8. **Language:** ✅ Thai + English (i18n required)
9. **Territory/Region:** ✅ 7 territories:
   - BKK1: กรุงเทพฯ เขตเหนือ
   - BKK2: กรุงเทพฯ เขตใต้
   - BKK3: กรุงเทพฯ เขตตะวันออก
   - BKK4: กรุงเทพฯ เขตตะวันตก
   - CT1: นนทบุรี + ปทุมธานี
   - CT2: สมุทรปราการ + สมุทรสาคร
   - N1: เชียงใหม่ + ลำพูน
10. **Integration:** ✅ SAP B1 integration planned for future (design API-ready architecture)

---

**Ready to proceed?** กรุณาตรวจสอบและแจ้งกลับมาครับ เมื่อ approve แล้วจะเริ่มเขียนโค้ดได้เลย! 🚀
