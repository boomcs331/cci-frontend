# Order, Kanban and Delivery Management

## Requirements Index and Backend/Frontend Contract Gates

## Document Set

| Document | Purpose |
|----------|---------|
| `2026-07-07-order-kanban-delivery-phase-1-business-requirement.md` | Approved shared business requirement |
| `2026-07-07-order-kanban-delivery-backend-requirements.md` | Backend requirements for Phase 1-6 |
| `2026-07-07-order-kanban-delivery-frontend-requirements.md` | Frontend requirements for Phase 1-6 |

## Responsibility Matrix

| Phase | Backend owner | Frontend owner | Shared approval gate |
|-------|---------------|----------------|----------------------|
| Phase 1 Business | Domain rules, invariants, permissions | Actor workflows, action visibility, feedback | Scope, actors, rules, NFR, acceptance criteria |
| Phase 2 Analysis | State machines, transactions, concurrency, duplicate prevention | Route flow, scanner state, command lifecycle, conflict handling | Statuses, transitions, exception codes, idempotency behavior |
| Phase 3 Data | PostgreSQL ERD, tables, keys, indexes, locks | Type contracts, status unions, filter/form models | Field names, nullability, identifiers, timestamps, versions |
| Phase 4 API | Endpoints, DTOs, validation, errors, permissions, OpenAPI | Services, envelope parsing, Blob handling, error mapping | OpenAPI and permission catalog approved |
| Phase 5 UX/UI | Query support, scan payloads, PDF/report APIs | Sitemap, 20 screens, scanner UX, accessibility | Screen-to-endpoint mapping and all states approved |
| Phase 6 Delivery | Modules, migrations, backend tests/UAT | Routes, components, services, frontend tests/UAT | Integration order, fixtures, Definition of Done |

## Canonical Shared Contracts

### Order Status

```text
GENERATED
NOTICE_PRINTED
KANBAN_READY
IN_FULFILLMENT
PARTIALLY_DELIVERED
DELIVERED
PARTIALLY_RETURNED
RETURNED
CANCELLED
```

### Kanban Status

```text
GENERATED
PRINTED
PICKED
DELIVERED
SPLIT
CANCELLED
RETURNED
```

### Stock Transaction Type

```text
IN
OUT
ADJUSTMENT
RETURN
```

### API Namespace

- Existing planning: `/sales-planning/*`
- New operational fulfillment: `/fulfillment/*`
- Existing Sales Order endpoints remain unchanged

### Identifier and Time Rules

- API identifiers are opaque strings unless an existing contract requires numeric IDs.
- Business date uses `YYYY-MM-DD`.
- Timestamps use ISO 8601 UTC.
- UI displays timestamps in `Asia/Bangkok`.
- Mutable aggregate responses include integer `version`.
- Mutation responses include `requestId` and resulting aggregate state.

### Idempotency Contract

- Header: `Idempotency-Key`
- Required for Generate Order, Generate Kanban, Split, Picking Confirm, Delivery Confirm, Cancel, and Return
- Frontend reuses one key for retries of the same payload
- Backend stores request fingerprint and result
- Same key/same payload returns original result
- Same key/different payload returns `409 IDEMPOTENCY_KEY_REUSED`

### Error Contract

```json
{
  "success": false,
  "message": "ข้อความสำหรับผู้ใช้",
  "error": {
    "code": "STABLE_ERROR_CODE",
    "details": {}
  },
  "requestId": "req_...",
  "timestamp": "2026-07-07T08:00:00.000Z"
}
```

The frontend never branches on translated message text; it branches on stable error code and HTTP status.

## Permission Contract

| Capability | Backend permission code | Frontend constant intent |
|------------|-------------------------|--------------------------|
| Generate Order | `fulfillment_order.generate` | `FULFILLMENT_ORDER_GENERATE` |
| Read Order | `fulfillment_order.read` | `FULFILLMENT_ORDER_READ` |
| Cancel Order | `fulfillment_order.cancel` | `FULFILLMENT_ORDER_CANCEL` |
| Print/Reprint Order | `fulfillment_order.print`, `fulfillment_order.reprint` | matching constants |
| Generate/Read Kanban | `kanban.generate`, `kanban.read` | matching constants |
| Print/Reprint/Split/Cancel Kanban | action-specific `kanban.*` | matching constants |
| Scan/Confirm Picking | `picking.scan`, `picking.confirm` | matching constants |
| Scan/Confirm Delivery | `delivery.scan`, `delivery.confirm` | matching constants |
| Read/Return Stock | `stock.read`, `stock.return` | matching constants |
| Read Audit | `audit.read` | `AUDIT_READ` |
| Dashboard | `fulfillment_dashboard.read` | `FULFILLMENT_DASHBOARD_READ` |
| Report/Export | `fulfillment_report.read`, `fulfillment_report.export` | matching constants |

Backend seed data is authoritative. Frontend constants are added only after exact codes are published.

## Delivery Dependency Gates

### Gate 1: Business Approval

- Phase 1 scope and invariants approved
- Planning and existing Sales Order boundaries accepted
- Atomic Kanban and FG Lot rules accepted

### Gate 2: Analysis Approval

- Order and Kanban state machines approved
- Cancel/Return and Split exception flows approved
- Delivery idempotency and concurrency behavior approved

### Gate 3: Data Approval

- ERD, constraints, partial unique indexes, lock order, and migration strategy approved
- Existing balance reconciliation strategy approved before ledger cutover

### Gate 4: API Approval

- OpenAPI published
- DTO field names/nullability/version fields fixed
- Error and permission catalogs seeded
- MSW fixtures generated from approved examples

### Gate 5: UX Approval

- Sitemap and 20 screen requirements approved
- Scanner workflow tested with camera and keyboard-wedge assumptions
- PDF formats and confirmation wording approved

### Gate 6: Integration Approval

- Backend contract tests pass
- Frontend MSW E2E passes before backend integration
- End-to-end integration covers retry, conflict, rollback, permission, and mobile scanner paths

## Implementation Workstreams

### Backend

1. Shared infrastructure and RBAC catalog
2. Fulfillment Order
3. Document/PDF service
4. Kanban and Split
5. Picking allocation
6. Inventory ledger and reconciliation
7. Delivery and idempotency
8. Cancel and Return
9. Audit, dashboard, reports, and exports
10. Unit, integration, contract, concurrency, and load tests

### Frontend

1. Types, routes, permissions, access policies, and MSW contracts
2. Planning-to-Order and Order pages
3. Notification printing
4. Kanban management, generation, printing, and split
5. Shared scanner shell and Picking
6. Delivery and idempotency lifecycle
7. Stock, Return, Kanban Log, and Audit
8. Dashboard, reports, and exports
9. Responsive, accessibility, permission, visual, and E2E tests

## Integration Sequence

```text
Backend OpenAPI + fixtures
-> Frontend types/services/MSW
-> Backend module endpoint
-> Backend contract/integration tests
-> Frontend page/E2E against MSW
-> Frontend-backend integration
-> UAT
```

## Review Rule

Any proposed change to a canonical status, business key, permission, DTO field, transaction boundary, or idempotency rule requires review of all three documents before implementation continues.
