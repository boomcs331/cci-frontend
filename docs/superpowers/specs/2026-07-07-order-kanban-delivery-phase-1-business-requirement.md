# Order, Kanban and Delivery Management

## Phase 1: Business Requirement

## 1. Document Status

| Item | Value |
|------|-------|
| Date | 2026-07-07 |
| Status | Approved Phase 1 design |
| Target architecture | Modular Monolith |
| Frontend | Next.js 16 |
| Backend | NestJS |
| Database | PostgreSQL |
| Asynchronous processing | RabbitMQ |

This document defines the approved business requirements for converting active Sales Planning data into operational fulfillment orders, generating and tracking Kanban, confirming picking and delivery, and recording stock and audit transactions.

It does not replace the existing Sales Order lifecycle. Operational fulfillment is a separate aggregate linked to active Sales Planning, Customer Master, Product Master, FG Lot, Warehouse Location, users, and permissions.

## 2. Confirmed Decisions

| Topic | Decision |
|-------|----------|
| Planning to Order | User explicitly generates orders from selected active planning dates |
| Order grouping | `saleDate + customer + gate + location + round + line` |
| Order contents | One order can contain multiple Part/Model items |
| Stock traceability | `Product + FG Lot + Warehouse Location` |
| Kanban delivery | Atomic; split before partial delivery |
| Cancellation | Supervisor can cancel before delivery; delivered goods use Return |
| Standard lot size | Product Master value, snapshotted at generation |
| Lot-size override | Supervisor only, with reason and audit log |
| Printing | Backend-generated PDF, printed through the browser |
| Architecture | Modular Monolith using the existing NestJS and PostgreSQL deployment |

## 3. Business Objectives

1. Convert approved sales plans into controlled operational orders without creating duplicates.
2. Track every order from generation, notification printing, Kanban generation, picking, delivery, and stock deduction.
3. Preserve finished-goods lot traceability from production through warehouse allocation and customer delivery.
4. Prevent duplicate stock deduction caused by repeated scans, network retries, concurrent requests, or repeated confirmation.
5. Support standard Kanban lot generation and controlled split operations with immutable parent-child history.
6. Provide complete print, status, stock, transaction, and user audit trails.
7. Enforce action-based permissions and department access throughout the workflow.
8. Provide operational dashboards and reports for pending work, completed delivery, stock movement, import errors, and duplicate scans.

## 4. Scope

### 4.1 In Scope

- Select active Sales Planning data by sale date and generate operational orders
- Group orders by sale date, Customer, Gate, Location, Round, and Line
- Generate immutable, unique, human-readable order codes
- Generate order notification PDFs and record original/reprint activity
- Generate Kanban based on Product Master standard lot size
- Generate unique Kanban numbers and opaque QR tokens
- Generate Kanban tag PDFs and record original/reprint activity
- Split Kanban while preserving quantities and parent-child relationships
- Scan Kanban for picking and allocate one FG Lot and Warehouse Location
- Confirm delivery only after successful picking
- Deduct stock through immutable OUT ledger transactions
- Cancel before delivery, release picking allocation, and process post-delivery Return transactions
- Maintain status logs, stock transactions, print logs, split history, and audit logs
- Provide dashboard, search, filtering, reporting, and export capabilities
- Enforce role, permission, and department access

### 4.2 Out of Scope

- Automatically creating orders immediately after Sales Planning import confirmation
- Creating orders directly from uncommitted or superseded planning versions
- Partial delivery from one Kanban without splitting it first
- Deleting or editing committed stock transactions
- Reversing delivered status by deleting the original delivery transaction
- Automatically creating Customer, Product, FG Lot, or Location Master Data
- Direct ZPL printing or printer-driver integration in the first release
- Splitting the backend into microservices
- Changing existing Sales Planning endpoint paths or response contracts
- Replacing the existing Sales Order status lifecycle

## 5. Actors and Responsibilities

| Actor | Responsibilities |
|-------|------------------|
| Admin | Configure users, roles, permissions, and all system settings |
| Order Operator | Select planning data, generate orders, view orders, print and reprint notification documents |
| Kanban Operator | Generate Kanban, print/reprint tags, and request split operations |
| Warehouse Operator | Scan Kanban, validate stock, select FG Lot and Warehouse Location, and confirm picking |
| Delivery Operator | Scan picked Kanban and confirm delivery |
| Supervisor | Approve cancellation, override standard lot size, authorize split exceptions, approve return, and inspect audit logs |
| Auditor/Viewer | View dashboards, reports, stock, Kanban logs, and audit history without mutation rights |
| System Worker | Process asynchronous imports, PDF generation, reporting jobs, and retryable background work |

## 6. Business Definitions

| Term | Definition |
|------|------------|
| Active Sales Planning | The committed planning version currently active for a year/month |
| Operational Order | Fulfillment aggregate generated from selected active planning rows |
| Order Item | Product/Part and Model quantity within an operational order |
| Kanban | Atomic physical fulfillment unit with a unique number and QR token |
| FG Lot | Finished-goods production lot used as the traceable stock source |
| Picking Allocation | Reservation of Kanban quantity against one FG Lot and Warehouse Location |
| Delivery | Atomic confirmation that a picked Kanban has been dispatched |
| Stock Ledger | Immutable transaction history used to explain every stock balance change |
| Return | New inbound stock transaction created after delivered goods are returned |
| Idempotency Key | Client-generated unique key that guarantees one logical mutation is processed once |

## 7. Business Rules

### 7.1 Planning and Order Generation

- `BR-ORD-001`: Orders can be generated only from active committed Sales Planning data.
- `BR-ORD-002`: The user must select one or more sale dates before order generation.
- `BR-ORD-003`: One order is grouped by `saleDate + customer + gate + location + round + line`.
- `BR-ORD-004`: One order can contain multiple Part/Model items.
- `BR-ORD-005`: A planning row and date can contribute to only one active operational order item.
- `BR-ORD-006`: Repeated generation from the same planning source must return the existing result or a duplicate-source error without creating another order.
- `BR-ORD-007`: Generated order data snapshots Customer, Product, destination, round, line, quantity, and planning source identity.
- `BR-ORD-008`: Changes to later planning versions do not silently alter existing operational orders.

### 7.2 Order Code

- `BR-CODE-001`: Order code format is `OR-{YYMMDD}-{CUSTOMER_CODE}-{SEQ6}`.
- `BR-CODE-002`: Example: `OR-260707-HON-000123`.
- `BR-CODE-003`: Order code is immutable after creation.
- `BR-CODE-004`: The sequence is generated server-side and protected by a database unique constraint.
- `BR-CODE-005`: Gate, Location, Round, and Line remain separate indexed fields rather than mutable code segments.
- `BR-CODE-006`: Search supports order code and every grouping field independently.

### 7.3 Notification Printing

- `BR-PRINT-001`: The backend generates the order notification as PDF.
- `BR-PRINT-002`: The first generated print event is `ORIGINAL`.
- `BR-PRINT-003`: Every later print event is `REPRINT` and requires a reason.
- `BR-PRINT-004`: A print log records document type, entity, sequence, user, timestamp, and reason.
- `BR-PRINT-005`: Print logs represent document generation requests; the web application cannot guarantee physical printer completion.

### 7.4 Kanban Generation

- `BR-KAN-001`: Kanban is generated per Order Item.
- `BR-KAN-002`: Product Master provides `standardKanbanQty`.
- `BR-KAN-003`: The standard quantity is snapshotted on the Order Item when Kanban is generated.
- `BR-KAN-004`: A Supervisor can override standard quantity before generation with a mandatory reason.
- `BR-KAN-005`: Quantities are divided into full standard lots plus one remainder lot.
- `BR-KAN-006`: Total Kanban quantity for an Order Item must equal the order-item quantity.
- `BR-KAN-007`: Kanban number and QR token are globally unique.
- `BR-KAN-008`: QR contains an opaque, non-guessable token and does not expose Customer, Product, quantity, or internal identifiers.
- `BR-KAN-009`: Kanban tag PDF includes order, item, destination, quantity, lot sequence, and printable QR.

### 7.5 Kanban Split

- `BR-SPLIT-001`: Split is allowed only before delivery.
- `BR-SPLIT-002`: The sum of child quantities must equal the parent quantity exactly.
- `BR-SPLIT-003`: Each child quantity must be a positive integer.
- `BR-SPLIT-004`: A split parent becomes `SPLIT` and cannot be picked, delivered, or deducted directly.
- `BR-SPLIT-005`: Children receive unique Kanban numbers, QR tokens, and parent references.
- `BR-SPLIT-006`: Split reason, actor, timestamp, original quantity, and child quantities are immutable audit data.
- `BR-SPLIT-007`: Splitting a picked Kanban requires Supervisor authorization and release of the existing FG allocation before child allocation.

### 7.6 Picking

- `BR-PICK-001`: Picking requires a valid, active, non-split, non-cancelled Kanban.
- `BR-PICK-002`: Picking allocates `Product + FG Lot + Warehouse Location`.
- `BR-PICK-003`: One Kanban must be fulfilled by one FG Lot; insufficient quantity requires Kanban split.
- `BR-PICK-004`: Available FG Lot quantity must cover the full Kanban quantity.
- `BR-PICK-005`: Picking records actor and timestamp and changes Kanban to `PICKED`.
- `BR-PICK-006`: Picking does not reduce physical stock and does not create an OUT ledger entry.
- `BR-PICK-007`: Repeated picking confirmation cannot create duplicate allocation.

### 7.7 Delivery and Stock Deduction

- `BR-DEL-001`: Delivery requires Kanban status `PICKED`.
- `BR-DEL-002`: One Kanban is delivered atomically; partial delivery requires prior split.
- `BR-DEL-003`: Delivery confirmation, stock OUT, balance update, delivery record, status log, and audit log execute in one PostgreSQL transaction.
- `BR-DEL-004`: One Kanban can reference at most one committed stock OUT transaction.
- `BR-DEL-005`: Every delivery confirmation requires an idempotency key.
- `BR-DEL-006`: Repeating the same idempotency key returns the original result without executing a second mutation.
- `BR-DEL-007`: Reusing an idempotency key with different request data is rejected.
- `BR-DEL-008`: Concurrent delivery requests lock the Kanban and affected stock balance rows.
- `BR-DEL-009`: Any failure rolls back the complete delivery transaction.
- `BR-DEL-010`: The parent Order becomes `PARTIALLY_DELIVERED` when some active Kanban are delivered and `DELIVERED` when all active Kanban are delivered.

### 7.8 Cancellation and Return

- `BR-CAN-001`: A Supervisor can cancel an Order or Kanban only before delivery.
- `BR-CAN-002`: Cancelling a picked Kanban releases its FG Lot allocation.
- `BR-CAN-003`: Delivered Kanban cannot be cancelled or reverted by deleting data.
- `BR-CAN-004`: Delivered goods use a separate Return workflow and immutable `RETURN` stock transaction.
- `BR-CAN-005`: Cancellation and return require a reason and audit record.
- `BR-CAN-006`: Cancelling an Order is blocked if any child Kanban is delivered.

### 7.9 Stock Ledger

- `BR-STK-001`: Stock balance changes only through ledger-backed business operations.
- `BR-STK-002`: Delivery creates `OUT`; return creates `RETURN`.
- `BR-STK-003`: Ledger records are immutable and cannot be edited or deleted.
- `BR-STK-004`: Balance cannot become negative.
- `BR-STK-005`: Ledger records include before quantity, transaction quantity, after quantity, Product, FG Lot, Warehouse Location, Kanban, Order, actor, and timestamp.
- `BR-STK-006`: Stock balance is a current-state projection that must reconcile with the ledger.

### 7.10 Audit and Access Control

- `BR-AUD-001`: Generate Order, print, reprint, generate Kanban, split, pick, deliver, deduct, cancel, return, override, and permission changes are audited.
- `BR-AUD-002`: Audit log stores action, entity type, entity ID, old value, new value, user, department, timestamp, request ID, IP address when available, and remark.
- `BR-AUD-003`: Audit records are immutable.
- `BR-RBAC-001`: Every page and API action requires an explicit action-based permission.
- `BR-RBAC-002`: Admin retains the existing global bypass behavior.
- `BR-RBAC-003`: Department-scoped users can operate only within permitted departments and warehouse locations.

## 8. Functional Requirements

### 8.1 Order Management

- `FR-ORD-001`: Search active planning data by date, Customer, Gate, Location, Round, Line, Model, and Part.
- `FR-ORD-002`: Preview proposed order groups and item totals before generation.
- `FR-ORD-003`: Generate orders idempotently from selected planning rows.
- `FR-ORD-004`: Search and filter orders by code, date, Customer, destination, status, and item.
- `FR-ORD-005`: View order detail, planning source, items, Kanban progress, print history, and status history.
- `FR-ORD-006`: Generate, print, and reprint notification PDFs.

### 8.2 Kanban Management

- `FR-KAN-001`: Generate Kanban preview using snapshotted standard lot size.
- `FR-KAN-002`: Allow authorized lot-size override with reason before generation.
- `FR-KAN-003`: Generate Kanban numbers, QR tokens, and PDF tags.
- `FR-KAN-004`: Print/reprint tags and record print logs.
- `FR-KAN-005`: Split eligible Kanban and create immutable parent-child history.
- `FR-KAN-006`: Search Kanban by number, QR, order, item, Product, FG Lot, status, and date.

### 8.3 Picking

- `FR-PICK-001`: Scan or enter Kanban QR token.
- `FR-PICK-002`: Validate existence, status, permission, split state, cancellation state, and prior picking.
- `FR-PICK-003`: Display Product, quantity, destination, and eligible FG Lots by Warehouse Location.
- `FR-PICK-004`: Confirm one full-quantity FG Lot allocation.
- `FR-PICK-005`: Show clear insufficient-stock and split-required outcomes.

### 8.4 Delivery

- `FR-DEL-001`: Scan or enter picked Kanban QR token.
- `FR-DEL-002`: Validate status, allocation, permission, stock, prior delivery, and idempotency key.
- `FR-DEL-003`: Preview delivery and stock impact before confirmation.
- `FR-DEL-004`: Confirm delivery and stock OUT atomically.
- `FR-DEL-005`: Return the original success response for an identical retry.
- `FR-DEL-006`: Record duplicate scan attempts for operational monitoring.

### 8.5 Cancellation and Return

- `FR-CAN-001`: Request and approve cancellation before delivery.
- `FR-CAN-002`: Release picked FG allocation during approved cancellation.
- `FR-RET-001`: Create an approved return against a delivered Kanban.
- `FR-RET-002`: Create immutable Return stock movement without altering original OUT.

### 8.6 Stock, Audit, Dashboard, and Reports

- `FR-STK-001`: View current balance by Product, FG Lot, and Warehouse Location.
- `FR-STK-002`: View and export stock ledger transactions.
- `FR-AUD-001`: Search audit logs by action, entity, user, department, request ID, and date.
- `FR-DASH-001`: Display orders today, generated/printed Kanban, pending picking, picked, pending delivery, delivered, stock OUT today, import errors, and duplicate scans.
- `FR-REP-001`: Report orders by Customer, Gate, Location, Round, Line, Product, status, and date.
- `FR-REP-002`: Export authorized filtered reports.

## 9. Non-Functional Requirements

### 9.1 Performance and Capacity

- Excel import target: `.xlsx` up to 10 MB or 10,000 source rows per batch
- Import processing is asynchronous and exposes status/progress
- List, search, dashboard, and report API P95 target: at most 3 seconds under normal operating load
- Picking and delivery scan-confirm API P95 target: at most 2 seconds under normal operating load
- All list endpoints use server-side pagination
- Search and aggregation fields use suitable database indexes

### 9.2 Reliability and Consistency

- Delivery and stock deduction are strongly consistent in one database transaction
- Idempotent commands persist request fingerprint, result, status, and expiry
- Concurrent mutations use row locks and/or optimistic version checks
- Failed transactions leave no partial status, balance, or ledger changes
- Background jobs support controlled retry and dead-letter handling

### 9.3 Security and Auditability

- Authentication and active-department behavior reuse the current session model
- APIs enforce permission and department scope on the server
- QR tokens are random, opaque, revocable, and non-sequential
- Sensitive business data is not encoded in QR values
- Audit, stock ledger, delivery, split, and status records are immutable
- Structured logs include request ID and actor identity

### 9.4 Usability

- Scanner workflows minimize typing and keep the scan field ready after each result
- Every asynchronous operation has loading, success, warning, empty, and error states
- Errors provide stable codes and actionable Thai messages
- Destructive and stock-impacting operations require explicit confirmation
- PDF layouts support A4 notification and configured Kanban label size

### 9.5 Time and Localization

- Server and database timestamps are stored in UTC
- User interfaces display time in `Asia/Bangkok`
- Business sale date remains a date-only value and is not shifted by timezone conversion

## 10. Assumptions

1. Customer, Product/Part, FG Lot, and Warehouse Location Master Data are maintained before operational use.
2. FG Lot has an available quantity and can be traced back to its production source.
3. Product Master can be extended with `standardKanbanQty` or an equivalent backend field.
4. QR scanning uses browser camera APIs or a keyboard-wedge scanner; no native device application is required.
5. Users authenticate and select an active department before entering admin routes.
6. The backend owns PDF generation and QR token issuance.
7. Existing stock balances can be migrated or reconciled into the ledger-backed model.
8. RabbitMQ is available for import, PDF, report, and other non-transactional background work.

## 11. Constraints

1. Frontend uses Next.js 16, React 19, and strict TypeScript.
2. Backend remains a NestJS Modular Monolith.
3. PostgreSQL is the source of truth for transactional data.
4. RabbitMQ is not used to split the atomic Delivery/Stock transaction.
5. Existing Sales Planning endpoint paths and response shapes remain backward compatible.
6. Operational Fulfillment Order does not alter the existing Sales Order lifecycle.
7. Permission codes must be defined by and match the backend before frontend use.
8. Frontend API calls use `apiFetch` or `apiFetchJson` through service objects.
9. Initial printing uses backend-generated PDF and browser printing, not direct ZPL.
10. Stock ledger and audit records cannot be hard-deleted.

## 12. Acceptance Criteria

### 12.1 Order

- An authorized user can preview and generate orders from selected active planning dates.
- Generated orders use the approved grouping key and include all matching Part/Model items.
- A repeated generation request for the same planning sources does not create duplicate orders or items.
- Order codes remain unique under concurrent generation.
- Order detail identifies its exact Sales Planning source rows and active planning version.

### 12.2 Printing

- The system generates a readable order notification PDF and Kanban tag PDF.
- The first print is recorded as Original.
- Every later print is recorded as Reprint with actor, time, and mandatory reason.

### 12.3 Kanban and Split

- Kanban quantities exactly equal their Order Item quantity.
- Standard lot size comes from Product Master and is snapshotted.
- A Supervisor override records old value, new value, actor, time, and reason.
- Split child quantities exactly equal the parent quantity.
- A split parent cannot be picked, delivered, or deducted.

### 12.4 Picking

- Picking requires a valid eligible Kanban and sufficient quantity in one FG Lot and Warehouse Location.
- Successful picking records allocation, actor, and timestamp.
- Successful picking does not reduce stock balance or create an OUT ledger transaction.
- Repeated picking confirmation does not create duplicate allocation.

### 12.5 Delivery and Stock

- Only a picked Kanban can be delivered.
- Successful delivery creates exactly one Delivery record and one Stock OUT ledger transaction.
- Repeating the same request with the same idempotency key returns the original result.
- Reusing an idempotency key with a different payload is rejected.
- A failure during delivery leaves Kanban status, stock balance, ledger, and audit unchanged.
- Concurrent confirmation cannot produce negative stock or duplicate OUT transactions.

### 12.6 Cancellation, Return, Audit, and Access

- Supervisor cancellation before delivery releases any picking allocation.
- Delivered Kanban cannot be cancelled.
- Return creates a new immutable Return transaction and preserves the original OUT.
- Users without permission cannot see restricted actions and receive HTTP `403` from protected APIs.
- Every critical action can be traced by entity, actor, department, request ID, and timestamp.

## 13. Phase Boundaries

This Phase 1 document approves business intent and measurable behavior. It does not finalize:

- End-to-end state machine transitions
- Exception and concurrency algorithms
- PostgreSQL tables, keys, constraints, and indexes
- API DTOs, HTTP status codes, and error response schema
- Sitemap, detailed screen design, and scanner wireframes
- Development sequence and test implementation

Those outputs are reviewed separately in Phases 2 through 6.

## 14. Phase 1 Open Questions

No blocking business questions remain for Phase 1. New questions discovered during later phases must be returned to the user for confirmation before they change an approved business rule.
