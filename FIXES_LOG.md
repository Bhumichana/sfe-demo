# 🔧 Bug Fixes & Solutions Log

**Purpose:** Quick reference for fixed bugs and their solutions
**Last Updated:** November 22, 2025

---

## Bug #1: Activity Selection UI Not Professional ❌→✅

**Date Fixed:** November 22, 2025
**Severity:** Medium (UX Issue)

### Problem
- กิจกรรมแสดงเป็น checkbox ธรรมดา
- ไม่มีไอคอน ไม่สวยงาม
- ไม่เป็นมืออาชีพ

### Solution
**Files Modified:**
- `frontend/src/app/call-reports/create/page.tsx`
- `frontend/src/app/pre-call-plans/create/page.tsx`

**Changes:**
```typescript
// Added icon mapping function
const getActivityIcon = (activityName: string): string => {...}

// Changed from checkboxes to icon cards
<button className="card with icons and animations">
  <div className="icon">{icon}</div>
  <div className="name">{activity.nameTh}</div>
</button>
```

**Result:** ✅ Beautiful, professional icon cards with animations

---

## Bug #2: Pre-Call Plans Cannot Load Customers ❌→✅

**Date Fixed:** November 22, 2025
**Severity:** Critical (Blocking Feature)

### Problem
```
Error: "ไม่สามารถโหลดข้อมูลลูกค้าได้"
```

### Root Cause
```typescript
// Wrong - hardcoded frontend port
await axios.get('http://localhost:3000/api/customers')
// Frontend is 3000, but API is 3001!
```

### Solution
**File Modified:**
- `frontend/src/app/pre-call-plans/create/page.tsx`

**Change:**
```typescript
// Before
import axios from 'axios';
const response = await axios.get('http://localhost:3000/api/customers');

// After
import { customersApi } from '@/services/api';
const data = await customersApi.findAll();
```

**Result:** ✅ Customers load correctly from backend (port 3001)

---

## Bug #3: Plans Not Appearing in Approvals ❌→✅

**Date Fixed:** November 22, 2025
**Severity:** Critical (Workflow Broken)

### Problem
- Create Pre-Call Plan สำเร็จ
- แต่ Manager ไม่เห็นในหน้า Approvals
- Plan status: DRAFT (should be PENDING)

### Root Cause
```typescript
// Missing submit step!
const result = await preCallPlansApi.create(dto);
// No submit → stays as DRAFT
router.push('/pre-call-plans');
```

### Solution
**File Modified:**
- `frontend/src/app/pre-call-plans/create/page.tsx`

**Change:**
```typescript
// Before - only create
const result = await preCallPlansApi.create(dto);
alert('สร้างแผนสำเร็จ!');

// After - create AND submit
const result = await preCallPlansApi.create(dto);
await preCallPlansApi.submit(result.id, user.id);
alert('สร้างและส่งแผนขออนุมัติสำเร็จ!');
```

**Result:** ✅ Plans now appear in Manager's Approvals page immediately

---

## Bug #4: Notifications Not Loading ❌→✅

**Date Fixed:** November 22, 2025
**Severity:** High (Feature Not Working)

### Problem
- Bell icon shows "1 Issue"
- Click bell → "ไม่มีการแจ้งเตือน"
- Console: 404 errors for `/api/notifications/...`

### Root Cause
```typescript
// Wrong port hardcoded
await axios.get('http://localhost:3000/api/notifications/...')
// Should be 3001!
```

### Solution
**Files Modified:**
- `frontend/src/services/api.ts` (added notificationsApi)
- `frontend/src/components/NotificationCenter.tsx`

**Changes:**
```typescript
// 1. Created new API service
export const notificationsApi = {
  findByUser: async (userId, unreadOnly?) => {...},
  markAsRead: async (notificationId, userId) => {...},
  markAllAsRead: async (userId) => {...},
  remove: async (notificationId, userId) => {...},
};

// 2. Updated component
// Before
import axios from 'axios';
await axios.get('http://localhost:3000/api/notifications/...');

// After
import { notificationsApi } from '@/services/api';
await notificationsApi.findByUser(userId, filter === 'unread');
```

**Result:** ✅ Notifications load properly from backend

---

## Bug #5: Duplicate Activities Display ❌→✅

**Date Fixed:** November 22, 2025
**Severity:** Low (Visual Issue)

### Problem
- Same activity shows 2-3 times
- Database has duplicate entries

### Solution
**Files Modified:**
- `frontend/src/app/call-reports/create/page.tsx`
- `frontend/src/app/pre-call-plans/create/page.tsx`

**Change:**
```typescript
// Filter duplicates before mapping
activityTypes
  .filter((activity, index, self) =>
    index === self.findIndex((a) => a.nameTh === activity.nameTh)
  )
  .map((activity) => {
    // Render
  })
```

**Result:** ✅ Each activity appears only once

---

## Known Issues (Not Yet Fixed)

### Issue: Backend Dist Folder Permission Error

**Status:** ⚠️ Workaround exists
**Impact:** Low (backend already running)

**Error:**
```
EPERM: operation not permitted, scandir 'G:\orex-sfe\backend\dist'
```

**Workaround:**
- Backend is already running from previous session (PID 25228)
- Check with: `netstat -ano | findstr ":3001"`
- No action needed if already running

**Future Fix:**
- Investigate file lock issue
- Or implement auto-restart script

---

## Prevention Guidelines

### ✅ To Prevent Similar Issues:

1. **Never hardcode URLs**
   ```typescript
   // ❌ BAD
   axios.get('http://localhost:3000/...')

   // ✅ GOOD
   import { someApi } from '@/services/api'
   someApi.someMethod()
   ```

2. **Always use centralized API services**
   - Add new endpoints to `services/api.ts`
   - Import and use from components

3. **Check ports match**
   - Frontend: 3000
   - Backend: 3001
   - PostgreSQL: 5432
   - Redis: 6379

4. **Complete workflows**
   - Don't leave half-implemented features
   - If creating, also implement submit/delete/update

5. **Filter duplicates in frontend**
   - When displaying lists from database
   - Use `filter + findIndex` pattern

6. **Test end-to-end**
   - Create → Submit → Approve → View
   - Don't just test individual parts

---

## Quick Reference: Common Patterns

### Pattern 1: API Call
```typescript
// ✅ ALWAYS use this pattern
import { someApi } from '@/services/api';

try {
  const data = await someApi.someMethod();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  alert('Error message');
}
```

### Pattern 2: Create + Submit Workflow
```typescript
// ✅ Complete workflow
const result = await api.create(dto);
await api.submit(result.id, userId);
alert('Created and submitted!');
```

### Pattern 3: Filter Duplicates
```typescript
// ✅ Remove duplicates
items.filter((item, index, self) =>
  index === self.findIndex((i) => i.uniqueKey === item.uniqueKey)
)
```

### Pattern 4: Icon Mapping
```typescript
// ✅ Extensible icon mapping
const getIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('keyword')) return '🎯';
  return '📌'; // default
}
```

---

## Testing Checklist Before Commit

- [ ] No TypeScript errors
- [ ] No hardcoded URLs
- [ ] All API calls use services
- [ ] Error handling in place
- [ ] Loading states added
- [ ] End-to-end workflow tested
- [ ] No duplicate data
- [ ] Responsive design checked
- [ ] Console.logs removed

---

---

## Bug #6: Customer Code Generation Error (CUST0NaN) ❌→✅

**Date Fixed:** November 25, 2025
**Severity:** Critical (Data Corruption + Blocking Feature)

### Problem
1. **Backend generates invalid customer code:** `CUST0NaN` instead of `CUST0001`, `CUST0002`
2. **Error:** "Customer code already exists" when creating new customers
3. **React Rendering Error:** `Runtime NotFoundError: Failed to execute 'insertBefore' on 'Node'`

### Root Cause

**Backend Issue:**
```typescript
// โค้ดเดิม - ไม่ป้องกัน invalid codes
const lastCustomer = await this.prisma.customer.findFirst({
  where: { code: { startsWith: 'CUST' } },
  orderBy: { code: 'desc' },
});

const lastNumber = parseInt(lastCustomer.code.replace('CUST', ''), 10);
// ถ้า code = 'CUST0NaN' → parseInt('0NaN', 10) = NaN
// ถ้า code = 'CUST-C001' → parseInt('-C001', 10) = NaN
const nextNumber = lastNumber + 1; // NaN + 1 = NaN
return `CUST${nextNumber.toString().padStart(4, '0')}`; // 'CUST0NaN'
```

**Frontend Issue:**
```typescript
// โค้ดเดิม - alert() ทำให้ React rendering หยุดชะงัก
alert('สร้างลูกค้าสำเร็จ!');
onSuccess(customer);
handleClose(); // รีเซ็ต state ก่อนปิด modal → rendering conflict
```

### Solution

**1. Backend - Improved Customer Code Generation**

**File Modified:** `backend/src/modules/customers/customers.service.ts`

```typescript
private async generateCustomerCode(): Promise<string> {
  // Get all customers with auto-generated codes
  const customers = await this.prisma.customer.findMany({
    where: {
      code: { startsWith: 'CUST' },
    },
    select: { code: true },
    orderBy: { code: 'desc' },
  });

  // Filter to only valid codes (CUST + 4 digits) and extract numbers
  const validNumbers = customers
    .map(c => {
      const match = c.code.match(/^CUST(\d{4})$/); // ✅ ใช้ regex validation
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(n => n !== null && !isNaN(n)) as number[]; // ✅ กรอง NaN ออก

  // Get the highest number, or start from 0
  const lastNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
  const nextNumber = lastNumber + 1;

  // Pad with zeros (e.g., 1 -> "0001", 43 -> "0043")
  return `CUST${nextNumber.toString().padStart(4, '0')}`;
}
```

**Key Improvements:**
- ✅ ใช้ **regex pattern** `/^CUST(\d{4})$/` กรองเฉพาะ code ที่ถูกต้อง
- ✅ ใช้ `Math.max()` หาเลขสูงสุดจาก array
- ✅ ป้องกัน `NaN` จาก codes ที่ผิดรูปแบบ (เช่น `CUST-C001`, `CUST0NaN`)
- ✅ ถ้าไม่มี customer เลย จะเริ่มที่ `CUST0001`

**2. Clean Up Bad Data**

```javascript
// ลบ customer ที่มี code ผิดพลาด
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

await prisma.customer.deleteMany({
  where: { code: 'CUST0NaN' }
});
```

**3. Frontend - Fix React Rendering Error**

**File Modified:** `frontend/src/components/modals/QuickCreateCustomerModal.tsx`

```typescript
// Before - ทำให้เกิด rendering conflict
alert('สร้างลูกค้าสำเร็จ!'); // ❌ alert หยุด React rendering
onSuccess(customer);
handleClose(); // ❌ รีเซ็ต state ก่อนปิด modal

// After - smooth and clean
onSuccess(customer); // ✅ ส่งข้อมูลกลับไปก่อน
onClose(); // ✅ ใช้ onClose โดยตรง (ไม่รีเซ็ต state)
```

**Key Improvements:**
- ✅ **เอา `alert()` ออก** - ป้องกัน browser dialog ที่ทำให้ React rendering หยุด
- ✅ **เรียก `onClose()` โดยตรง** - ไม่รีเซ็ต form state ก่อนปิด modal
- ✅ **เรียก `onSuccess()` ก่อน** - ให้ parent component อัพเดท state ก่อน

### Result
✅ สร้างลูกค้าใหม่ได้สำเร็จพร้อม code ที่ถูกต้อง (`CUST0001`, `CUST0002`, ...)
✅ ไม่มี error "Customer code already exists"
✅ ไม่มี React rendering error
✅ Modal ปิดและเลือกลูกค้าใหม่อัตโนมัติ
✅ UX ดีขึ้น - ไม่มี alert รบกวน

### Lessons Learned

**Backend:**
1. ใช้ **regex validation** เสมอเมื่อต้องการกรอง pattern
2. ป้องกัน `NaN` ด้วย `isNaN()` check
3. ใช้ `Math.max()` แทนการพึ่งพา database ordering เพียงอย่างเดียว
4. Validate data format ก่อนนำไป parse

**Frontend:**
1. **หลีกเลี่ยง `alert()`** ใน React - ใช้ toast notification แทน
2. ระวัง **state mutation** ก่อนปิด modal
3. เรียก parent callback ก่อนปิด modal เสมอ
4. ไม่รีเซ็ต state ก่อนที่ component จะ unmount

**Debugging:**
1. เช็คข้อมูลใน database เมื่อเจอ logic error
2. ใช้ console logs และ browser DevTools หา root cause
3. แก้ที่ root cause ไม่ใช่แก้ symptom

### Prevention for Future

**1. Backend Validation:**
```typescript
// เพิ่ม validation ใน DTO
@IsString()
@Matches(/^CUST\d{4}$/, {
  message: 'Customer code must be in format CUST0001'
})
code?: string;
```

**2. Database Constraint (Optional):**
```sql
-- เพิ่ม check constraint ใน database (ถ้ารองรับ)
ALTER TABLE customers
ADD CONSTRAINT chk_customer_code
CHECK (code ~ '^CUST\d{4}$');
```

**3. Frontend Error Handling:**
```typescript
// ใช้ toast แทน alert (เพิ่มในอนาคต)
import { toast } from 'react-hot-toast';

toast.success('สร้างลูกค้าสำเร็จ!');
```

---

**Last Review:** November 25, 2025
**Next Review:** When new bugs are fixed
