# Frontend Guide — CCI Frontend

---

## Component Structure

```
src/components/
├── shared/           ← Reusable across all modules (import from here first)
│   ├── layout/       PageContainer, PageHeader
│   ├── card/         ContentCard, InfoCard
│   ├── search/       SearchCard
│   ├── table/        DataTable, Column type
│   ├── form/         FormSection, FormField
│   ├── button/       ActionButton
│   ├── feedback/     LoadingState, ErrorState, EmptyState, StatusBadge
│   └── modal/        BaseModal, ConfirmModal
├── pc/               PC module components
├── production/       Production module components
├── inventory/        StockQuickCheckFab, inventory widgets
├── auth/             SignInForm, SignUpForm
├── pagination/       PaginationFooter
├── qr/               QR code display/print
└── ui/               Low-level base components (Button, Input, etc.)
```

---

## Shared Components Reference

### Layout

```tsx
<PageContainer>              // outer wrapper with padding
  <PageHeader
    title="ชื่อหน้า"
    description="คำอธิบาย" // optional
    actions={<ActionButton ...>}  // optional right slot
  />
  <ContentCard>              // white card body
    {children}
  </ContentCard>
</PageContainer>
```

### DataTable

```tsx
import { DataTable, type Column } from '@/components/shared';

const columns: Column<Supplier>[] = [
  { key: 'code',  title: 'รหัส', width: '120px' },
  { key: 'name',  title: 'ชื่อ' },
  {
    key: 'create_date',
    title: 'วันที่',
    render: (value) => value
      ? new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
      : '-',
  },
  {
    key: 'actions',
    title: 'จัดการ',
    render: (_, row) => (
      <div className="flex gap-2">
        <ActionButton variant="edit" onClick={() => handleEdit(row)} />
        <ActionButton variant="delete" onClick={() => handleDelete(row.id)} />
      </div>
    ),
  },
];

<DataTable columns={columns} data={items} />
```

### Feedback States

```tsx
if (loading) return <LoadingState />;
if (error)   return <ErrorState message={error} onRetry={fetchData} />;
if (!data.length) return <EmptyState message="ไม่พบข้อมูล" />;

// Status badge
<StatusBadge status="ACTIVE" />      // green
<StatusBadge status="USED_UP" />     // gray
<StatusBadge status="PARTIAL_USED" /> // yellow
```

### Modals

```tsx
// Base modal
<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="เพิ่มผู้จัดจำหน่าย"
>
  {/* form content */}
</BaseModal>

// Confirm modal
<ConfirmModal
  isOpen={!!deleteId}
  onClose={() => setDeleteId(null)}
  onConfirm={confirmDelete}
  type="danger"
  title="ยืนยันการลบ"
  message="ต้องการลบรายการนี้?"
/>
```

### ActionButton

```tsx
<ActionButton variant="primary"  label="บันทึก" onClick={handleSave} />
<ActionButton variant="edit"     onClick={() => handleEdit(row)} />
<ActionButton variant="delete"   onClick={() => handleDelete(id)} />
<ActionButton variant="secondary" label="ยกเลิก" onClick={handleCancel} />
```

---

## Layout System

### Root Layout
- Font: `Outfit` (Google Fonts)
- Providers: `ThemeProvider` → `SidebarProvider` → `MswLoader`

### Admin Layout (`src/app/(admin)/layout.tsx`)
- Contains `AppSidebar`, `AppHeader`, `Backdrop`
- Calls `useSessionCheck()` — authentication guard
- Sidebar margin: `lg:ml-[300px]` expanded / `lg:ml-[130px]` collapsed
- Positioned: sidebar `left-[20px]`, width `260px` / `90px`

### Full-Width Layout (`src/app/(full-width-pages)/`)
- No sidebar, no header
- Used for: signin, signup, select-department, error pages

---

## State Management

**No global state manager** (no Redux, no Zustand).  
State lives in:
1. **React `useState`** — local component state
2. **`localStorage['session']`** — auth session (via `src/utils/session.ts`)
3. **`localStorage['theme']`** — theme preference
4. **React Context** — shared UI state:
   - `ThemeContext` — dark/light
   - `SidebarContext` — sidebar expanded/hovered/mobile state
   - `ToastContext` — global toast queue
   - `PageTitleContext` — current page title
   - `AdminOverlayContext` — overlay/modal counter

---

## Form Patterns

```tsx
// Controlled form state
const [formData, setFormData] = useState({ code: '', name: '', email: '' });

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
};

// Submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await service.create(formData);
    publishToast({ variant: 'success', title: 'บันทึกสำเร็จ' });
    setShowModal(false);
    void fetchData();
  } catch (err) {
    publishToast({ variant: 'error', title: 'เกิดข้อผิดพลาด' });
  }
};

// FormSection/FormField wrapper
<FormSection title="ข้อมูลทั่วไป">
  <FormField label="รหัส" required>
    <input name="code" value={formData.code} onChange={handleChange} />
  </FormField>
</FormSection>
```

---

## Table Patterns

### Paginated Table (standard)

```tsx
// URL-driven pagination
const searchParams = useSearchParams();
const page  = parseInt(searchParams.get('page')  ?? '1');
const limit = parseInt(searchParams.get('limit') ?? '10');

// Fetch with useCallback
const fetchData = useCallback(async () => {
  const result = await service.getPaginated(page, limit);
  setData(result.data);
  setPagination(result.pagination);
}, [page, limit]);

// PaginationFooter
<PaginationFooter
  page={page}
  limit={limit}
  total={pagination.total}
  totalPages={pagination.totalPages}
/>
```

---

## UI Patterns

### Date formatting (Thai locale)
```typescript
new Date(value).toLocaleDateString('th-TH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})
```

### Conditional rendering with permissions
```tsx
const perms = getUserPermissions();
const canCreate = isAdmin() || hasPermission(perms, PERMISSIONS.INBOUND_CREATE);

{canCreate && <ActionButton variant="primary" label="เพิ่มใหม่" onClick={handleAdd} />}
```

### Loading + Error guard
```tsx
if (loading) return <LoadingState />;
if (error)   return <ErrorState message={error} onRetry={fetchData} />;
return <ContentCard><DataTable .../></ContentCard>;
```

---

## Custom Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| `useSessionCheck` | `src/hooks/useSessionCheck.ts` | Auth guard, RBAC, menu refresh |
| `useModal` | `src/hooks/useModal.ts` | `{ isOpen, openModal, closeModal, toggleModal }` |
| `useGoBack` | `src/hooks/useGoBack.ts` | Back navigation with home fallback |
| `useClientHydrated` | `src/hooks/useClientHydrated.ts` | SSR hydration guard (returns `true` after mount) |
| `useDebouncedValue` | `src/hooks/useDebouncedValue.ts` | Debounced search input value |

```typescript
// useModal
const { isOpen, openModal, closeModal } = useModal();

// useDebouncedValue
const debouncedSearch = useDebouncedValue(searchInput, 300);

// useGoBack
const goBack = useGoBack();
<button onClick={goBack}>ย้อนกลับ</button>
```

---

## Export Utilities (src/utils/export.ts)

```typescript
import { exportXlsx, exportPdf, type ExportColumn } from '@/utils/export';

const columns: ExportColumn<Supplier>[] = [
  { header: 'รหัส', accessor: (row) => row.code },
  { header: 'ชื่อ',  accessor: (row) => row.name },
  { header: 'โทร', accessor: (row) => row.phone ?? '-' },
];

// Excel (synchronous)
exportXlsx({ filename: 'suppliers-2024', columns, rows: suppliers });

// PDF with Thai font (async, landscape A4)
await exportPdf({ filename: 'suppliers-2024', columns, rows: suppliers });
```

---

## Dashboard Fetch (src/utils/dashboardFetch.ts)

Wrapper that **silently returns empty response** when user lacks the required permission (prevents 403 toast on dashboard):

```typescript
import { dashboardFetch } from '@/utils/dashboardFetch';
import { PERMISSIONS } from '@/constants/permissions';

// Won't show 403 toast if user lacks permission
const res = await dashboardFetch('/sales/dashboard/kpi', PERMISSIONS.SALES_ORDER_READ, {});
const data = await res.json();
```

Use this on dashboard pages that mix widgets with different permission requirements.

---

## src/lib/ Directory

Business logic library — isolated from `utils/`:
- `src/lib/pc/` — PC module field validation (PO number format, error codes, Thai error messages)
- Referenced via `@/lib/pc`
- `src/utils/poNoValidation.ts` is deprecated — it now re-exports from `@/lib/pc`

---

## SVG Icons

SVGs imported directly as React components via `@svgr/webpack`:
```typescript
import SomeIcon from '@/icons/some-icon.svg';
<SomeIcon className="w-5 h-5" />
```

FontAwesome also available:
```tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
<FontAwesomeIcon icon={faCheck} />
```

---

## Theme System

- Toggle: `ThemeContext` → stores in `localStorage['theme']`
- Dark mode: Tailwind `dark:` prefix
- Material UI: themed via `ThemeProvider`
- Body: `dark:bg-gray-900`
