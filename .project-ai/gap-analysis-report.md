# Gap Analysis Report — CCI Frontend AI Documentation

**Generated**: 2026-06-28  
**Methodology**: Full source scan — all service files, type files, utils, hooks vs. generated docs

---

## Summary

| Category | Gaps Found | Fixed |
|----------|-----------|-------|
| Missing API endpoints | 34 endpoints across 4 new service files | ✅ |
| Missing API method corrections | 2 PUT→PATCH corrections | ✅ |
| Missing domain rules | 7 rules (permission expansion, QR format, lot split, batch lifecycles, tracking statuses) | ✅ |
| Missing database tables | 7 tables (sales planning, import, lot split) | ✅ |
| Missing utilities/hooks | 5 hooks + export utils + dashboardFetch + lib/ | ✅ |
| Missing modules in project-context | 2 modules (Sales Import, detail of Sales Planning) | ✅ |
| Known anti-pattern found | `productionPlanQrService.ts` raw `fetch()` | ✅ documented |
| Deprecated file found | `src/utils/poNoValidation.ts` → use `@/lib/pc` | ✅ documented |

---

## Gap Detail

### 1. Missing API Endpoints (CRITICAL)

All four service files were entirely undocumented:

#### `src/services/sales/salesDashboardService.ts` — 5 endpoints
- `GET /sales/dashboard/summary`
- `GET /sales/dashboard/kpi`
- `GET /sales/dashboard/sales-chart?days=30`
- `GET /sales/dashboard/top-products?limit=5`
- `GET /sales/dashboard/upcoming-deliveries?days=7`

#### `src/services/sales/salesReportsService.ts` — 4 endpoints
- `GET /sales/reports/summary?year`
- `GET /sales/reports/by-customer?year`
- `GET /sales/reports/by-product?year`
- `GET /sales/reports/monthly?year`

#### `src/services/sales/salesImportService.ts` — 5 endpoints
- `GET /sales/import/template`
- `POST /sales/import/upload` (FormData)
- `GET /sales/import/batches`
- `GET /sales/import/batches/:id`
- `POST /sales/import/commit`

#### `src/services/sales/salesPlanningService.ts` — 14 endpoints
- Full CRUD + import workflow for `/sales-planning/*`

#### `src/services/productFgLotService.ts` — 1 endpoint
- `GET /products/reports/fg-lot-trace`

#### `src/services/productionPlanQrService.ts` — 1 endpoint
- `POST /production-plans/:planId/generate-product-qr-orders`

---

### 2. Wrong HTTP Methods in Docs (HIGH)

| Endpoint | Doc Said | Actual |
|----------|---------|--------|
| `/masters/production-processes/:id` update | `PUT` | `PATCH` |
| `/masters/product-production-steps/:id` update | `PUT` | `PATCH` |
| `/masters/production-processes/:id` delete response | `void` | `{ message, deactivated? }` |

---

### 3. Missing Domain Rules (HIGH)

| Rule | Source File |
|------|------------|
| Permission expansion (granular → legacy implied) | `src/utils/permissionExpand.ts` |
| `userSatisfiesPermission` must be used, not `includes()` | `src/utils/permissionExpand.ts` |
| Production lot QR format `CCI:PL:{planId}:{itemIndex}:{lotIndex}` | `src/utils/productionLotTracking.ts` |
| Close-step barcodes `CCI:PRODUCTION:CLOSE-STEP`, `PD-CLOSE-STEP` | `src/utils/productionLotTracking.ts` |
| Lot split modes: `FIRST_PROCESS` vs `GENERAL` | `src/types/productionLotSplit.ts` |
| Lot station `nextAction`: `start \| complete \| none` | `src/types/productionLotStation.ts` |
| Sales planning batch lifecycle: PENDING→VALIDATED→COMMITTED\|FAILED | `src/services/sales/salesPlanningService.ts` |
| Sales import batch lifecycle + row statuses | `src/services/sales/salesImportService.ts` |
| Planning error severity: `ERROR \| WARNING \| INFO` | `src/services/sales/salesPlanningService.ts` |

---

### 4. Missing Database Tables (MEDIUM)

| Table | Source |
|-------|--------|
| `sales_planning_batches` | `salesPlanningService.ts` types |
| `sales_planning_rows` | `salesPlanningService.ts` types |
| `sales_planning_errors` | `salesPlanningService.ts` types |
| `sales_import_batches` | `salesImportService.ts` types |
| `sales_import_rows` | `salesImportService.ts` types |
| `production_lot_split_traces` | `src/types/productionLotSplit.ts` |
| `LotStepQuantityRow` (step tracking per lot) | `src/types/productionLotStepQuantities.ts` |

---

### 5. Missing Utilities & Hooks (MEDIUM)

| Item | File | Gap |
|------|------|-----|
| `useModal` | `src/hooks/useModal.ts` | Not documented |
| `useGoBack` | `src/hooks/useGoBack.ts` | Not documented |
| `useClientHydrated` | `src/hooks/useClientHydrated.ts` | Not documented |
| `useDebouncedValue` | `src/hooks/useDebouncedValue.ts` | Not documented |
| `exportXlsx / exportPdf` | `src/utils/export.ts` | Not documented |
| `dashboardFetch` | `src/utils/dashboardFetch.ts` | Not documented |
| `src/lib/pc/` | business logic lib | Not documented anywhere |

---

### 6. Known Anti-Pattern Found (HIGH)

**File**: `src/services/productionPlanQrService.ts`

```typescript
// ❌ Uses fetch() directly — bypasses apiFetch auth headers
const res = await fetch(
  getApiUrl(`/production-plans/${planId}/generate-product-qr-orders`),
  { method: "POST", headers: { "Content-Type": "application/json" }, body: ... }
);
```

This means requests to `/production-plans/:id/generate-product-qr-orders` do **not** send `x-user-id`, `x-department-id`, or `Authorization` headers unless the backend doesn't require them.

**Risk**: If backend starts enforcing auth on this endpoint, the call will silently fail with 401.  
**Recommendation**: Migrate to `apiFetch` with proper auth headers.

---

### 7. Deprecated Code Found (LOW)

**File**: `src/utils/poNoValidation.ts`

```typescript
/** @deprecated Use `@/lib/pc` instead. */
```

Any AI agent seeing this file should redirect imports to `@/lib/pc`.

---

### 8. Type File Gaps (LOW)

| Type | Defined In | Gap |
|------|-----------|-----|
| `LotStationPayload` | `src/types/productionLotStation.ts` | Not in database-map (station view) |
| `LotStepQuantitiesPayload` | `src/types/productionLotStepQuantities.ts` | Not documented |
| `SplitLotResult`, `SplitLotTrace` | `src/types/productionLotSplit.ts` | Not documented |
| `DashboardSummary`, `DashboardKPI` | `salesDashboardService.ts` | Inline types, not in `@/types/` |
| `ReportsSummary` | `salesReportsService.ts` | Inline types, not in `@/types/` |

---

## Recommendations

### Immediate (before next AI task)
1. ✅ Done — All docs updated per gaps above

### Short Term (next refactor sprint)
2. Move `salesDashboardService.ts` types → `src/types/sales.ts`
3. Move `salesReportsService.ts` types → `src/types/sales.ts`
4. Move `salesPlanningService.ts` types → `src/types/salesPlanning.ts`
5. Move `salesImportService.ts` types → `src/types/salesImport.ts`
6. Fix `productionPlanQrService.ts` to use `apiFetch` instead of `fetch()`
7. Fix `pc/page.tsx` and `pc/outcome/page.tsx` direct localStorage usage

### Medium Term
8. Add `src/lib/pc/` documentation
9. Add unit tests for `permissionExpand.ts` (critical business logic)
10. Add unit tests for `accessControl.ts` (RBAC gate)
