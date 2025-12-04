# 📍 GPS & Location Implementation Plan
**Project:** SFE Mobile - Customer Location Management
**Created:** 2025-12-04
**Status:** Planning

---

## 🎯 Objectives

เพิ่มระบบจัดการตำแหน่ง GPS สำหรับข้อมูลลูกค้า เพื่อรองรับการ Check-in และตรวจสอบตำแหน่งที่แม่นยำ

---

## 📋 Current Situation

### มีอยู่แล้ว (Existing):
- ✅ Database มี fields: `lat` (Decimal), `lng` (Decimal)
- ✅ หน้าสร้างลูกค้าพื้นฐาน (ชื่อ, ที่อยู่, เบอร์โทร)

### ปัญหาที่พบ (Problems):
- ❌ ไม่มีช่องกรอก/เลือก GPS location
- ❌ ลูกค้าที่สร้างใหม่ไม่มี location data
- ❌ ไม่สามารถใช้สำหรับ Check-in validation ได้

---

## 🗺️ Solution: Hybrid Location System

ใช้ **OpenStreetMap** + **Leaflet.js** + **Nominatim API** (ฟรี 100%)

### 3 Methods for Setting Location:

#### Method 1: 📍 Current Location (ใช้ GPS ปัจจุบัน)
- เหมาะสำหรับ: พนักงานที่อยู่ที่ลูกค้า
- ความแม่นยำ: สูงมาก (5-50m)
- Technology: Browser Geolocation API

#### Method 2: 🔍 Geocoding (ค้นหาจากที่อยู่)
- เหมาะสำหรับ: สร้างข้อมูลในออฟฟิศ
- ความแม่นยำ: ดี (50-200m)
- Technology: Nominatim Geocoding API

#### Method 3: 🖱️ Map Picker (คลิกบนแผนที่)
- เหมาะสำหรับ: ปรับแต่งตำแหน่งแบบละเอียด
- ความแม่นยำ: ขึ้นอยู่กับ user
- Technology: Leaflet.js Interactive Map

---

## 📦 Required Dependencies

### Frontend (Next.js):
```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

### CSS:
```html
<!-- ใน layout.tsx หรือ _app.tsx -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

---

## 🏗️ Implementation Phases

---

## Phase 1: Setup & Basic Map Component ⚙️

### 1.1 Install Dependencies
- [ ] Install Leaflet packages
- [ ] Add Leaflet CSS to layout
- [ ] Configure Next.js for Leaflet (SSR handling)

### 1.2 Create Base Map Component
**File:** `frontend/src/components/maps/LocationMap.tsx`

**Features:**
- Display OpenStreetMap
- Support marker placement
- Configurable center & zoom
- Responsive design

**Props:**
```typescript
interface LocationMapProps {
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
}
```

### 1.3 Create Map Utilities
**File:** `frontend/src/utils/mapUtils.ts`

**Functions:**
- `calculateDistance(lat1, lng1, lat2, lng2)` - คำนวณระยะทาง (Haversine)
- `isWithinRadius(lat1, lng1, lat2, lng2, radiusMeters)` - เช็คอยู่ในรัศมีหรือไม่
- `formatCoordinates(lat, lng)` - Format แสดงผล

---

## Phase 2: Current Location (GPS) 📍

### 2.1 Create Current Location Hook
**File:** `frontend/src/hooks/useCurrentLocation.ts`

**Features:**
- Request geolocation permission
- Get current position
- Handle errors (permission denied, timeout, etc.)
- Loading state
- Accuracy information

**Usage:**
```typescript
const { location, loading, error, getCurrentLocation } = useCurrentLocation();
```

### 2.2 Add "Use Current Location" Button
**Files to Update:**
- `frontend/src/app/customers/create/page.tsx`
- `frontend/src/app/customers/[id]/edit/page.tsx`

**UI:**
```
[📍 ใช้ตำแหน่งปัจจุบัน]
  ↓ (loading indicator)
✅ ตำแหน่งปัจจุบัน: 13.7563, 100.5018 (แม่นยำ: ±10m)
[แสดงบนแผนที่]
```

---

## Phase 3: Geocoding (Address → GPS) 🔍

### 3.1 Create Geocoding Service
**File:** `frontend/src/services/geocoding.ts`

**API:** Nominatim (OpenStreetMap)
```typescript
async function geocodeAddress(address: string): Promise<GeocodeResult[]>
```

**Rate Limiting:**
- Nominatim limit: 1 request/second
- Implement debounce (1000ms)
- Add user-agent header

**Response:**
```typescript
interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    country?: string;
    province?: string;
    district?: string;
  }
}
```

### 3.2 Add Address Search Component
**File:** `frontend/src/components/maps/AddressSearch.tsx`

**Features:**
- Search input with debounce
- Display search results (dropdown)
- Select result → set lat/lng
- Show on map

**UI:**
```
[ค้นหาที่อยู่: โรงพยาบาลกรุงเทพ      ] [🔍]
  ↓
Results:
- โรงพยาบาลกรุงเทพ, บางกะปิ กรุงเทพฯ (13.7563, 100.5018)
- โรงพยาบาลกรุงเทพพัทยา, ชลบุรี (12.9236, 100.8825)
```

---

## Phase 4: Interactive Map Picker 🖱️

### 4.1 Create Location Picker Component
**File:** `frontend/src/components/maps/LocationPicker.tsx`

**Features:**
- Display map with draggable marker
- Click to place marker
- Search box integration
- "Use Current Location" button
- Zoom controls
- Display coordinates

**Layout:**
```
┌─────────────────────────────────────┐
│ [🔍 ค้นหาที่อยู่...]  [📍 ตำแหน่งปัจจุบัน] │
├─────────────────────────────────────┤
│                                     │
│         [Interactive Map]           │
│              📍 (marker)            │
│                                     │
├─────────────────────────────────────┤
│ พิกัด: 13.7563, 100.5018           │
│ ที่อยู่: โรงพยาบาลกรุงเทพ...        │
└─────────────────────────────────────┘
```

### 4.2 Integrate Map Events
- `onClick` → Place marker
- `onDragEnd` → Update coordinates
- `onSearch` → Geocode & move map
- `onUseCurrentLocation` → Center map to GPS

---

## Phase 5: Update Customer Forms 📝

### 5.1 Update Create Customer Page
**File:** `frontend/src/app/customers/create/page.tsx`

**Changes:**
- Add location section
- Show LocationPicker component
- Validate location before submit
- Display current coordinates

**Form Structure:**
```
┌─ ข้อมูลทั่วไป ────────────┐
│ ชื่อ, ที่อยู่, เบอร์โทร     │
└──────────────────────────┘

┌─ ตำแหน่งที่ตั้ง (GPS) ────┐
│ [LocationPicker]          │
│ - Search Address          │
│ - Use Current Location    │
│ - Click on Map            │
│                           │
│ พิกัด: 13.7563, 100.5018  │
└──────────────────────────┘

[บันทึก]
```

### 5.2 Update Edit Customer Page
**File:** `frontend/src/app/customers/[id]/edit/page.tsx`

**Changes:**
- Show existing location on map
- Allow updating location
- Same LocationPicker UI

### 5.3 Update Quick Create Modal
**File:** `frontend/src/components/modals/QuickCreateCustomerModal.tsx`

**Options:**
- **Option A:** Simplified - เฉพาะ "Use Current Location"
- **Option B:** Full - มี LocationPicker เต็มรูปแบบ

**Recommendation:** Option A (simple) เพราะ Quick Create ควรเร็ว

---

## Phase 6: Display Customer Location 🗺️

### 6.1 Customer Detail Page
**File:** `frontend/src/app/customers/[id]/page.tsx`

**Features:**
- Show static map with customer location
- Display coordinates
- "Open in Google Maps" link
- Distance from current location (if available)

**UI:**
```
┌─ ข้อมูลลูกค้า ────────────┐
│ ชื่อ: โรงพยาบาลกรุงเทพ     │
│ ที่อยู่: 2 ซอยศูนย์วิจัย 7 │
└──────────────────────────┘

┌─ ตำแหน่งที่ตั้ง ──────────┐
│    [Static Map]           │
│        📍                 │
│                           │
│ พิกัด: 13.7563, 100.5018  │
│ [🗺️ เปิดใน Google Maps]   │
│ 📏 ระยะห่างจากคุณ: 2.3 km │
└──────────────────────────┘
```

### 6.2 Customer List Page
**File:** `frontend/src/app/customers/page.tsx`

**Features:**
- Show icon if location exists ✅ / ❌
- Filter by "Has Location" / "No Location"
- Sort by distance (if current location available)

---

## Phase 7: Check-in Validation 🎯

### 7.1 Define Check-in Rules
**File:** `backend/src/config/checkin.config.ts`

```typescript
export const CHECKIN_CONFIG = {
  // Default radius in meters
  DEFAULT_RADIUS_METERS: 100,

  // Radius by customer type
  RADIUS_BY_TYPE: {
    A: 200, // VIP customers (larger buildings)
    B: 150,
    C: 100,
  },

  // Warning radius (show warning but allow check-in)
  WARNING_RADIUS_METERS: 500,

  // GPS accuracy threshold (reject if accuracy > threshold)
  MAX_GPS_ACCURACY_METERS: 50,
};
```

### 7.2 Backend Validation
**File:** `backend/src/modules/check-in/check-in.service.ts`

**Validation Steps:**
1. Check if customer has location (lat/lng)
2. Calculate distance from current GPS to customer location
3. Check if within allowed radius
4. Check GPS accuracy
5. Return validation result

**Response:**
```typescript
interface CheckInValidation {
  allowed: boolean;
  distance: number;
  withinRadius: boolean;
  message: string;
  warning?: string;
}
```

### 7.3 Frontend Check-in Flow
**File:** `frontend/src/app/check-in/page.tsx` (to be created)

**Flow:**
```
1. Select Customer
   ↓
2. Get Current Location
   ↓
3. Validate with Backend
   ↓
4. Show Result:
   ✅ OK - ระยะ 50m (อนุญาต)
   ⚠️ Warning - ระยะ 300m (อนุญาตแต่แจ้งเตือน)
   ❌ Denied - ระยะ 600m (ไม่อนุญาต)
   ↓
5. Proceed to Check-in Form
```

---

## Phase 8: Location Management & Utilities 🛠️

### 8.1 Bulk Location Update
**Feature:** อัปเดต location หลายลูกค้าพร้อมกัน (สำหรับ admin)

**File:** `frontend/src/app/customers/bulk-location-update/page.tsx`

**Methods:**
- Upload CSV with addresses → Geocode all
- Import from Google Maps (if have existing data)

### 8.2 Location Quality Report
**Feature:** รายงานคุณภาพข้อมูล location

**Metrics:**
- จำนวนลูกค้าที่มี location: X / Y (Z%)
- จำนวนลูกค้าที่ไม่มี location
- Location accuracy distribution

### 8.3 Location History (Future)
**Feature:** บันทึกประวัติการเปลี่ยนแปลง location

**Table:** `customer_location_history`
- old_lat, old_lng
- new_lat, new_lng
- changed_by, changed_at
- reason

---

## 🧪 Testing Plan

### Unit Tests:
- [ ] `calculateDistance()` - test with known coordinates
- [ ] `isWithinRadius()` - test edge cases
- [ ] Geocoding service - mock API responses
- [ ] Check-in validation logic

### Integration Tests:
- [ ] Create customer with location
- [ ] Update customer location
- [ ] Check-in validation (within/outside radius)

### Manual Tests:
- [ ] Test on mobile browser (Android/iOS)
- [ ] Test GPS permission flows
- [ ] Test in different locations
- [ ] Test with/without internet
- [ ] Test geocoding with Thai addresses

---

## 📊 Success Metrics

### Phase Completion:
- [ ] Phase 1: Basic map component working
- [ ] Phase 2: Current location works on mobile
- [ ] Phase 3: Geocoding returns accurate results
- [ ] Phase 4: Interactive map picker working
- [ ] Phase 5: Customer forms updated
- [ ] Phase 6: Location display working
- [ ] Phase 7: Check-in validation working

### Business Metrics:
- % of customers with location data > 80%
- Check-in accuracy rate > 95%
- GPS accuracy < 50m for 90% of check-ins

---

## ⚠️ Important Notes

### Rate Limiting (Nominatim):
- Max 1 request per second
- Must include User-Agent header
- Consider caching results
- Fallback to manual input if quota exceeded

### Mobile Considerations:
- Request location permission properly
- Handle permission denied gracefully
- Show accuracy indicator
- Battery usage optimization

### Privacy & Security:
- Only store necessary location data
- Inform users why location is needed
- Allow users to skip location (optional)
- Comply with privacy laws

---

## 🚀 Deployment Checklist

### Before Deploy:
- [ ] All tests passing
- [ ] Test on production-like environment
- [ ] Check mobile browser compatibility
- [ ] Verify Nominatim API rate limits
- [ ] Prepare user documentation

### After Deploy:
- [ ] Monitor Nominatim API usage
- [ ] Monitor GPS accuracy metrics
- [ ] Collect user feedback
- [ ] Fix bugs reported

---

## 📚 Resources

### Documentation:
- Leaflet.js: https://leafletjs.com/
- React Leaflet: https://react-leaflet.js.org/
- Nominatim API: https://nominatim.org/release-docs/latest/api/Search/
- OpenStreetMap: https://www.openstreetmap.org/

### Example Code:
- Leaflet + Next.js: https://github.com/colbyfayock/next-leaflet-starter
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

---

## 🎯 Next Steps

1. **Review this plan** with team
2. **Estimate time** for each phase
3. **Start with Phase 1** - Basic map setup
4. **Test incrementally** after each phase
5. **Deploy progressively** - beta test first

---

**Questions or Concerns?**
Contact: Development Team
Last Updated: 2025-12-04
