# UI/UX Design Guidelines — MTIS

## 1. Theme Tokens

Source of truth: `theme-tokens.css` (510 lines, 25 sections).

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2153aa` | Buttons, active states, links |
| Primary hover | `#1a3f8a` | Button hover |
| Primary light | `#eff8ff` | Table row hover, active sidebar bg |
| Sidebar width | `260px` | Fixed left sidebar |
| Font | `Averta, -apple-system, ...` | All text |
| Body bg | `#f4f4f5` | Page background |
| Border | `#e5e7eb` | Cards, table borders |
| Danger | `#dc2626` | Delete, errors |
| Success | `#059669` | Active status |
| Warning | `#d97706` | Maintenance status |

## 2. Layout Pattern

```
┌──────────┬──────────────────────────────────────┐
│  Logo    │  Header (project name + user info)   │
│  (MT)    │                                      │
├──────────┼──────────────────────────────────────┤
│ Sidebar  │  Content area                        │
│ (260px)  │  - Breadcrumb                        │
│  Menu /  │  - Page title                        │
│  Tree    │  - Stats row (4 cards)               │
│  Filter  │  - Card(s) with table/form           │
│          │  - Detail panels                     │
├──────────┼──────────────────────────────────────┤
│  Footer  │  Cục Hàng hải Việt Nam — v1.0        │
└──────────┴──────────────────────────────────────┘
```

## 3. Component Catalog

### Sidebar
- Width: 260px, white bg, fixed position
- Logo: gradient (#2153aa → #1a3f8a), "MT" text
- Menu items: 44px height, 20px padding, 3px left border on active
- Sections: uppercase, 11px, muted color
- Tree widget: toggle ▶, indent levels 20px each (l0→l3)

### Header
- Content area, project name bold, user avatar in top-right (36px circle)
- Breadcrumb below header: `Trang chủ › Module › Screen`

### Cards
- Border-radius: 8px, shadow: 0 1px 3px rgba(0,0,0,0.06)
- Header: flex row with title + action buttons
- Padding: 16px

### Tables (.ant-table)
- Clean border design, header bg #fafafa
- Row hover: #eff8ff
- Pagination: centered with page buttons
- Badge inside table: blue (type), green (active), yellow (maintenance), red (stopped)

### Forms
- Search bar: input + select + button, max-width 360px
- Form groups: stacked layout
- Required fields: red asterisk
- Grid-2 for form pairs

### Buttons
- `.btn-primary`: #2153aa, white text, radius 6px
- `.btn-outline`: white bg, #d1d5db border
- `.btn-ghost`: no border, for icon actions
- `.btn-sm`: compact variant for tables
- `.btn-danger`: #dc2626 for delete actions

### Badges
- `.badge-green`: active status
- `.badge-yellow`: maintenance / pending
- `.badge-red`: stopped / error
- `.badge-blue`: type labels

## 4. KCHT Data Hierarchy (from DD Database)

```
KCHT_CB.NHOM=CB (Cảng biển)
  ├── NHOM=BC (Bến cảng) → FK_CANG_BIEN
  │     └── NHOM=CC (Cầu cảng) → FK_BEN_CANG
  ├── NHOM=BP (Bến phao) → FK_CANG_BIEN
  ├── NHOM=LHH (Luồng hàng hải) → FK_CANG_BIEN
  ├── NHOM=ND (Khu neo đậu) → FK_CANG_BIEN
  └── NHOM=TTB (Trang thiết bị) → FK_CANG_BIEN

KCHT_ATHH.NHOM=DBNT (Đèn biển) → FK_CANG_BIEN, FK_LUONG_HH
KCHT_ATHH.NHOM = NT, VTS, RADAR, AIS, CCTV, DK...
```

## 5. Vietnamese Language Rules

- **ALL labels, menus, buttons, error messages: Vietnamese only**
- NO Chinese characters anywhere in the UI
- Date format: DD/MM/YYYY (not MM/DD)
- Number format: 1.000,00 (dot for thousands, comma for decimals)
- Unit names: "hải lý" (NM), "m" (meter), "ha" (hectare)

## 6. Map / GIS Rules

- Leaflet 1.9.4 (free, open-source, no API key needed)
- Basemap: CartoDB Positron No Labels (no Chinese text)
- Alternative: Esri World Imagery (satellite, no text)
- ENC overlay: NOAA tiles (placeholder — replace with VMS-N/VMS-S in production)
- **Hoàng Sa and Trường Sa: must appear as Vietnamese territory** — red polygon + label "HOÀNG SA — VIỆT NAM" / "TRƯỜNG SA — VIỆT NAM"

## 7. Self-Contained HTML Rules

- Each UI file must open directly in browser (no build step)
- All CSS inline in `<style>` tags (import theme-tokens.css variables)
- CDN scripts only when necessary: Leaflet, Chart.js
- Mock data is realistic: real Vietnamese port names, valid coordinates, authentic unit names

## 8. Khi thêm module mới (checklist)

- [ ] Theme tokens từ theme-tokens.css đã import?
- [ ] Sidebar layout (260px, logo, menu) đã dùng?
- [ ] All labels đã Vietnamese?
- [ ] Không có Chinese characters?
- [ ] Self-contained? (open trực tiếp browser được)
- [ ] Mock data dùng tên cảng/tọa độ thật?
- [ ] Badge colors đúng semantic?
- [ ] Nếu có bản đồ → CartoDB no-labels + Hoàng Sa/Trường Sa?
