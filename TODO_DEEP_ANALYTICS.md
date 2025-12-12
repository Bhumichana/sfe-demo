# 📊 Deep Analytics Development TODO

## 🎯 Overview
พัฒนา Executive Dashboard สำหรับ SM/SD roles ที่แสดงการวิเคราะห์ข้อมูลเชิงลึก 4 ด้าน

**Target Users:** SM (Sales Manager), SD (Sales Director)
**Start Date:** 2025-12-12
**Status:** 🚧 In Progress

---

## ✅ Current Status

### Backend (✅ COMPLETED)
- [x] Executive Dashboard API endpoint (`GET /analytics/executive-dashboard`)
- [x] Sales Funnel Analysis method
- [x] Territory Comparison method
- [x] Customer Segmentation method
- [x] Trend Analysis with Forecasting method
- [x] Frontend API method (`analyticsApi.getExecutiveDashboard()`)

**API Response Structure:**
```json
{
  "salesFunnel": { /* funnel data */ },
  "territoryComparison": { /* territory data */ },
  "customerSegmentation": { /* segmentation data */ },
  "trendAnalysis": { /* trend data */ },
  "dateRange": { "startDate": "...", "endDate": "..." }
}
```

### Frontend (❌ NOT STARTED)
- [ ] Chart components
- [ ] Executive Dashboard page
- [ ] UI/UX design
- [ ] Data visualization

---

## 📋 Development Plan

### 🔧 Phase 1: Preparation & Setup
**Goal:** เตรียมความพร้อมและตรวจสอบ dependencies

#### Tasks:
- [ ] **1.1 ตรวจสอบ Chart Libraries**
  - [ ] เช็คว่ามี chart library ติดตั้งอยู่แล้วหรือไม่
  - [ ] ถ้าไม่มี: install Recharts (`npm install recharts`)
  - [ ] ทดสอบ import Recharts ใน component ง่ายๆ

- [ ] **1.2 ทดสอบ Backend API**
  - [ ] Login ด้วย SM/SD account
  - [ ] เรียก API: `GET /analytics/executive-dashboard`
  - [ ] ตรวจสอบ response data structure
  - [ ] บันทึก sample response เป็นไฟล์

- [ ] **1.3 เตรียม Mock Data**
  - [ ] สร้างไฟล์ mock data สำหรับทดสอบ Charts
  - [ ] เก็บไว้ใน `frontend/src/mocks/analytics-mock.ts`

- [ ] **1.4 ออกแบบ Layout**
  - [ ] วาง wireframe หน้า Executive Dashboard
  - [ ] กำหนด layout grid (2x2 หรือ 1 column)
  - [ ] เลือก color scheme

**Estimated Time:** 1-2 hours
**Dependencies:** None
**Commit Message:** `chore: prepare for deep analytics development`

---

### 📊 Phase 2: Chart Components Development
**Goal:** สร้าง chart components ทีละตัว

#### 2.1 Sales Funnel Chart
- [ ] **สร้าง component:** `frontend/src/components/analytics/SalesFunnelChart.tsx`
- [ ] **Props interface:**
  ```typescript
  interface SalesFunnelData {
    stage: string;
    count: number;
    value: number;
    conversionRate: number;
  }
  ```
- [ ] **Implement chart** (Funnel/Bar chart)
- [ ] **Test with mock data**
- [ ] **Style responsive design**
- [ ] **Add loading state**
- [ ] **Add empty state**

**Commit:** `feat: add Sales Funnel chart component`

---

#### 2.2 Territory Comparison Chart
- [ ] **สร้าง component:** `frontend/src/components/analytics/TerritoryComparisonChart.tsx`
- [ ] **Props interface:**
  ```typescript
  interface TerritoryData {
    territory: string;
    totalCalls: number;
    totalRevenue: number;
    avgCallDuration: number;
    srCount: number;
  }
  ```
- [ ] **Implement chart** (Bar/Column chart)
- [ ] **Test with mock data**
- [ ] **Style responsive design**
- [ ] **Add loading state**
- [ ] **Add empty state**

**Commit:** `feat: add Territory Comparison chart component`

---

#### 2.3 Customer Segmentation Chart
- [ ] **สร้าง component:** `frontend/src/components/analytics/CustomerSegmentationChart.tsx`
- [ ] **Props interface:**
  ```typescript
  interface SegmentData {
    segment: string; // A, B, C
    count: number;
    percentage: number;
  }
  ```
- [ ] **Implement chart** (Pie/Donut chart)
- [ ] **Test with mock data**
- [ ] **Style responsive design**
- [ ] **Add loading state**
- [ ] **Add empty state**

**Commit:** `feat: add Customer Segmentation chart component`

---

#### 2.4 Trend Analysis Chart
- [ ] **สร้าง component:** `frontend/src/components/analytics/TrendAnalysisChart.tsx`
- [ ] **Props interface:**
  ```typescript
  interface TrendData {
    month: string;
    actual: number;
    forecast: number;
    target: number;
  }
  ```
- [ ] **Implement chart** (Line chart with forecast)
- [ ] **Test with mock data**
- [ ] **Style responsive design**
- [ ] **Add loading state**
- [ ] **Add empty state**
- [ ] **แสดง forecast แยกจาก actual (dashed line)**

**Commit:** `feat: add Trend Analysis chart component`

---

### 🎨 Phase 3: Executive Dashboard Page
**Goal:** สร้างหน้า Dashboard หลักที่รวม Charts ทั้งหมด

#### Tasks:
- [ ] **3.1 สร้างหน้าใหม่**
  - [ ] สร้างไฟล์: `frontend/src/app/analytics/executive/page.tsx`
  - [ ] เพิ่ม route protection (เฉพาะ SM/SD)
  - [ ] ใช้ MainLayout

- [ ] **3.2 Integrate API**
  - [ ] ใช้ `analyticsApi.getExecutiveDashboard()` (**ห้ามใช้ fetch() โดยตรง!**)
  - [ ] Handle loading state
  - [ ] Handle error state
  - [ ] เก็บข้อมูลใน state

- [ ] **3.3 Layout & UI**
  - [ ] สร้าง grid layout สำหรับ 4 charts
  - [ ] เพิ่ม header ด้วย title และ description
  - [ ] เพิ่ม Date Range Filter
  - [ ] เพิ่ม Export button (optional)

- [ ] **3.4 Integrate Charts**
  - [ ] Import SalesFunnelChart → แสดงข้อมูล
  - [ ] Import TerritoryComparisonChart → แสดงข้อมูล
  - [ ] Import CustomerSegmentationChart → แสดงข้อมูล
  - [ ] Import TrendAnalysisChart → แสดงข้อมูล

- [ ] **3.5 Date Range Functionality**
  - [ ] เพิ่ม DatePicker component
  - [ ] เรียก API ใหม่เมื่อเปลี่ยน date range
  - [ ] แสดง loading ขณะ fetch ข้อมูลใหม่

**Commit:** `feat: add Executive Dashboard page with all analytics charts`

---

### 🧪 Phase 4: Testing & Polish
**Goal:** ทดสอบและปรับปรุงให้สมบูรณ์

#### Tasks:
- [ ] **4.1 Functional Testing**
  - [ ] Login ด้วย SM account → ทดสอบเข้าหน้า Dashboard
  - [ ] Login ด้วย SD account → ทดสอบเข้าหน้า Dashboard
  - [ ] Login ด้วย SR account → ต้องไม่สามารถเข้าถึงได้
  - [ ] ทดสอบ Date Range Filter
  - [ ] ทดสอบ loading states
  - [ ] ทดสอบ error states

- [ ] **4.2 UI/UX Testing**
  - [ ] ทดสอบบน Desktop (1920x1080)
  - [ ] ทดสอบบน Tablet (768x1024)
  - [ ] ทดสอบบน Mobile (375x667)
  - [ ] ตรวจสอบ colors contrast
  - [ ] ตรวจสอบ font sizes

- [ ] **4.3 Performance Testing**
  - [ ] ทดสอบกับข้อมูลจำนวนมาก
  - [ ] ตรวจสอบ API response time
  - [ ] Optimize re-renders

- [ ] **4.4 Bug Fixes**
  - [ ] แก้ไข bugs ที่พบ
  - [ ] เพิ่ม error handling ที่ขาดหาย

**Commit:** `test: complete executive dashboard testing and fixes`

---

### 🚀 Phase 5: Deployment & Documentation
**Goal:** เตรียมพร้อม deploy และเขียน docs

#### Tasks:
- [ ] **5.1 Navigation**
  - [ ] เพิ่มลิงก์ไปหน้า Executive Dashboard ใน menu (เฉพาะ SM/SD)
  - [ ] เพิ่ม icon สำหรับ Analytics
  - [ ] Test navigation flow

- [ ] **5.2 Documentation**
  - [ ] อัพเดท README.md
  - [ ] เขียน component documentation
  - [ ] สร้าง user guide (ถ้าจำเป็น)

- [ ] **5.3 Code Review**
  - [ ] ตรวจสอบว่าไม่มี `fetch()` โดยตรง
  - [ ] ตรวจสอบ TypeScript types
  - [ ] ตรวจสอบ error handling
  - [ ] ลบ console.log() ที่ไม่จำเป็น

- [ ] **5.4 Final Commit & Push**
  - [ ] Git commit all changes
  - [ ] Push to repository
  - [ ] Create pull request (if needed)

**Commit:** `docs: add deep analytics documentation`

---

## 🛡️ Safety Guidelines

### ✅ DO:
- ✅ ใช้ `analyticsApi.getExecutiveDashboard()` เสมอ
- ✅ ทดสอบทีละ component ก่อนทำต่อ
- ✅ Commit หลังแต่ละ phase สำเร็จ
- ✅ เพิ่ม loading และ error states ทุก component
- ✅ ใช้ TypeScript types ที่ชัดเจน

### ❌ DON'T:
- ❌ ห้ามใช้ `fetch()` โดยตรง
- ❌ ห้าม modify code ที่ทำงานได้ดีอยู่แล้ว
- ❌ ห้าม commit code ที่ยัง compile ไม่ผ่าน
- ❌ ห้ามทำหลาย features พร้อมกัน
- ❌ ห้าม skip การทดสอบ

---

## 📝 Notes

### Chart Library Recommendation
**Recharts** - เหมาะสำหรับ React, responsive, ใช้ง่าย
```bash
npm install recharts
```

### Color Scheme Suggestions
- **Primary:** `#3B82F6` (Blue)
- **Success:** `#10B981` (Green)
- **Warning:** `#F59E0B` (Orange)
- **Danger:** `#EF4444` (Red)
- **Info:** `#6366F1` (Indigo)

### Sample Date Range Filter
```typescript
const [dateRange, setDateRange] = useState({
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

---

## 🐛 Known Issues & Bugs
<!-- เพิ่ม bugs ที่พบระหว่างพัฒนาที่นี่ -->

- None yet

---

## ✅ Completion Checklist

- [ ] All Phase 1 tasks completed
- [ ] All Phase 2 tasks completed
- [ ] All Phase 3 tasks completed
- [ ] All Phase 4 tasks completed
- [ ] All Phase 5 tasks completed
- [ ] No `fetch()` calls in code
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Ready for production

---

## 📞 Contact & Support

**Developer:** Claude
**Last Updated:** 2025-12-12
**Project:** OREX SFE Mobile

---

*ให้ติ๊ก [x] ใน checkbox เมื่อทำเสร็จแต่ละ task*
