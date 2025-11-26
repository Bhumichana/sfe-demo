# SFE Mobile - Sales Force Effectiveness

ระบบบริหารจัดการพนักงานขาย พร้อมระบบอนุมัติและรายงานแบบ Real-time

## Project Structure

```
orex-sfe/
├── backend/           # NestJS Backend API
├── mobile/            # React Native Mobile App
├── shared/            # Shared types and constants
├── docker-compose.yml # Development services (PostgreSQL, Redis)
└── IMPLEMENTATION_PLAN.md
```

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **PostgreSQL** - Main database
- **Prisma** - ORM
- **Redis** - Caching & sessions
- **Passport.js** - Authentication (Google SSO)

### Mobile
- **React Native** + **Expo**
- **TypeScript**
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **WatermelonDB** - Local database (offline mode)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Redis 6+ (or use Docker)
- Expo CLI
- iOS Simulator / Android Emulator

### Quick Start

#### 1. Clone and Install

```bash
# Install dependencies
cd backend && npm install
cd ../mobile && npm install
```

#### 2. Start Services (Docker)

```bash
# Start PostgreSQL + Redis
docker-compose up -d
```

#### 3. Setup Database

```bash
# Backend - Generate Prisma client and run migrations
cd backend
npm run prisma:migrate
npm run prisma:seed
```

#### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Mobile
cd mobile
npm start
```

#### 5. Access Apps

- **Backend API:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/api
- **Mobile App:** Scan QR code from Expo

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://sfe:sfe_password@localhost:5432/sfe_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AWS_S3_BUCKET="your-s3-bucket"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### Mobile (.env)
```bash
API_URL="http://localhost:3000"
GOOGLE_WEB_CLIENT_ID="your-google-web-client-id"
GOOGLE_IOS_CLIENT_ID="your-google-ios-client-id"
GOOGLE_ANDROID_CLIENT_ID="your-google-android-client-id"
```

## Features

### Phase 1 (Current) ✅
- [x] Authentication (Login, Google SSO, Demo mode)
- [x] User Management
- [x] Database schema with Prisma
- [x] Basic API structure

### Phase 2 (In Progress)
- [ ] SR Dashboard
- [ ] Pre-Call Planning
- [ ] Call Reports
- [ ] Check-in with GPS
- [ ] Quick Photo

### Phase 3 (Planned)
- [ ] Manager Dashboard
- [ ] Approval Workflow
- [ ] Coaching & Comments

### Phase 4 (Planned)
- [ ] Analytics Dashboard
- [ ] Notifications
- [ ] Offline Mode (Hybrid)
- [ ] Settings & i18n

### Phase 5 (Planned)
- [ ] Polish & Testing
- [ ] Deployment

## Project Timeline

- **Phase 1:** 2 weeks (Foundation & Auth)
- **Phase 2:** 2 weeks (SR Features)
- **Phase 3:** 1 week (Manager Features)
- **Phase 4:** 2 weeks (Analytics & Advanced)
- **Phase 5:** 1 week (Polish & Deploy)

**Total:** 8 weeks for MVP

## Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed technical plan
- [API Documentation](http://localhost:3000/api) - Swagger docs (when backend running)

## License

Proprietary - All rights reserved
