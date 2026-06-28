# Architecture — CCI Frontend

## 1. ภาพรวมสถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   React 19 + Next.js 16 (App Router)                   │
│   TailwindCSS + Material UI                             │
└────────────────────┬────────────────────────────────────┘
                     │  /api/* และ /uploads/*
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Reverse Proxy                       │
│              next.config.ts → rewrites                  │
└────────────────────┬────────────────────────────────────┘
                     │  http://127.0.0.1:3006
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   NestJS Backend                         │
│                                                         │
│   REST API  ←→  PostgreSQL                              │
│                 RabbitMQ (Message Queue)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Next.js App Router — Route Groups

```
src/app/
├── layout.tsx                  ← Root layout (font, ThemeProvider, SidebarProvider, MswLoader)
│
├── (admin)/                    ← Route group ที่ต้อง login
│   ├── layout.tsx              ← AdminLayout (ToastProvider, useSessionCheck)
│   ├── page.tsx                ← Dashboard /
│   ├── pc/                     ← /pc/*
│   ├── production/             ← /production/*
│   ├── master-data/            ← /master-data/*  (admin only)
│   ├── sales/                  ← /sales/*
│   ├── sales-planning/         ← /sales-planning/*
│   ├── users/                  ← /users/*  (admin only)
│   ├── balances/               ← /balances/*
│   └── session/                ← /session
│
├── (full-width-pages)/         ← หน้าไม่มี sidebar
│   ├── (auth)/
│   │   ├── signin/             ← /signin
│   │   ├── signup/             ← /signup
│   │   └── select-department/  ← /select-department
│   └── ...
│
└── ai/                         ← /ai/chat
```

---

## 3. Backend Proxy (next.config.ts)

```typescript
// Browser → Next.js → Backend (same-origin, ไม่มี CORS)
{ source: "/api/:path*",     destination: "http://127.0.0.1:3006/:path*" }
{ source: "/uploads/:path*", destination: "http://127.0.0.1:3006/uploads/:path*" }
```

**ทำไมต้อง proxy:**
- ใช้ Cloudflare Tunnel / TryCloudflare — tunnel เดียวสำหรับ frontend + backend
- ป้องกัน CORS ได้ทั้งหมด
- Backend port เปลี่ยนได้ผ่าน `BACKEND_INTERNAL_URL`

---

## 4. Layer Architecture (Frontend)

```
┌────────────────────────────────────────────┐
│  Pages  (src/app/)                         │  UI + data orchestration
├────────────────────────────────────────────┤
│  Components  (src/components/)             │  Reusable UI pieces
├────────────────────────────────────────────┤
│  Services  (src/services/)                 │  API call abstraction
├────────────────────────────────────────────┤
│  Utils  (src/utils/api.ts)                 │  HTTP + auth headers
├────────────────────────────────────────────┤
│  fetch() → Next.js Proxy → NestJS Backend  │  Network
└────────────────────────────────────────────┘
```

---

## 5. Authentication & Session Flow

### Login Flow
```
User กรอก username/password
        ↓
POST /auth/login (via apiFetch)
        ↓
Backend ส่ง { token, user, permissions, menus }
        ↓
setSession() → localStorage['session'] + expiresAt (+1hr)
        ↓
needsDepartmentSelection()?
    ├── Yes → redirect /select-department
    └── No  → redirect /  (Dashboard)
```

### Session Guard (useSessionCheck hook)
```
ทุก route ใน (admin) layout เรียก useSessionCheck()
        ↓
useEffect runs เมื่อ [router, pathname] เปลี่ยน
        ↓
getSession() → ตรวจ expiresAt
    ├── null / หมดอายุ → router.replace('/signin')
    ├── needsDepartmentSelection() → router.replace('/select-department')
    └── ตรวจ RBAC policy ของ route
            ├── ไม่มีสิทธิ์ → router.replace('/')
            └── OK → fetch /auth/menu (refresh menus ถ้าเปลี่ยน)

interval ทุก 10 วินาที → ตรวจ isSessionValid()
    └── หมดอายุ → router.replace('/signin')
```

### Session Data Structure
```typescript
SessionData {
  token?: string              // JWT Bearer token
  user?: SessionUser          // user info + roles + departments
  permissions?: string[]      // permission codes
  menus?: MenuItem[]          // sidebar menus (dynamic จาก backend)
  expiresAt?: number          // Date.now() + 3,600,000 (1hr)
  activeDepartmentId?: string // แผนกที่เลือก
  departmentChosen?: boolean  // ยืนยันแผนกแล้ว?
}
```

---

## 6. API Utility Layer (src/utils/api.ts)

### apiFetch() — Request Pipeline

```
apiFetch(endpoint, options)
        ↓
getApiUrl(endpoint)         // NEXT_PUBLIC_API_BASE_URL + endpoint
        ↓
applySessionAuthHeaders()   // แนบ headers จาก getSession()
  ├── x-user-id
  ├── x-username
  ├── x-department-id  (activeDepartmentId ?? user.departmentId)
  └── Authorization: Bearer <token>
        ↓
AbortController timeout (default 20s)
        ↓
fetch(url, { headers, signal, ...init })
        ↓
Response status check:
  ├── 401 → redirectToSignIn('expired')  [ยกเว้น AUTH_BYPASS_ENDPOINTS]
  ├── 403 → notifyForbiddenApiError() → Toast
  └── AbortError → Toast "คำขอนานเกินไป"
```

### apiFetchJson\<T\>() — JSON Wrapper
```
apiFetch()
    ↓
response.ok?
  ├── No  → extractApiErrorMessage() → throw ApiError(status, body)
  └── Yes → return body as T
```

---

## 7. RBAC & Access Control (src/utils/accessControl.ts)

### โครงสร้าง Policy

```typescript
AccessPolicy {
  requiredPermissions?: string[]   // permission codes ที่ต้องมี
  permissionMatch?: 'all' | 'any'  // ต้องมีทุกอัน หรือ อย่างน้อย 1
  allowedDepartments?: string[]    // รหัสแผนกที่เข้าได้ ['WE','PC','PD']
  adminOnly?: boolean              // เฉพาะ admin เท่านั้น
}
```

### Route Policy Map (ตัวอย่าง)

| Route Pattern | Required Permissions | Departments |
|---------------|---------------------|-------------|
| `/` | — (ทุกคนที่ login) | ทุกแผนก |
| `/users/*` | adminOnly | — |
| `/master-data/*` | adminOnly | — |
| `/pc/*` | MATERIAL_READ หรือ INBOUND_READ ฯลฯ | WE, PC, PD |
| `/pc/income/*` | INBOUND_CREATE หรือ INBOUND_READ | WE, PC, PD |
| `/pc/outcome/*` | OUTBOUND_CREATE หรือ OUTBOUND_READ | WE, PC, PD |
| `/sales/orders/*` | SALES_ORDER_READ หรือ SALES_ORDER_CREATE | ทุกแผนก |
| `/sales/approvals/*` | SALES_ORDER_APPROVE | ทุกแผนก |
| `/production/production-orders/*` | PRODUCTION_ORDER_READ | WE, PRESS, PD, PC |

### canAccessPolicy() Logic
```
isAdmin? → true (bypass ทั้งหมด)
adminOnly? → false
isPcModuleRoute? → ตรวจ userHasAssignedPcPermission
allowedDepartments? → ตรวจ departmentMatchesAnyUserDepartments
requiredPermissions?
  ├── permissionMatch='any' → .some()
  └── permissionMatch='all' → .every()
```

---

## 8. Context Providers (React)

```
RootLayout
  └── ThemeProvider (dark/light mode, localStorage)
      └── SidebarProvider (expanded/collapsed state)
          └── MswLoader (MSW dev mocking)
              └── AdminLayout
                  └── ToastProvider (global toast notifications)
                      └── AdminOverlayProvider (overlay counter)
                          └── PageTitleProvider (page title/description)
                              └── AdminLayoutContent
                                  ├── AppSidebar
                                  ├── AppHeader
                                  └── {children}
```

---

## 9. Service Layer Pattern

### Object Pattern (authService, materialService, receivingService)
```typescript
export const materialService = {
  getAll: async (): Promise<Material[]> => { ... },
  getPaginated: async (page, limit, filters?) => { ... },
  getById: async (id) => { ... },
  create: async (data) => { ... },
  update: async (id, data) => { ... },
  delete: async (id) => { ... },
};
```

### Function Pattern (productionOrdersService)
```typescript
export async function fetchProductionOrders(page, limit): Promise<...> { ... }
export async function fetchProductionOrder(id): Promise<...> { ... }
export async function startLotProcess(...): Promise<void> { ... }
```

> ⚠️ Inconsistency: ควรเลือก pattern เดียว (แนะนำ object pattern)

---

## 10. TypeScript Type Structure

```
src/types/
├── api.ts          ApiResponse<T>, PaginatedResponse<T>, Pagination
├── common.ts       AlertMessage, SelectOption, TableColumn<T>, ModalProps
├── material.ts     Material, ItemsName, MaterialType, Location, Supplier, MaterialFilters
├── receiving.ts    Receiving, Lot, CreateReceivingPayload, ReceivingFilters
├── user.ts         User, Role, Department, Permission, LoginCredentials, LoginResponse, MenuItem
├── production.ts   ProductionProcess, ProductionOrderLot, ProductionOrderDetail, ...
└── index.ts        barrel export
```

---

## 11. Multi-Department Support

```
User มี departments: [PC, WE, PD]
        ↓
Login → needsDepartmentSelection() = true
        ↓
redirect /select-department
        ↓
User เลือก PC
        ↓
confirmActiveDepartment('PC_id')
  └── setSession({ activeDepartmentId: 'PC_id', departmentChosen: true })
        ↓
apiFetch() แนบ x-department-id: 'PC_id' ทุก request
        ↓
Backend กรอง data ตาม department
```

---

## 12. Environment Variables

| Variable | ค่า Default | ใช้ที่ |
|----------|------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | `src/utils/api.ts` — base URL สำหรับทุก request |
| `NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT` | `/auth/login` | `src/services/authService.ts` |
| `BACKEND_INTERNAL_URL` | `http://127.0.0.1:3006` | `next.config.ts` — proxy destination |

---

## 13. Known Bugs & Fixes

| Bug | Root Cause | Fix | File |
|-----|-----------|-----|------|
| Infinite refresh loop | `setSession()` dispatch `SESSION_UPDATED_EVENT` → trigger re-render → useEffect → fetch menu → setSession อีกครั้ง | เปรียบเทียบ menus ก่อน setSession | `src/hooks/useSessionCheck.ts` |

---

## 14. Pending Refactors

| รายการ | ไฟล์ที่เกี่ยวข้อง | Priority |
|--------|-----------------|---------|
| ใช้ `getSession()` แทน `localStorage.getItem('session')` โดยตรง | `pc/page.tsx`, `pc/outcome/page.tsx` | 🔴 High |
| Import `ApiResponse` จาก `@/types/api` แทนนิยามซ้ำในแต่ละหน้า | master-data pages (6 ไฟล์) | 🟡 Medium |
| Unify service pattern เป็น object pattern | `productionOrdersService.ts` | 🟡 Medium |
| Extract `buildQueryParams(page, limit, filters)` utility | `materialService.ts`, `receivingService.ts` | 🟢 Low |
| Extract POST helper ลด `headers: { 'Content-Type': 'application/json' }` ซ้ำ 20+ จุด | services, pages | 🟢 Low |
