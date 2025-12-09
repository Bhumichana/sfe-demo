# TODO สำหรับเซสชั่นถัดไป

## ปัญหาที่ต้องแก้: Manager Dashboard ไม่แสดง Badge การแจ้งเตือน

### สถานการณ์
- ✅ หน้า Calendar, Customers, Analytics, Settings → แสดง notification badge และทำงานได้ปกติ
- ❌ หน้า Manager Dashboard (`/manager/dashboard`) → ไม่แสดง badge (แต่มีปุ่มระฆัง)

### สาเหตุ
1. หน้า Manager Dashboard **ไม่ได้ใช้ MainLayout** (ซึ่ง MainLayout มี notification system อยู่แล้ว)
2. เมื่อพยายามเพิ่ม notification badge โดยตรง เกิด build error: `Module not found: Can't resolve '@/stores/notificationStore'`
3. แก้โดยลบ import notification store ออก → build ผ่าน แต่ badge หายไป

### งานที่ต้องทำ

#### ขั้นตอนที่ 1: ค้นหาว่า MainLayout ใช้ notification อย่างไร
```bash
# เช็ค MainLayout
cat frontend/src/components/MainLayout.tsx

# หรือ search ว่า notification อยู่ไฟล์ไหน
grep -r "notification" frontend/src/components/ --include="*.tsx"
grep -r "useNotification" frontend/src/ --include="*.ts" --include="*.tsx"
```

#### ขั้นตอนที่ 2: เช็คว่า notification store อยู่ที่ไหน
```bash
find frontend/src -name "*notification*" -type f
ls -la frontend/src/stores/
```

#### ขั้นตอนที่ 3: แก้ไข Manager Dashboard
มี 2 วิธีแก้:

**วิธีที่ 1: ให้ Manager Dashboard ใช้ MainLayout (แนะนำ)**
- แก้ไขหน้า `frontend/src/app/manager/dashboard/page.tsx`
- ห่อ content ด้วย MainLayout แทนที่จะสร้าง header เอง
- จะได้ notification bell พร้อม badge อัตโนมัติ

**วิธีที่ 2: คัดลอกวิธีการจาก MainLayout**
- หาว่า MainLayout ใช้ notification store จากไหน
- คัดลอก import และ logic มาใช้ใน Manager Dashboard
- เพิ่ม badge กลับเข้าไปที่ notification bell

### ไฟล์ที่เกี่ยวข้อง
- `frontend/src/app/manager/dashboard/page.tsx` - หน้าที่ต้องแก้
- `frontend/src/components/MainLayout.tsx` - ดูตัวอย่างการใช้ notification
- `frontend/src/stores/` - โฟลเดอร์ที่เก็บ stores (อาจมี notification store)

### Commit ล่าสุด
- Commit: `f71a084` - "Fix build error by removing notification store dependency"
- สถานะ: Deployed บน Vercel สำเร็จ
- ที่ต้องทำต่อ: เพิ่ม notification badge กลับมา

### คำแนะนำเพิ่มเติม
1. อย่าลืม test บน Vercel หลังจากแก้
2. ถ้า MainLayout ใช้ notification ได้ แสดงว่า store มีอยู่แล้ว แค่ต้องหาว่าอยู่ไหน
3. อาจต้องเช็คว่า path import ถูกต้องหรือไม่ (เช่น `@/stores/notificationStore` vs `@/lib/stores/notificationStore`)

---
**วันที่สร้าง:** 2025-12-05
**สถานะ:** รอดำเนินการในเซสชั่นถัดไป
