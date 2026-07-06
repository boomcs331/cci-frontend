# CCI Frontend — Project Wiki

Quick reference for understanding how project parts relate to each other.

## 1. Module → Route Mapping

| Module | Route Prefix | Main Pages |
|--------|-------------|------------|
| Dashboard | `/` | Dashboard, KPI widgets |
| PC (Production Control) | `/pc/*` | Income, Outcome, Stock, Lots, Reports |
| Production | `/production/*` | Orders, BOM, Processes, Scanning, Lot split |
| Sales | `/sales/*` | Orders, Approvals, Reports, Export |
| Sales Planning | `/sales-planning/*` | Excel import, monthly planning |
| Master Data | `/master-data/*` | Materials, Suppliers, Customers, Products, Processes |
| Users | `/users/*` | Users, Roles, Permissions, Departments |
| Balances | `/balances/*` | Cross-module stock overview |
| Auth | `/signin`, `/signup`, `/select-department` | Login, register, department selection |

## 2. Module → Service Mapping

Services live in `src/services/`. Each module has dedicated services that call `apiFetch`/`apiFetchJson`.

| Module | Services |
|--------|----------|
| PC | `materialService`, `receivingService`, `lotService`, `pcStockService`, `outboundService` |
| Production | `productionOrderService`, `productionProcessService`, `productionLotService`, `bomService`, `scanService` |
| Sales | `salesOrderService`, `salesApprovalService`, `salesReportService`, `salesExportService` |
| Sales Planning | `salesPlanningService` |
| Master Data | `materialService`, `supplierService`, `customerService`, `productService`, `processService` |
| Users | `authService`, `userService`, `roleService`, `permissionService`, `departmentService` |
| Dashboard | `dashboardService`, `dashboardFetch` (silent permission wrapper) |

## 3. Module → Component Mapping

Components live in `src/components/`. Always use `shared/` first, then module-specific components.

| Module | Component Folder | Example Components |
|--------|-------------------|-------------------|
| Shared | `src/components/shared/` | `PageContainer`, `PageHeader`, `DataTable`, `ActionButton`, `BaseModal`, `LoadingState`, `ErrorState`, `EmptyState`, `StatusBadge` |
| PC | `src/components/pc/` | Income form, Lot QR print, Stock table |
| Production | `src/components/production/` | Order form, BOM editor, Scan dialog, Lot split |
| Sales | `src/components/sales/` | Order form, Approval flow, Export panel |
| Inventory | `src/components/inventory/` | `StockQuickCheckFab`, inventory widgets |
| Auth | `src/components/auth/` | `SignInForm`, `SignUpForm` |
| QR | `src/components/qr/` | QR display, QR print helpers |
| UI | `src/components/ui/` | Low-level base components |

## 4. Layout → Page Relationship

```
RootLayout (src/app/layout.tsx)
├── ThemeProvider     → dark/light mode
├── SidebarProvider   → sidebar state
├── MswLoader         → dev API mocking
│
├── AdminLayout (src/app/(admin)/layout.tsx)
│   ├── useSessionCheck    → auth guard, polls every 10s
│   ├── ToastProvider      → global toast notifications
│   ├── AdminOverlayProvider
│   ├── PageTitleProvider
│   ├── AppSidebar         ← menu (src/layout/AppSidebar.tsx)
│   ├── AppHeader          ← top bar (src/layout/AppHeader.tsx)
│   └── Page children
│       ├── /pc/* pages
│       ├── /production/* pages
│       ├── /sales/* pages
│       ├── /master-data/* pages
│       └── /users/* pages
│
└── FullWidthLayout (src/app/(full-width-pages)/layout.tsx)
    ├── /signin
    ├── /signup
    ├── /select-department
    └── error pages
```

## 5. API Request Flow

```
Component / Page
  → Service (src/services/)
      → apiFetch / apiFetchJson (src/utils/api.ts)
          → getApiUrl()              // NEXT_PUBLIC_API_BASE_URL
          → applySessionAuthHeaders() // x-user-id, x-department-id, Bearer
          → fetch()
              → Next.js dev server
                  → next.config.ts rewrites /api/* → http://127.0.0.1:3006/*
                      → NestJS backend
```

## 6. Session & Auth Relationships

| File | Responsibility | Used By |
|------|---------------|---------|
| `src/utils/session.ts` | Read/write session, expiry check, department selection | All pages, `apiFetch`, `useSessionCheck` |
| `src/hooks/useSessionCheck.ts` | Auth guard, menu refresh, permission check | Every admin page via `AdminLayout` |
| `src/utils/accessControl.ts` | Route access policies, `canAccessPolicy` | `AppSidebar`, page guards |
| `src/constants/permissions.ts` | Permission codes (must match backend) | `accessControl.ts`, components, services |
| `src/constants/routes.ts` | All route paths | Navigation, redirects, guards |

## 7. Permission → Module Mapping

Permission codes in `src/constants/permissions.ts` follow the pattern `{module}.{action}`.

| Module | Permission Prefix | Examples |
|--------|-------------------|----------|
| PC | `INBOUND_*`, `OUTBOUND_*` | `INBOUND_CREATE`, `INBOUND_READ` |
| Production | `PRODUCTION_*`, `BOM_*` | `PRODUCTION_ORDER_CREATE`, `BOM_READ` |
| Sales | `SALES_ORDER_*`, `SALES_APPROVAL_*` | `SALES_ORDER_READ`, `SALES_APPROVAL_APPROVE` |
| Master Data | `MATERIAL_*`, `SUPPLIER_*`, `CUSTOMER_*`, `PRODUCT_*` | `MATERIAL_CREATE`, `SUPPLIER_READ` |
| Users | `USER_*`, `ROLE_*`, `PERMISSION_*` | `USER_CREATE`, `ROLE_ASSIGN` |

## 8. Type → API Contract Mapping

Types in `src/types/` are contracts between frontend and backend.

| Type File | Backend Module | Used By |
|-----------|---------------|---------|
| `src/types/user.ts` | Auth | Session, sidebar, user management |
| `src/types/material.ts` | Masters / PC | PC income, master data |
| `src/types/receiving.ts` | PC | Lot generation, QR tracking |
| `src/types/production.ts` | Production | Orders, BOM, scanning |
| `src/types/sales.ts` | Sales | Orders, approvals, reports |
| `src/types/api.ts` | All | `ApiResponse`, `PaginatedResponse` (never duplicate locally) |

## 9. Shared Components → Usage Map

| Shared Component | Used In | Purpose |
|-------------------|---------|---------|
| `PageContainer` | Every page | Outer wrapper with padding |
| `PageHeader` | Every page | Title, description, action slot |
| `ContentCard` | Most pages | White card body |
| `DataTable` | List pages | Reusable table with columns |
| `ActionButton` | Tables, forms | Consistent action buttons |
| `BaseModal` / `ConfirmModal` | Forms, deletes | Modal dialogs |
| `LoadingState` / `ErrorState` / `EmptyState` | Data pages | Feedback states |
| `StatusBadge` | Tables, forms | Status display with colors |

## 10. Critical Cross-Cutting Files

These files affect many parts of the project. Never change without understanding the impact.

| File | Why It Matters |
|------|---------------|
| `src/utils/api.ts` | All API calls go through here. Handles auth headers, 401/403, timeout. |
| `src/utils/session.ts` | Single source of truth for session. Triggers `SESSION_UPDATED_EVENT` on change. |
| `src/utils/accessControl.ts` | Route RBAC policies. Changing affects who can access which page. |
| `src/constants/permissions.ts` | Must match backend permission codes exactly. |
| `src/constants/routes.ts` | Central route registry. Used for navigation and guards. |
| `next.config.ts` | Proxy rewrites. Backend path mapping lives here. |
| `src/layout/AppSidebar.tsx` | Main menu. Reads user menus, permissions, department. |
| `src/app/(admin)/layout.tsx` | Admin layout. Auth guard and global providers. |

## 11. How to Add a New Feature

1. Define the route in `src/constants/routes.ts`
2. Add access policy in `src/utils/accessControl.ts`
3. Create the page under `src/app/(admin)/...`
4. Add service in `src/services/` if needed
5. Add/update types in `src/types/`
6. Use shared components from `src/components/shared/`
7. Add permission constant if new (must match backend)
8. Regenerate routes with `pnpm routes:gen`
9. Run `pnpm build` to verify

## 12. Common Relationship Questions

**Q: Where does the menu come from?**  
A: Backend sends `menus` in login response → stored in `localStorage` via `session.ts` → `AppSidebar` renders with permission filtering.

**Q: How does a page know if user can access it?**  
A: `useSessionCheck` in `AdminLayout` checks the route policy from `accessControl.ts` against user's permissions/department.

**Q: How do sidebar width changes affect layout?**  
A: `SidebarContext` controls state → `AdminLayout` applies `lg:ml-[300px]` (expanded) or `lg:ml-[130px]` (collapsed) margin.

**Q: Why must new routes go in both `ROUTES` and `accessControl.ts`?**  
A: `ROUTES` enables navigation and type-safe paths; `accessControl.ts` enforces RBAC.
