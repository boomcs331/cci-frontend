# Coding Rules — CCI Frontend

กฎและมาตรฐานการเขียนโค้ดสำหรับโปรเจค CCI Frontend  
**ต้องปฏิบัติตามทุกข้อเมื่อเขียนหรือแก้ไขโค้ด**

---

## 1. General

- ภาษา: **TypeScript strict mode** — ห้ามใช้ `any` โดยไม่จำเป็น
- ไม่ใช้ `// eslint-disable` เว้นแต่มีเหตุผลชัดเจน
- ทุกไฟล์ Client Component ต้องขึ้นต้นด้วย `"use client";`
- ใช้ `import type` สำหรับ TypeScript types เสมอ
- Path alias `@/*` แทน relative path ที่ลึกกว่า 1 ระดับ

```typescript
// ✅
import type { Material } from '@/types/material';
import { apiFetch } from '@/utils/api';

// ❌
import type { Material } from '../../../types/material';
```

---

## 2. API Calls

### ใช้ apiFetch / apiFetchJson เสมอ — ห้าม fetch() โดยตรง

```typescript
// ✅ ถูกต้อง
import { apiFetch, apiFetchJson } from '@/utils/api';

const res = await apiFetch('/masters/suppliers');
const data = await apiFetchJson<ApiResponse<Supplier[]>>('/masters/suppliers');

// ❌ ห้าม
const res = await fetch('http://localhost:3006/masters/suppliers');
const res = await fetch(getApiUrl('/masters/suppliers'));
```

### ใช้ Service Layer สำหรับ CRUD ที่ซับซ้อน

```typescript
// ✅ ถูกต้อง — ใช้ service
import { materialService } from '@/services';
const materials = await materialService.getAll();

// ❌ ไม่ดี — inline API call ใน component
const res = await apiFetch('/materials/all');
const data = await res.json();
```

### POST / PUT / DELETE Request

```typescript
// ✅ ถูกต้อง
const res = await apiFetch('/masters/suppliers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// ตรวจ response.ok เสมอ
if (!res.ok) {
  throw new Error(`Request failed: ${res.status}`);
}
```

### Error Handling

```typescript
// ✅ ต้องมี try/catch ทุก async call
try {
  const data = await apiFetchJson<ApiResponse<Supplier>>('/masters/suppliers/1');
  // use data
} catch (err) {
  setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
} finally {
  setLoading(false);
}
```

---

## 3. Session Management

### ใช้ utility functions จาก `@/utils/session` เสมอ

```typescript
// ✅ ถูกต้อง
import { getSession, clearSession, isSessionValid } from '@/utils/session';

const session = getSession();
if (session?.user?.username) {
  setCurrentUser(session.user.username);
}

// ❌ ห้าม — direct localStorage access
const session = localStorage.getItem('session');
const parsed = JSON.parse(session);
```

### ระวัง setSession() — ก่อเกิด re-render

`setSession()` dispatch `SESSION_UPDATED_EVENT` → trigger re-render  
ต้องตรวจสอบว่าข้อมูลเปลี่ยนจริงก่อนเรียก

```typescript
// ✅ ถูกต้อง — ตรวจก่อน
const menusChanged = JSON.stringify(session.menus) !== JSON.stringify(newMenus);
if (menusChanged) {
  setSession({ ...session, menus: newMenus });
}

// ❌ อันตราย — อาจ loop
setSession({ ...session, menus: newMenus }); // ทุก render
```

---

## 4. TypeScript Types

### import types จาก `@/types/*` — ห้ามนิยาม interface ซ้ำใน component

```typescript
// ✅ ถูกต้อง
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Material, MaterialFilters } from '@/types/material';
import type { User } from '@/types/user';

// ❌ ห้าม — ซ้ำกับ @/types/api
interface ApiResponse {
  data: Supplier[];
  pagination: { ... };
}
```

### ห้ามใช้ `any` — ใช้ `unknown` หรือ type จริง

```typescript
// ✅
const data = (await response.json()) as { menus?: MenuItem[] };

// ❌
const data: any = await response.json();
```

---

## 5. Constants

### ใช้ constants จาก `@/constants/*` เสมอ

```typescript
// ✅ ถูกต้อง
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';

requiredPermissions: [PERMISSIONS.INBOUND_CREATE, PERMISSIONS.INBOUND_READ]
router.push(ROUTES.PC_INCOME);

// ❌ ห้าม — hardcode string
requiredPermissions: ['inbound.create', 'inbound.read']
router.push('/pc/income');
```

---

## 6. Components

### ใช้ Shared Components จาก `@/components/shared`

```typescript
// ✅ ถูกต้อง
import {
  PageContainer,
  PageHeader,
  ContentCard,
  DataTable,
  ActionButton,
  BaseModal,
  ConfirmModal,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  type Column,
} from '@/components/shared';

// ❌ ห้าม — สร้าง loading/error UI ซ้ำเอง
if (loading) return <div className="flex justify-center">Loading...</div>;
```

### Loading / Error States

```typescript
// ✅
if (loading) return <LoadingState />;
if (error) return <ErrorState message={error} />;
if (!data.length) return <EmptyState message="ไม่มีข้อมูล" />;
```

### Column Definition สำหรับ DataTable

```typescript
// ✅
const columns: Column<Supplier>[] = [
  { key: 'code', title: 'รหัส', width: '150px' },
  { key: 'name', title: 'ชื่อ' },
  {
    key: 'create_date',
    title: 'วันที่สร้าง',
    render: (value) =>
      value ? new Date(value).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
      }) : '-',
  },
];
```

---

## 7. Page Structure Pattern

ทุกหน้าใน `(admin)` ต้องใช้โครงสร้างนี้:

```typescript
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageContainer, PageHeader, ContentCard, DataTable,
  LoadingState, ErrorState, EmptyState,
  ActionButton, BaseModal, ConfirmModal,
  type Column,
} from "@/components/shared";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API call
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <PageContainer>
      <PageHeader title="..." />
      <ContentCard>
        <DataTable columns={columns} data={data} />
      </ContentCard>
      <PaginationFooter ... />
    </PageContainer>
  );
}

// Wrap ด้วย Suspense สำหรับ useSearchParams
export default function Page() {
  return (
    <React.Suspense>
      <PageContent />
    </React.Suspense>
  );
}
```

---

## 8. Service Layer

### ใช้ Object Pattern เสมอ

```typescript
// ✅ ถูกต้อง — object pattern
export const supplierService = {
  getPaginated: async (page = 1, limit = 10, filters?: SupplierFilters) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
    }
    return apiFetchJson<PaginatedResponse<Supplier>>(`/masters/suppliers?${params}`);
  },

  getById: async (id: number): Promise<Supplier> => {
    const res = await apiFetchJson<ApiResponse<Supplier>>(`/masters/suppliers/${id}`);
    return res.data!;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await apiFetchJson<ApiResponse<Supplier>>('/masters/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.data!;
  },
};

// ❌ ห้าม — function exports แยก (inconsistent pattern)
export async function fetchSuppliers() { ... }
export async function createSupplier() { ... }
```

---

## 9. RBAC & Permissions

### ตรวจสอบสิทธิ์ผ่าน utility functions เสมอ

```typescript
// ✅ ถูกต้อง
import { hasPermission, hasAnyPermission } from '@/constants/permissions';
import { getUserPermissions, isAdmin } from '@/utils/session';
import { PERMISSIONS } from '@/constants/permissions';

const permissions = getUserPermissions();
const canCreate = isAdmin() || hasPermission(permissions, PERMISSIONS.INBOUND_CREATE);
const canView = hasAnyPermission(permissions, [
  PERMISSIONS.INBOUND_READ,
  PERMISSIONS.INBOUND_CREATE,
]);

// ❌ ห้าม — string comparison โดยตรง
const canCreate = permissions.includes('inbound.create');
```

### Route Access Policy — เพิ่มใน `@/utils/accessControl.ts` เท่านั้น

```typescript
// ✅ เพิ่ม route policy ใน ROUTE_POLICIES array ใน accessControl.ts
{
  matcher: /^\/new-feature(\/|$)/,
  requiredPermissions: [PERMISSIONS.SOME_PERMISSION],
  allowedDepartments: ['PC', 'WE'],
}
```

---

## 10. Routing & Navigation

```typescript
// ✅ ถูกต้อง
import { ROUTES } from '@/constants/routes';
router.push(ROUTES.PC_INCOME);
router.push(ROUTES.SALES_ORDER_DETAIL(orderId));

// ❌ ห้าม
router.push('/pc/income');
router.push(`/sales/orders/${orderId}`);
```

---

## 11. useEffect Rules

### ใส่ dependency array เสมอ — ห้าม empty array ถ้ามี deps จริง

```typescript
// ✅ ถูกต้อง
useEffect(() => {
  void fetchData();
}, [fetchData]); // fetchData ต้อง useCallback

// ✅ empty array เมื่อ run once จริงๆ เท่านั้น
useEffect(() => {
  const session = getSession();
  setCurrentUser(session?.user?.username ?? '');
}, []);

// ❌ อันตราย — missing dependency
useEffect(() => {
  void fetchData();
}, []); // fetchData ไม่ใช่ useCallback และ deps เปลี่ยนได้
```

### useCallback สำหรับ async fetchers

```typescript
// ✅
const fetchData = useCallback(async () => {
  // ...
}, [page, limit, searchTerm]);

useEffect(() => {
  void fetchData();
}, [fetchData]);
```

---

## 12. Toast Notifications

```typescript
// ✅ ใช้ publishToast จาก ToastContext
import { publishToast } from '@/context/ToastContext';

publishToast({ variant: 'success', title: 'บันทึกสำเร็จ' });
publishToast({ variant: 'error',   title: 'เกิดข้อผิดพลาด', message: err.message });
publishToast({ variant: 'warning', title: 'คำเตือน',        message: 'กรุณาตรวจสอบข้อมูล' });
publishToast({ variant: 'info',    title: 'ข้อมูล',          message: 'กำลังประมวลผล' });

// ❌ ห้าม
alert('บันทึกสำเร็จ');
console.log('error occurred');
```

---

## 13. Naming Conventions

| ประเภท | Convention | ตัวอย่าง |
|--------|-----------|---------|
| Component | PascalCase | `SupplierModal`, `ProductionLotCard` |
| Hook | camelCase + use prefix | `useSessionCheck`, `useModal` |
| Service | camelCase + Service suffix | `materialService`, `authService` |
| Utility function | camelCase | `getSession`, `buildQueryParams` |
| Type/Interface | PascalCase | `Material`, `ApiResponse<T>` |
| Constant | SCREAMING_SNAKE_CASE | `PERMISSIONS`, `ROUTES`, `SESSION_TIMEOUT` |
| File (component) | PascalCase | `SupplierPage.tsx`, `DataTable.tsx` |
| File (util/service/hook) | camelCase | `session.ts`, `materialService.ts` |
| Boolean state | is/has/can prefix | `isLoading`, `hasError`, `canEdit` |
| Page file | `page.tsx` (Next.js convention) | |

---

## 14. Anti-Patterns (ห้ามทำ)

```typescript
// ❌ 1. ห้าม hardcode URL
fetch('http://localhost:3006/api/materials')

// ❌ 2. ห้าม direct localStorage session access
const s = localStorage.getItem('session');
const parsed = JSON.parse(s);

// ❌ 3. ห้าม local ApiResponse interface ซ้ำ
interface ApiResponse { data: any; }  // ใช้ @/types/api แทน

// ❌ 4. ห้าม hardcode permission string
permissions.includes('inbound.create')  // ใช้ PERMISSIONS.INBOUND_CREATE แทน

// ❌ 5. ห้าม hardcode route string
router.push('/pc/income')  // ใช้ ROUTES.PC_INCOME แทน

// ❌ 6. ห้าม setSession โดยไม่ตรวจว่าข้อมูลเปลี่ยน
setSession({ ...session, menus: newMenus });  // อาจ loop

// ❌ 7. ห้าม any type
const data: any = await res.json();

// ❌ 8. ห้ามสร้าง Loading/Error UI เอง
if (loading) return <div>Loading...</div>;  // ใช้ <LoadingState /> แทน

// ❌ 9. ห้าม inline API call ที่ซับซ้อนใน component (ใช้ service แทน)
const res = await apiFetch('/materials/all');
const data = await res.json();
setMaterials(data.data || []);
```

---

## 15. File Organization

```
สร้าง component ใหม่ → ไปที่ไหน?
├── ใช้ใน module เดียว (PC)     → src/components/pc/
├── ใช้หลาย module              → src/components/shared/
├── เกี่ยวกับ Production         → src/components/production/
├── เกี่ยวกับ Sales              → src/components/sales/  (ถ้ามี)
└── Base UI primitive            → src/components/ui/

สร้าง service ใหม่ → src/services/<name>Service.ts
สร้าง type ใหม่   → src/types/<domain>.ts
สร้าง constant    → src/constants/<name>.ts
สร้าง hook ใหม่   → src/hooks/use<Name>.ts
สร้าง utility     → src/utils/<name>.ts
```

---

## 16. Checklist ก่อน Commit

- [ ] ไม่มี `any` type ที่ไม่จำเป็น
- [ ] ไม่มี hardcoded URL / route string / permission string
- [ ] ไม่มี direct `localStorage.getItem('session')`
- [ ] ทุก API call ใช้ `apiFetch` / `apiFetchJson`
- [ ] มี `try/catch/finally` ทุก async call
- [ ] ใช้ shared components (LoadingState, ErrorState, EmptyState)
- [ ] `useEffect` มี dependency array ถูกต้อง
- [ ] Import types ด้วย `import type`
- [ ] ไม่นิยาม `interface ApiResponse` ซ้ำใน component
- [ ] Toast notification ใช้ `publishToast()` ไม่ใช่ `alert()`
