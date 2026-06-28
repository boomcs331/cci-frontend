# API Map — CCI Frontend

All endpoints discovered from `src/services/*` and `src/app/*`.  
Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `/api`, proxied to `http://127.0.0.1:3006`)  
All protected endpoints require headers: `x-user-id`, `x-department-id`, `Authorization: Bearer <token>`

---

## Auth

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/auth/login` | `{ username, password }` | `{ token, user, permissions, menus }` | ❌ |
| POST | `/auth/signup` | `{ username, email, password }` | user | ❌ |
| POST | `/auth/reset-password` | `{ email }` | message | ❌ |
| GET | `/auth/profile` | — | SessionUser | ✅ |
| PUT | `/auth/profile` | ProfilePayload | SessionUser | ✅ |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | message | ✅ |
| POST | `/auth/logout` | — | message | ✅ |
| GET | `/auth/menu` | — | `{ menus: MenuItem[] }` | ✅ |

### RBAC (admin only)

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/auth/permissions` | — | `AuthPermission[]` | ✅ admin |
| GET | `/auth/roles` | — | `AuthRole[]` | ✅ admin |
| GET | `/auth/roles/:id` | — | `AuthRoleDetail` | ✅ admin |
| PUT | `/auth/roles/:id/permissions` | `{ permissionIds: string[] }` | void | ✅ admin |
| GET | `/auth/departments` | — | `AuthDepartment[]` | ✅ admin |
| POST | `/auth/departments` | `{ code, name, description }` | void | ✅ admin |
| PUT | `/auth/departments/:id` | `{ code, name, description }` | void | ✅ admin |
| DELETE | `/auth/departments/:id` | — | void | ✅ admin |

---

## Masters

### Materials

| Method | Endpoint | Query | Response | Auth |
|--------|----------|-------|----------|------|
| GET | `/masters/materials` | `page, limit, matCode, matTypeId, supplierId, locationId, isActive` | `PaginatedResponse<Material>` | ✅ |
| GET | `/masters/materials/:id` | — | `Material` | ✅ |
| POST | `/masters/materials` | `Material` payload | `Material` | ✅ |
| PUT | `/masters/materials/:id` | partial `Material` | `Material` | ✅ |
| DELETE | `/masters/materials/:id` | — | void | ✅ admin |
| GET | `/masters/material-types` | — | `MaterialType[]` | ✅ |
| GET | `/masters/locations` | — | `Location[]` | ✅ |
| GET | `/masters/suppliers` | `page, limit` | `PaginatedResponse<Supplier>` | ✅ |
| POST | `/masters/suppliers` | `{ code, name, contact_person, phone, email, address }` | `Supplier` | ✅ admin |
| PUT | `/masters/suppliers/:id` | same | `Supplier` | ✅ admin |
| DELETE | `/masters/suppliers/:id` | — | void | ✅ admin |

### Products & Production Steps

| Method | Endpoint | Query/Payload | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/masters/product-production-steps` | `page, limit, productId, processId` | `ProductProductionStepsListResult` | ✅ |
| POST | `/masters/product-production-steps` | `CreateProductProductionStepPayload` | step | ✅ admin |
| PATCH | `/masters/product-production-steps/:id` | `UpdateProductProductionStepPayload` | step | ✅ admin |
| DELETE | `/masters/product-production-steps/:id` | — | `{ success, message }` | ✅ admin |

### Production Processes

| Method | Endpoint | Query/Payload | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/masters/production-processes` | `page, limit, search, isActive` | `ProductionProcessesListResult` | ✅ |
| GET | `/masters/production-processes/:id` | — | `ProductionProcess` | ✅ |
| POST | `/masters/production-processes` | `CreateProductionProcessPayload` | process | ✅ admin |
| PATCH | `/masters/production-processes/:id` | `UpdateProductionProcessPayload` | process | ✅ admin |
| DELETE | `/masters/production-processes/:id` | — | `{ message, deactivated? }` | ✅ admin |
| PATCH | `/masters/product-production-steps/:id` | `UpdateProductProductionStepPayload` | step | ✅ admin |
| DELETE | `/masters/product-production-steps/:id` | — | `{ success, message }` | ✅ admin |
| GET | `/production-orders/processes/all` | — | `ProductionProcess[]` (raw array, no envelope) | ✅ |

---

## PC (Production Control)

### Receiving (Inbound)

| Method | Endpoint | Query/Payload | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/pc/receivings` | `page, limit, receivingNo, materialId, supplierId, status, startDate, endDate` | `PaginatedResponse<Receiving>` | ✅ PC dept |
| GET | `/pc/receivings/:id` | — | `Receiving` | ✅ PC dept |
| GET | `/pc/receivings/no/:receivingNo` | — | `Receiving` | ✅ PC dept |
| POST | `/pc/receivings` | `CreateReceivingPayload` | `Receiving` | ✅ PC dept |

### Production Plan QR

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/pc/production-plan-qr/generate` | plan data | QR blob | ✅ |

---

## Production

### Production Orders

| Method | Endpoint | Query/Payload | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/production/orders` | `page, limit, status, departmentCode` | `ProductionOrdersListResult` | ✅ |
| GET | `/production/orders/:id` | — | `ProductionOrderDetail` | ✅ |
| GET | `/production/orders/:id/lots` | `departmentCode` | `ProductionOrderLot[]` | ✅ |
| POST | `/production/orders/:orderId/lots/:lotId/start` | `{ processCode, operator }` | lot | ✅ |
| POST | `/production/orders/:orderId/lots/:lotId/complete` | `{ processCode, remarks }` | lot | ✅ |
| POST | `/production/orders/:orderId/lots/:lotId/split` | `{ quantities: number[] }` | lots | ✅ |

### Products (Production view)

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/products/:id/production-steps` | — | `ProductProductionStepRow[]` | ✅ |
| PUT | `/products/:id/production-steps` | `SetProductionStepsPayload` | steps | ✅ admin |

### FG Lots

| Method | Endpoint | Query | Response | Auth |
|--------|----------|-------|----------|------|
| GET | `/production/fg-lots` | `page, limit, lotNo, productId` | paginated FG lots | ✅ |

### FG Lot Trace Report

| Method | Endpoint | Query | Response | Auth |
|--------|----------|-------|----------|------|
| GET | `/products/reports/fg-lot-trace` | `startDate, endDate, orderNo, lotSearch, productId, status, page, limit` | `LotStepTraceReportResult` | ✅ |

### Production Plan QR

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/production-plans/:planId/generate-product-qr-orders` | `GenerateProductQrOrdersBody` | `GenerateProductQrOrdersResponse` | ✅ |

> ⚠️ `productionPlanQrService.ts` calls `fetch(getApiUrl(...))` directly — bypasses `apiFetch` auth headers. This is a known anti-pattern.

---

## Sales

| Method | Endpoint | Query/Payload | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/sales/orders` | `OrdersQuery` | `{ items, pagination }` | ✅ |
| GET | `/sales/orders/pending-approval` | `OrdersQuery` | `{ items, pagination }` | ✅ |
| GET | `/sales/orders/:id` | — | `SalesOrderDetail` | ✅ |
| POST | `/sales/orders` | `CreateOrderInput` | `SalesOrderDetail` | ✅ |
| POST | `/sales/orders/:id/submit` | — | `SalesOrderDetail` | ✅ |
| POST | `/sales/orders/:id/approve` | — | `SalesOrderDetail` | ✅ APPROVE perm |
| POST | `/sales/orders/:id/reject` | `{ reason }` | `SalesOrderDetail` | ✅ APPROVE perm |
| POST | `/sales/orders/:id/cancel` | `{ reason? }` | `SalesOrderDetail` | ✅ |
| POST | `/sales/orders/:id/status` | `{ status, note? }` | `SalesOrderDetail` | ✅ MANAGE perm |
| GET | `/sales/orders/export` | `OrdersQuery` | `Blob (xlsx)` | ✅ |
| GET | `/sales/orders/export/pdf` | `OrdersQuery` | `Blob (pdf)` | ✅ |

### Sales Dashboard

| Method | Endpoint | Query | Response | Auth |
|--------|----------|-------|----------|------|
| GET | `/sales/dashboard/summary` | — | `DashboardSummary` | ✅ |
| GET | `/sales/dashboard/kpi` | — | `DashboardKPI` | ✅ |
| GET | `/sales/dashboard/sales-chart` | `days=30` | `SalesChartPoint[]` | ✅ |
| GET | `/sales/dashboard/top-products` | `limit=5` | `TopProduct[]` | ✅ |
| GET | `/sales/dashboard/upcoming-deliveries` | `days=7` | `UpcomingDelivery[]` | ✅ |

### Sales Reports

| Method | Endpoint | Query | Response | Auth |
|--------|----------|-------|----------|------|
| GET | `/sales/reports/summary` | `year?` | `ReportsSummary` | ✅ |
| GET | `/sales/reports/by-customer` | `year?` | `SalesByCustomer[]` | ✅ |
| GET | `/sales/reports/by-product` | `year?` | `SalesByProduct[]` | ✅ |
| GET | `/sales/reports/monthly` | `year?` | `MonthlySales[]` | ✅ |

### Sales Import (Bulk Order Excel)

| Method | Endpoint | Payload | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/sales/import/template` | — | `Blob (xlsx)` | ✅ |
| POST | `/sales/import/upload` | `FormData { file }` | `ImportBatch` | ✅ |
| GET | `/sales/import/batches` | `page, pageSize, status` | `{ items, pagination }` | ✅ |
| GET | `/sales/import/batches/:id` | — | `ImportBatch` | ✅ |
| POST | `/sales/import/commit` | `{ batchId }` | `{ batchId, committedRows, totalRows }` | ✅ |

---

## Sales Planning (Monthly Plan Import)

| Method | Endpoint | Payload/Query | Response | Auth |
|--------|----------|--------------|----------|------|
| GET | `/sales-planning/template` | — | `Blob (xlsx)` | ✅ |
| POST | `/sales-planning/import` | `FormData { file, year, month }` | `PlanningBatch` | ✅ |
| GET | `/sales-planning/import/:id/status` | — | `PlanningBatchStatus` | ✅ |
| GET | `/sales-planning/import/:id/errors` | `skip, take, errorType, errorCode, rowNumber, fieldName` | `{ errors, total, skip, take }` | ✅ |
| GET | `/sales-planning/import/:id/rows` | `skip, take, customerCode, productCode, status, saleDate` | `{ rows, total, skip, take }` | ✅ |
| GET | `/sales-planning/import/:id/detail` | — | `{ batch, rows, errors }` | ✅ |
| DELETE | `/sales-planning/import/:id` | — | void | ✅ |
| POST | `/sales-planning/import/:id/reprocess` | — | void | ✅ |
| GET | `/sales-planning/import/:id/download` | — | `Blob (xlsx)` | ✅ |
| POST | `/sales-planning/import/:id/cancel` | — | `{ message }` | ✅ |
| POST | `/sales-planning/import/history` | `{ skip, take, status, year, month }` | `PlanningBatchesResponse` | ✅ |
| GET | `/sales-planning` | `year, month, customerCode, productCode, startDate, endDate, skip, take` | `PlanningDataResponse` | ✅ |
| GET | `/sales-planning/row/:id` | — | `PlanningRow` | ✅ |
| DELETE | `/sales-planning/batch/:batchId` | — | `{ message }` | ✅ |

---

## Standard Response Envelopes

```typescript
// Single item / list
{ success: boolean; message: string; data: T }

// Paginated
{
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Production orders (flat)
{ orders: T[]; total: number; page: number; limit: number; totalPages: number }

// Error
{ statusCode: number; message: string; error?: string }
```

## Headers (all protected endpoints)

| Header | Source |
|--------|--------|
| `Authorization` | `Bearer ${session.token}` |
| `x-user-id` | `session.user.id` |
| `x-username` | `session.user.username` |
| `x-department-id` | `session.activeDepartmentId` |
