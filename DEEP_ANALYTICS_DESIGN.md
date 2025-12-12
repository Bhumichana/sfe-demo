# 🎨 Deep Analytics UI/UX Design

## 📐 Layout Structure

### Page: `/analytics/executive`
**Access:** SM (Sales Manager), SD (Sales Director) only

---

## 🖼️ Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Executive Dashboard                        [Date Filter] │
│  Sales Analytics & Performance Overview                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  📈 Sales Funnel         │  │  🗺️ Territory Comparison │ │
│  │                          │  │                          │ │
│  │  Prospects: 500          │  │  ▓▓▓▓▓ BKK-01: 450      │ │
│  │  Leads: 250 (50%)        │  │  ▓▓▓▓  BKK-02: 380      │ │
│  │  Opportunities: 100(40%) │  │  ▓▓▓   CNX-01: 280      │ │
│  │  Wins: 35 (35%)          │  │  ▓▓    PKT-01: 220      │ │
│  │                          │  │  ▓▓▓   KKN-01: 310      │ │
│  │  Avg Deal Cycle: 14 days │  │                          │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  🎯 Customer Segmentation│  │  📊 Trend & Forecast     │ │
│  │                          │  │                          │ │
│  │      ╱───╲               │  │  600│    ╱─ Forecast    │ │
│  │     ╱  A  ╲ 24%          │  │  500├───●─── Actual     │ │
│  │    │   B   │ 36%         │  │  400│  ╱ - - Target    │ │
│  │     ╲  C  ╱ 40%          │  │  300│ ╱                 │ │
│  │      ╲───╱               │  │     └────────────────   │ │
│  │                          │  │      J F M A M J J A S  │ │
│  │  Total: 500 customers    │  │                          │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Layout (375x667)

```
┌─────────────────────┐
│  Executive Dashboard│
│  [Date Filter]      │
├─────────────────────┤
│                     │
│  📈 Sales Funnel    │
│  ┌───────────────┐  │
│  │ Prospects: 500│  │
│  │ Leads: 250    │  │
│  │ Opps: 100     │  │
│  │ Wins: 35      │  │
│  └───────────────┘  │
│                     │
│  🗺️ Territory       │
│  ┌───────────────┐  │
│  │ BKK-01: 450   │  │
│  │ BKK-02: 380   │  │
│  │ ...           │  │
│  └───────────────┘  │
│                     │
│  🎯 Segmentation    │
│  ┌───────────────┐  │
│  │  Donut Chart  │  │
│  └───────────────┘  │
│                     │
│  📊 Trend          │
│  ┌───────────────┐  │
│  │  Line Chart   │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

---

## 🎨 Color Scheme

### Primary Colors
- **Primary Blue:** `#3B82F6` - Headers, primary actions
- **Success Green:** `#10B981` - Positive metrics, wins
- **Warning Orange:** `#F59E0B` - Alerts, opportunities
- **Danger Red:** `#EF4444` - Losses, declines
- **Info Indigo:** `#6366F1` - Information, secondary actions

### Chart Colors
- **Segment A:** `#10B981` (Green - High value)
- **Segment B:** `#3B82F6` (Blue - Medium value)
- **Segment C:** `#6B7280` (Gray - Low value)

### Territory Colors
- Use gradient from `#3B82F6` (highest) to `#93C5FD` (lowest)

---

## 📊 Chart Specifications

### 1. Sales Funnel Chart
**Type:** Funnel/Bar Chart (Horizontal)
**Library:** Recharts `<BarChart>`
**Height:** 350px
**Features:**
- Show count and percentage for each stage
- Color gradient from top (dark) to bottom (light)
- Display conversion rates between stages
- Show avg deal cycle metric below

---

### 2. Territory Comparison Chart
**Type:** Horizontal Bar Chart
**Library:** Recharts `<BarChart>`
**Height:** 350px
**Features:**
- Sort by totalCalls (descending)
- Show territory code + name
- Display call count on bars
- Tooltip shows: calls, revenue, SR count
- Color based on performance

---

### 3. Customer Segmentation Chart
**Type:** Pie/Donut Chart
**Library:** Recharts `<PieChart>`
**Height:** 350px
**Features:**
- Show percentage for each segment
- Display total count in center (if donut)
- Legend showing: segment, count, revenue
- Colors: A=Green, B=Blue, C=Gray

---

### 4. Trend Analysis Chart
**Type:** Line Chart with Forecast
**Library:** Recharts `<LineChart>`
**Height:** 350px
**Features:**
- 3 lines: Actual (solid), Forecast (dashed), Target (dotted)
- X-axis: Month (Jan-Dec)
- Y-axis: Call count
- Forecast starts where actual ends
- Tooltip shows all 3 values
- Growth rate indicator

---

## 🔧 Component Structure

```
frontend/src/
├── app/
│   └── analytics/
│       └── executive/
│           └── page.tsx              # Main dashboard page
├── components/
│   └── analytics/
│       ├── SalesFunnelChart.tsx      # Funnel chart
│       ├── TerritoryComparisonChart.tsx
│       ├── CustomerSegmentationChart.tsx
│       └── TrendAnalysisChart.tsx
└── mocks/
    └── analytics-mock.ts             # Mock data (already created)
```

---

## 📋 Page Features

### Header
- Title: "Executive Dashboard"
- Subtitle: "Sales Analytics & Performance Overview"
- Date Range Filter (DatePicker)
- Export Button (optional, future)

### Filters
- **Date Range:** Default to current year
- **Apply Filter:** Refetch data with new dates
- **Reset Filter:** Back to default

### Loading States
- Show skeleton loaders for each chart section
- Disable filters during loading

### Empty States
- Show message if no data available
- Suggest checking filters or date range

---

## 🔐 Access Control

### Route Protection
```typescript
// Only SM and SD can access
const allowedRoles = ['SM', 'SD'];
if (!allowedRoles.includes(user.role)) {
  router.push('/');
  return;
}
```

### Navigation
- Add link in sidebar (only visible to SM/SD):
  - Icon: 📊 or Chart icon
  - Label: "Deep Analytics" or "Executive Dashboard"

---

## 📱 Responsive Design

### Breakpoints
- **Desktop:** >= 1024px (2x2 grid)
- **Tablet:** 768px - 1023px (2x1 grid)
- **Mobile:** < 768px (1 column stack)

### Grid Layout
```css
/* Desktop */
grid-template-columns: repeat(2, 1fr);
gap: 24px;

/* Tablet */
grid-template-columns: 1fr;
gap: 16px;

/* Mobile */
grid-template-columns: 1fr;
gap: 12px;
```

---

## ✅ Implementation Checklist

- [ ] Create chart components (Phase 2)
- [ ] Create dashboard page (Phase 3)
- [ ] Add route protection
- [ ] Implement date filters
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test on desktop
- [ ] Test on tablet
- [ ] Test on mobile
- [ ] Add navigation link

---

## 🎯 Success Criteria

1. ✅ All 4 charts display correctly
2. ✅ Data updates when date filter changes
3. ✅ Responsive on all screen sizes
4. ✅ Loading states work properly
5. ✅ Only SM/SD can access
6. ✅ No errors in console
7. ✅ Charts are interactive (hover, tooltips)
8. ✅ Performance is good (< 2s load time)

---

**Last Updated:** 2025-12-12
**Designer:** Claude
**Status:** 📋 Design Complete - Ready for Phase 2
