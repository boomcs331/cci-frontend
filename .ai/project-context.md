# Project Context — CCI Frontend

## ภาพรวมโปรเจค

CCI Frontend คือระบบ **Admin Dashboard สำหรับควบคุมการผลิต (Production Control)** ในโรงงานอุตสาหกรรม สร้างด้วย Next.js 16 App Router

- **ชื่อโปรเจค**: CCI Production Control Admin Dashboard
- **เวอร์ชัน**: 2.2.1
- **Package Manager**: pnpm
- **Dev Port**: 3000
- **Backend Port**: 3006

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.0.7 (App Router) |
| UI | React 19.2.0, TypeScript 5.x |
| Styling | TailwindCSS 4.1.17, Material UI 6.3.1 |
| Charts | ApexCharts 4.7.0 |
| Calendar | FullCalendar 6.1.19 |
| PDF | jsPDF 2.5.2, jsPDF-autotable 3.8.4 |
| QR Code | qrcode 1.5.4 |
| Excel | xlsx 0.18.5 |
| Drag & Drop | react-dnd 16.0.1 |
| Testing | Playwright 1.59.1 (E2E) |
| API Mocking | MSW 2.13.2 |

### Backend (Integrated via Proxy)
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Message Queue**: RabbitMQ

---

## สถาปัตยกรรม Backend Proxy

Next.js rewrites ทุก API request ไปยัง backend:

```
/api/*      → http://127.0.0.1:3006/*
/uploads/*  → http://127.0.0.1:3006/uploads/*
```

Environment variables ที่ใช้:
```env
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
BACKEND_INTERNAL_URL=http://127.0.0.1:3006
```

---

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── (admin)/               # Admin dashboard (ต้อง login)
│   │   ├── layout.tsx         # Admin layout + useSessionCheck
│   │   ├── page.tsx           # Dashboard homepage
│   │   ├── pc/                # Production Control module
│   │   ├── production/        # Production management
│   │   ├── master-data/       # Master data management
│   │   ├── sales/             # Sales management
│   │   ├── sales-planning/    # Sales planning
│   │   ├── users/             # User management
│   │   ├── balances/          # Balances
│   │   └── session/           # Session info page
│   ├── (full-width-pages)/    # หน้าไม่มี sidebar (signin, etc.)
│   ├── ai/                    # AI chat page
│   └── layout.tsx             # Root layout
├── components/
│   ├── pc/                    # PC-specific components
│   ├── production/            # Production components
│   ├── inventory/             # Inventory components
│   ├── shared/                # Shared components (PageContainer, DataTable, etc.)
│   ├── auth/                  # Auth components (SignInForm)
│   ├── qr/                    # QR code components
│   └── ui/                    # Base UI components
├── services/                  # API service layer
│   ├── authService.ts
│   ├── authRbacService.ts
│   ├── materialService.ts
│   ├── receivingService.ts
│   ├── productionOrdersService.ts
│   ├── productionProcessesService.ts
│   ├── productionPlanQrService.ts
│   ├── productFgLotService.ts
│   ├── productProductionStepsService.ts
│   └── sales/                 # Sales services
├── types/                     # TypeScript types
│   ├── api.ts                 # ApiResponse, PaginatedResponse
│   ├── common.ts              # Common UI types
│   ├── material.ts            # Material, Location, Supplier
│   ├── receiving.ts           # Receiving, Lot
│   ├── user.ts                # User, Role, Permission, MenuItem
│   └── production.ts          # Production types
├── constants/                 # Application constants
│   ├── status.ts              # Status constants & helpers
│   ├── routes.ts              # App routes
│   └── permissions.ts         # Permission constants
├── hooks/                     # Custom React hooks
│   ├── useSessionCheck.ts     # Auth guard + session polling
│   ├── useModal.ts
│   └── useGoBack.ts
├── utils/                     # Utility functions
│   ├── api.ts                 # apiFetch, apiFetchJson, getApiUrl
│   ├── session.ts             # getSession, setSession, clearSession
│   ├── accessControl.ts       # RBAC access control
│   └── ...
├── context/                   # React Context providers
│   ├── ThemeContext.tsx
│   ├── SidebarContext.tsx
│   ├── ToastContext.tsx        # publishToast()
│   ├── PageTitleContext.tsx
│   └── AdminOverlayContext.tsx
├── layout/
│   ├── AppHeader.tsx
│   ├── AppSidebar.tsx
│   └── Backdrop.tsx
└── mocks/                     # MSW API mocks (dev)
```

---

## โมดูลหลัก

### Production Control (PC) — `src/app/(admin)/pc/`
| หน้า | Path | คำอธิบาย |
|------|------|---------|
| Dashboard | `/pc` | ภาพรวม PC |
| Income | `/pc/income` | รับวัตถุดิบ + สร้าง QR Code |
| Outcome | `/pc/outcome` | จ่ายวัตถุดิบ |
| Schedule | `/pc/schedule` | ตารางการผลิต |
| Report | `/pc/report` | รายงานการผลิต |
| Stock | `/pc/stock` | สต็อกวัตถุดิบ |
| Reservations | `/pc/reservations` | การจองวัตถุดิบ |
| Traceability | `/pc/traceability` | ติดตาม lot |
| Production Tracking | `/pc/production-tracking` | ติดตามการผลิต |
| Production Step Scan | `/pc/production-step-scan` | สแกนขั้นตอน |

### Production Management — `src/app/(admin)/production/`
| หน้า | คำอธิบาย |
|------|---------|
| Production Orders | สร้าง/ติดตามคำสั่งผลิต |
| Products | จัดการสินค้า |
| BOM | Bill of Materials |
| Production Steps | ขั้นตอนการผลิต |
| Lot Trace Report | รายงานสอบกลับ |
| FG Lot Trace | รายงาน FG |
| Product Stock | สต็อกสินค้า |
| Dept Step Scan | สแกนแผนก |

### Master Data — `src/app/(admin)/master-data/`
- Materials, Material Types, Locations
- Suppliers, Customers
- Models, Units, Product Types
- Process Lines, Production Processes, Production Steps
- Delivery Types, Loading Points

### Sales — `src/app/(admin)/sales/`
- Orders, Products, Customers
- Approvals, Reports, Import
- Dashboard

### User Management — `src/app/(admin)/users/`
- Users, Roles, Permissions
- Departments, Menus
- Role-Permissions

---

## Authentication & Session

### Flow
1. Login → `POST /auth/login` → ได้ JWT token + user info
2. `setSession()` บันทึกลง localStorage พร้อม expiry 1 ชั่วโมง
3. `useSessionCheck` hook ใน admin layout ตรวจสอบทุก 10 วินาที
4. Session หมดอายุ → redirect `/signin`
5. Multi-department user → redirect `/select-department`

### Session Utilities (`src/utils/session.ts`)
```typescript
getSession()              // ดึง session + ตรวจ expiry
setSession(data)          // บันทึก session (ระวัง: trigger re-render)
clearSession()            // ลบ session
isSessionValid()          // ตรวจว่ายังใช้ได้
needsDepartmentSelection() // ต้องเลือกแผนก?
getUserPermissions()      // permissions ของ user
isAdmin()                 // เป็น admin?
getUserDepartmentCode()   // department code ปัจจุบัน
```

---

## API Utilities (`src/utils/api.ts`)

```typescript
apiFetch(endpoint, options)       // fetch wrapper + auth headers อัตโนมัติ
apiFetchJson<T>(endpoint, options) // fetch + parse JSON
getApiUrl(endpoint)               // สร้าง full URL
```

- แนบ session headers อัตโนมัติ: `x-user-id`, `x-username`, `x-department-id`, `Authorization: Bearer`
- Auto-logout เมื่อได้ 401
- Toast notification เมื่อได้ 403
- Request timeout handling

---

## RBAC & Access Control

ไฟล์: `src/utils/accessControl.ts`
- Permission-based routing
- Department-based access
- `getRouteAccessPolicy(pathname)` — นโยบายการเข้าถึงตาม route
- `canAccessPolicy(policy, context, pathname)` — ตรวจว่า user เข้าได้?

---

## Scripts

```bash
pnpm dev           # Development server (localhost:3000)
pnpm dev:lan       # Dev server เปิด LAN (0.0.0.0)
pnpm build         # Production build
pnpm start         # Production server
pnpm start:lan     # Production server เปิด LAN
pnpm lint          # ESLint
pnpm test:e2e      # Playwright E2E tests
pnpm routes:gen    # Generate inventory routes
```

---

## Known Issues & Fixes

| ปัญหา | ไฟล์ | สถานะ |
|------|------|------|
| Infinite refresh loop | `src/hooks/useSessionCheck.ts` | ✅ Fixed — ตรวจสอบ menu changes ก่อน setSession |
| Direct localStorage access แทน getSession() | `src/app/(admin)/pc/page.tsx`, `pc/outcome/page.tsx` | ⚠️ Pending |
| Local ApiResponse interfaces (ควร import จาก `@/types/api`) | master-data pages | ⚠️ Pending |
| Inconsistent service pattern | `productionOrdersService.ts` | ⚠️ Pending |

---

## Duplicated Logic (รอ Refactor)

1. **URLSearchParams pagination pattern** — ซ้ำใน `materialService.ts` และ `receivingService.ts`
2. **POST headers** — `method: 'POST', headers: { 'Content-Type': 'application/json' }` ซ้ำ 20+ จุด
3. **Session parsing** — manual `localStorage.getItem('session')` ใน `pc/page.tsx`, `pc/outcome/page.tsx`
4. **Local ApiResponse interface** — ซ้ำใน 6 master-data pages แทนที่จะ import จาก `@/types/api`

---

## Path Aliases

```json
"@/*" → "./src/*"
```

ตัวอย่าง:
```typescript
import { apiFetch } from '@/utils/api';
import type { Material } from '@/types/material';
import { materialService } from '@/services';
```

---

## Important Files

| ไฟล์ | คำอธิบาย |
|-----|---------|
| `src/utils/api.ts` | API fetch wrapper หลัก |
| `src/utils/session.ts` | Session management ทั้งหมด |
| `src/utils/accessControl.ts` | RBAC logic |
| `src/hooks/useSessionCheck.ts` | Auth guard hook |
| `src/app/(admin)/layout.tsx` | Admin layout + session guard |
| `next.config.ts` | Backend proxy rewrites |
| `.env.local` | Environment variables |
| `src/components/shared/` | Shared components (DataTable, PageContainer, etc.) |
