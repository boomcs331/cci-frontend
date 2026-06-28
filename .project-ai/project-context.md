# Project Context — CCI Frontend

## Project Overview
CCI Frontend is a **Production Control & Manufacturing Admin Dashboard** built on Next.js 16 App Router. It serves as the primary operations interface for factory floor management, production planning, materials control, and sales order processing in a multi-department manufacturing environment.

## Main Business Objectives
1. **Material Control** — Receive, track, and issue raw materials with QR-code lot traceability
2. **Production Management** — Create production orders, assign lots, track step-by-step production progress
3. **Sales Order Processing** — Manage full order lifecycle from draft to delivery with approval workflow
4. **Master Data** — Centralized management of materials, suppliers, customers, products, processes
5. **RBAC** — Fine-grained permission control per department and role

## Core Modules

| Module | Route | Description |
|--------|-------|-------------|
| PC (Production Control) | `/pc/*` | Material income/outcome, QR lots, stock, reports |
| Production | `/production/*` | Orders, BOM, step tracking, lot scanning, lot split, dept scan |
| Sales | `/sales/*` | Order CRUD, approvals, export (Excel/PDF), dashboard, reports |
| Sales Planning | `/sales-planning/*` | Excel import for monthly sales plan, batch processing |
| Sales Import | `/sales/*` (import sub-flow) | Bulk order import via Excel, PENDING→VALIDATED→COMMITTED |
| Master Data | `/master-data/*` | Materials, suppliers, customers, products, processes, prod steps |
| Users | `/users/*` | User, role, permission, department management |
| Balances | `/balances/*` | Cross-module stock overview |

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.7 (App Router, React Server Components + Client Components)
- **UI Layer**: React 19.2.0, TypeScript 5.x (strict)
- **Styling**: TailwindCSS 4.1.17, Material UI 6.3.1
- **Charts**: ApexCharts 4.7.0, react-apexcharts
- **Calendar**: FullCalendar 6.1.19
- **Documents**: jsPDF + jsPDF-autotable, xlsx, qrcode
- **Drag & Drop**: react-dnd 16.0.1
- **Testing**: Playwright 1.59.1 (E2E visual regression + route coverage)
- **API Mocking**: MSW 2.13.2 (development)
- **Package Manager**: pnpm

### Backend (separate repo, proxied)
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Message Queue**: RabbitMQ
- **Port**: 3006 (local)

## Important Workflows

### Login & Department Selection
1. POST `/auth/login` → JWT + user + permissions + menus
2. If multi-department user → redirect `/select-department`
3. `confirmActiveDepartment()` → sets `x-department-id` on all requests
4. Session expires after 1 hour → auto-redirect `/signin`

### Material Receiving (PC Income)
1. Select material + supplier + quantity
2. System creates `Receiving` record + `Lot` records with QR codes
3. QR labels printed for physical tracking
4. Lots stored in specified location

### Production Order Lifecycle
`PENDING` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`
Lots flow through production processes defined per product BOM.

### Sales Order Lifecycle
`DRAFT` → `PENDING` → `APPROVED` → `PROCESSING` → `SHIPPING` → `COMPLETED`
Cancellation possible at most stages. Approval required to move from PENDING.

## Things AI Must Never Change
- `src/utils/session.ts` — session expiry logic and `SESSION_UPDATED_EVENT`
- `src/utils/api.ts` — auth header injection and 401/403 handling
- `src/utils/accessControl.ts` — RBAC route policies
- `next.config.ts` — proxy rewrite rules
- `.env.local` — environment variables
- Any existing API endpoint paths (backward compatibility with backend)
- Existing TypeScript interfaces in `src/types/*` (used as API contracts)
- Permission codes in `src/constants/permissions.ts` (must match backend exactly)
