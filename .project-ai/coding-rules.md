# Coding Rules — CCI Frontend

## Mandatory AI Rules
- **Minimal changes only** — change only what is necessary to solve the task
- **Never break backward compatibility** — never change existing API endpoint paths or response shapes
- **Never remove existing code without reason** — comment out or add flag before removing
- **Preserve business logic** — do not refactor logic that is not part of the task
- **Prefer existing patterns** — always look for an existing pattern before creating a new one

---

## 1. TypeScript

- Strict mode always — **no `any`**, use `unknown` or proper types
- Use `import type` for all type-only imports
- Use `@/*` path alias (maps to `src/*`) — no relative paths deeper than 1 level

```typescript
// ✅
import type { Material } from '@/types/material';
import { apiFetch } from '@/utils/api';

// ❌
import type { Material } from '../../../types/material';
```

---

## 2. API Calls

**Always use `apiFetch` or `apiFetchJson` — never call `fetch()` directly.**

```typescript
import { apiFetch, apiFetchJson } from '@/utils/api';

// Read
const data = await apiFetchJson<ApiResponse<Material[]>>('/pc/materials');

// Mutate
const res = await apiFetch('/masters/suppliers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
if (!res.ok) throw new Error(`Failed: ${res.status}`);
```

Use the **service layer** for any CRUD beyond a single fetch:
```typescript
import { materialService } from '@/services';
const materials = await materialService.getAll();
```

---

## 3. Session

**Always use `@/utils/session` functions — never access `localStorage` directly.**

```typescript
import { getSession, clearSession, isSessionValid } from '@/utils/session';

// ✅
const session = getSession();
setCurrentUser(session?.user?.username ?? '');

// ❌
const raw = localStorage.getItem('session');
const parsed = JSON.parse(raw);
```

`setSession()` dispatches `SESSION_UPDATED_EVENT` → triggers re-render.
**Always compare before calling:**
```typescript
const changed = JSON.stringify(session.menus) !== JSON.stringify(newMenus);
if (changed) setSession({ ...session, menus: newMenus });
```

---

## 4. Types

Import from `@/types/*` — **never define `ApiResponse` locally** in a component/page.

```typescript
// ✅
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ❌
interface ApiResponse { data: any; success: boolean; } // local duplicate
```

---

## 5. Constants

```typescript
// ✅
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';

router.push(ROUTES.PC_INCOME);
if (hasPermission(perms, PERMISSIONS.INBOUND_CREATE)) { ... }

// ❌ hardcoded strings
router.push('/pc/income');
perms.includes('inbound.create');
```

---

## 6. Components

Use shared components — never re-implement generic UI:

```typescript
import {
  PageContainer, PageHeader, ContentCard, DataTable,
  LoadingState, ErrorState, EmptyState,
  ActionButton, BaseModal, ConfirmModal, StatusBadge,
  type Column,
} from '@/components/shared';

if (loading) return <LoadingState />;
if (error)   return <ErrorState message={error} />;
if (!data.length) return <EmptyState message="ไม่มีข้อมูล" />;
```

---

## 7. Services — Object Pattern

```typescript
// ✅ object pattern
export const supplierService = {
  getPaginated: async (page = 1, limit = 10) =>
    apiFetchJson<PaginatedResponse<Supplier>>(`/masters/suppliers?page=${page}&limit=${limit}`),
  create: async (data: Partial<Supplier>) =>
    apiFetchJson<ApiResponse<Supplier>>('/masters/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

// ❌ function pattern (inconsistent)
export async function fetchSuppliers() { ... }
```

---

## 8. RBAC

```typescript
import { PERMISSIONS, hasPermission, hasAnyPermission } from '@/constants/permissions';
import { getUserPermissions, isAdmin } from '@/utils/session';

const perms = getUserPermissions();
const canCreate = isAdmin() || hasPermission(perms, PERMISSIONS.INBOUND_CREATE);
```

New route access policies go in `src/utils/accessControl.ts` `ROUTE_POLICIES` array only.

---

## 9. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `SupplierModal` |
| Hook | `use` + camelCase | `useSessionCheck` |
| Service | camelCase + `Service` | `materialService` |
| Utility fn | camelCase | `getSession`, `buildQueryParams` |
| Type / Interface | PascalCase | `Material`, `ApiResponse<T>` |
| Constant | SCREAMING_SNAKE_CASE | `PERMISSIONS`, `ROUTES` |
| Boolean state | `is/has/can` prefix | `isLoading`, `canEdit` |
| Component file | PascalCase | `DataTable.tsx` |
| Util/service file | camelCase | `materialService.ts` |
| Page file | `page.tsx` | Next.js convention |

---

## 10. useEffect & useCallback

```typescript
// fetcher must be useCallback
const fetchData = useCallback(async () => {
  setLoading(true);
  try { /* ... */ } catch { /* ... */ } finally { setLoading(false); }
}, [page, limit]);

useEffect(() => { void fetchData(); }, [fetchData]);
```

---

## 11. Toast

```typescript
import { publishToast } from '@/context/ToastContext';
// variants: 'success' | 'error' | 'warning' | 'info'
publishToast({ variant: 'success', title: 'บันทึกสำเร็จ' });

// ❌
alert('บันทึกสำเร็จ');
```

---

## 12. HTTP Methods

Services use both `PUT` and `PATCH` — use what the existing service already uses:

| Pattern | When |
|---------|------|
| `PUT` | Full replacement (e.g. suppliers, product steps set) |
| `PATCH` | Partial update (e.g. production-processes, product-production-steps update) |

> ⚠️ Known violation: `src/services/productionPlanQrService.ts` uses raw `fetch(getApiUrl(...))` directly — this bypasses auth header injection. Do not replicate this pattern; it exists for historical reasons.

---

## 13. Dashboard Fetch

Use `dashboardFetch` (not `apiFetch`) for dashboard widgets that need silent permission skip:

```typescript
import { dashboardFetch } from '@/utils/dashboardFetch';
// Returns empty response silently if user lacks permission (no 403 toast)
const res = await dashboardFetch('/sales/dashboard/kpi', PERMISSIONS.SALES_ORDER_READ, {});
```

---

## 14. src/lib/ vs src/utils/

- `src/lib/pc/` — domain-specific business logic (PC field validation, error codes)
- `src/utils/` — cross-domain utilities (session, api, export, etc.)
- `@/utils/poNoValidation.ts` is deprecated — import from `@/lib/pc` instead

---

## 15. Page Template (Standard)

```typescript
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader, ContentCard, DataTable,
         LoadingState, ErrorState, EmptyState, type Column } from "@/components/shared";

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '10');
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { /* fetch */ } catch { setError('เกิดข้อผิดพลาด'); } finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <PageContainer>
      <PageHeader title="..." />
      <ContentCard><DataTable columns={columns} data={data} /></ContentCard>
    </PageContainer>
  );
}

export default function Page() {
  return <React.Suspense><PageContent /></React.Suspense>;
}
```

---

## 16. Anti-Patterns (Never Do)

```typescript
// ❌ direct fetch
fetch('http://localhost:3006/api/x')

// ❌ direct localStorage session
localStorage.getItem('session')

// ❌ local ApiResponse interface
interface ApiResponse { data: any }

// ❌ hardcoded permission string
perms.includes('inbound.create')

// ❌ hardcoded route
router.push('/pc/income')

// ❌ setSession without change check (causes infinite loop)
setSession({ ...session, menus: data.menus })

// ❌ any type
const x: any = await res.json()

// ❌ custom loading spinner
if (loading) return <div>Loading...</div>

// ❌ alert()
alert('error')
```

---

## 17. Pre-Commit Checklist
- [ ] No `any` types
- [ ] No hardcoded URLs, routes, or permission strings
- [ ] No direct `localStorage.getItem('session')`
- [ ] All API calls use `apiFetch` / `apiFetchJson`
- [ ] `try/catch/finally` on every async call
- [ ] Shared components used for loading/error/empty states
- [ ] `useEffect` has correct dependency array
- [ ] Types imported from `@/types/*`
- [ ] Toast uses `publishToast()`, not `alert()`
- [ ] New routes added to `ROUTES` constant and `accessControl.ts`
