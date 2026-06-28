# Domain Rules — CCI Frontend

Business rules discovered from the codebase. AI must never violate these.

---

## 1. Session & Authentication

| Rule | Detail |
|------|--------|
| Session timeout | 1 hour from login (`SESSION_TIMEOUT = 3_600_000 ms`) |
| Session storage | `localStorage['session']` — never cookies |
| Session check interval | Every 10 seconds via `setInterval` in `useSessionCheck` |
| Expired redirect | `router.replace('/signin?reason=expired')` |
| Auth bypass endpoints | `/auth/login`, `/auth/signup`, `/auth/reset-password` — no auto-logout on 401 |
| Session update event | `setSession()` dispatches `'cci-session-updated'` custom event |

---

## 2. Multi-Department Users

| Rule | Detail |
|------|--------|
| Detection | `user.departments.length > 1` |
| Required action | Must select department at `/select-department` before accessing dashboard |
| Gate flag | `session.departmentChosen === true` |
| Active department | `session.activeDepartmentId` sent as `x-department-id` header on every request |
| Switch department | `confirmActiveDepartment(id)` → reloads page to refresh data |
| Single-dept users | Auto-selected, no selection page needed |
| `departmentChosen` default | `true` for single-dept, `false` for multi-dept until confirmed |

---

## 3. RBAC — Access Control

| Rule | Detail |
|------|--------|
| Admin bypass | `isAdmin()` → user has role `ADMIN_GLOBAL` → bypasses all permission checks |
| `adminOnly` routes | `/users/*`, `/master-data/*` — blocked for non-admins entirely |
| Permission match modes | `'all'` (default) = every permission required; `'any'` = at least one |
| Department filter | Route `allowedDepartments` checked against ALL user departments, not just active |
| PC module extra check | Any `/pc/*` route also requires `userHasAssignedPcPermission()` |
| Fallback policy | Unregistered routes → `{ adminOnly: true }` (deny non-admins) |
| Role scope | `GLOBAL` roles apply everywhere; `DEPARTMENT` roles apply per-department |

### Department Codes (PC-accessible)
- `WE` — Welding
- `PC` — Production Control
- `PD` — Production (general)
- `WELDING`, `PRESS` — also valid in some routes

---

## 4. Sales Order — Status Transitions

```
DRAFT ──→ PENDING ──→ APPROVED ──→ PROCESSING ──→ SHIPPING ──→ COMPLETED
  ↑           │           │             │               │
  └───────────┴───────────┴─────────────┴───────────────┴──→ CANCELLED
```

| Transition | Endpoint | Permission |
|------------|----------|------------|
| DRAFT → PENDING (submit) | `POST /sales/orders/:id/submit` | SALES_ORDER_CREATE |
| PENDING → APPROVED | `POST /sales/orders/:id/approve` | SALES_ORDER_APPROVE |
| PENDING → REJECTED | `POST /sales/orders/:id/reject` | SALES_ORDER_APPROVE |
| APPROVED → PROCESSING | `POST /sales/orders/:id/status` | SALES_ORDER_MANAGE |
| PROCESSING → SHIPPING | `POST /sales/orders/:id/status` | SALES_ORDER_MANAGE |
| SHIPPING → COMPLETED | `POST /sales/orders/:id/status` | SALES_ORDER_MANAGE |
| Any → CANCELLED | `POST /sales/orders/:id/cancel` | SALES_ORDER_MANAGE |

**Rules:**
- Rejection requires a `reason` string (mandatory)
- Cancellation `reason` is optional
- Status history is immutable — all transitions logged in `StatusHistoryRow`
- Approvals logged in `ApprovalRow` (immutable)

---

## 5. Material Lots (PC Receiving)

| Rule | Detail |
|------|--------|
| Lot statuses | `ACTIVE`, `PARTIAL_USED`, `USED_UP` |
| QR code | Generated on lot creation, encodes lot identity |
| Remaining quantity | Decremented on each outbound; never goes below 0 |
| Location | Every lot must have a `locationId` |
| Expiry | Optional `expiryDate` per lot |
| Receiving status | Derived from lot statuses: all USED_UP → USED_UP, any partial → PARTIAL_USED |

---

## 6. Production Order Lots

| Rule | Detail |
|------|--------|
| Lot QR format | Same format as material lots |
| Production process flow | Lots follow `sequenceOrder` of `ProductionProcess` |
| `currentProcess` | Tracks which process a lot is currently in |
| `tracking` | Array of step records (start/end time, operator, status) |
| Lot splitting | Supported via `splitLot` endpoint |
| Department backlog | `deptBacklogLotCount` — lots pending for the user's department |

---

## 7. Production Processes

| Rule | Detail |
|------|--------|
| Order enforcement | `sequenceOrder` determines flow — must be unique per process |
| Department restriction | `allowedDepartmentCodes` — if set, only those depts can execute the step |
| Active flag | Inactive processes (`isActive: false`) should not be assignable |

---

## 8. Master Data

| Rule | Detail |
|------|--------|
| Soft delete | Most entities have `isActive` flag — prefer deactivating over deleting |
| Department code format | Must be **UPPERCASE** (enforced: `code.trim().toUpperCase()`) |
| Material code | `matCode` must be unique |
| Lot size | `lotSize` on `Material` defines default split for production lots |

---

## 9. API Response Envelope

Backend returns two formats — both must be handled:

```typescript
// Format A — success envelope
{ success: boolean; message: string; data: T }

// Format B — paginated
{ data: T[]; pagination: { page, limit, total, totalPages } }
// or
{ data: T[]; total, page, limit, totalPages }  // flat
```

**Never assume a single format.** Check `result.data?.data || result.data` pattern seen in existing pages.

---

## 10. QR Code Rules

- QR codes are generated backend-side at lot creation
- Frontend renders them using the `qrcode` library from `qrCode` string field
- QR value is opaque to frontend — do not parse or modify
- Used in both material lots and production order lots

---

## 11. Permission Expansion (permissionExpand.ts)

The frontend mirrors the backend's permission expansion — granular PC permissions imply broader legacy permissions:

| Granular Permission | Implies |
|--------------------|---------|
| `inbound.create` | `production_plans.create` |
| `inbound.read` | `production_plans.read` |
| `outbound.create` | `production_plans.issue` |
| `material.read` | `production_plans.read` |
| `production_order.read` | `production_orders.read` |
| `production_step.read` | `production_orders.read` |
| `product_stock.read` | `products.stock.read` |
| `sales_reservation.create` | `products.sales.reserve` |
| `stock_overview.read` | `products.stock.read` |

`userSatisfiesPermission(perms, required)` checks both direct match AND implied permissions. **Always use this function** instead of `perms.includes(code)`.

---

## 12. QR Code Format — Production Lots

| Format | Used For |
|--------|---------|
| `CCI:PL:{planId}:{itemIndex}:{lotIndex}` | Legacy local production lots |
| Server-generated code (opaque) | New production lots from backend |

**Close-step barcodes** (scan to complete current step and move to next):
- `CCI:PRODUCTION:CLOSE-STEP`
- `PD-CLOSE-STEP`

Check with `isProductionCloseStepBarcode(raw)` from `@/utils/productionLotTracking`.

---

## 13. Lot Split Rules

| Rule | Detail |
|------|--------|
| Split modes | `FIRST_PROCESS` — split at first production step; `GENERAL` — split at any step |
| Parent retirement | Parent lot `retired = true` after split (original QR kept: `keptOriginalQr`) |
| Children | Array of new lots with their own `lotNo` and `qrCode` |
| Quantity constraint | Sum of child quantities must equal parent `releasedQuantity` |
| Split trace | `SplitLotTrace` records: operator, reason, releasedQuantity, remainingQuantity |

---

## 14. Production Lot Tracking Statuses

| Status | Meaning |
|--------|---------|
| `WAITING_START` | Lot ready for this process, not yet started |
| `IN_PROGRESS` | Step currently active |
| `COMPLETED` | Step finished |
| `pending` (step level) | Step not yet reached |

`nextAction` on `LotStationPayload`: `"start"` | `"complete"` | `"none"`

---

## 15. Sales Planning Batch Lifecycle

Excel file → `/sales-planning/import` → `PlanningBatch`

```
Upload
  ↓
PENDING (file received)
  ↓ async processing
VALIDATED (all rows checked)
  ↓ or →
COMMITTED (data written to planning table) | FAILED (processing error)
```

Error severity: `ERROR` (blocking) | `WARNING` (non-blocking) | `INFO`
History tracked via `/sales-planning/import/history` (POST with filters).

---

## 16. Sales Import Batch Lifecycle (Bulk Orders)

Excel file → `/sales/import/upload` → `ImportBatch`

```
Upload → PENDING
  ↓ validation
VALIDATED (valid/error rows identified)
  ↓ user commits
COMMITTED (orders created from valid rows)
  or
FAILED (processing error)
```

Row statuses: `PENDING` | `VALID` | `ERROR` | `COMMITTED`
Commit is explicit via `POST /sales/import/commit { batchId }`.

---

## 17. Export Rules

- Excel export: returns `Blob` via `res.blob()` — never JSON
- PDF export: same Blob pattern
- Filename generated client-side based on current date/filters
- Export endpoints: `/sales/orders/export` (Excel), `/sales/orders/export/pdf`
