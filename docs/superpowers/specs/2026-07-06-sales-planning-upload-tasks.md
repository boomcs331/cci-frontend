# Sales Planning Upload - Task Breakdown

Source spec: `2026-07-06-sales-planning-upload-design.md`
Scope: Frontend (`cci-frontend`) only. Backend endpoints listed in spec section 11.2 (`commit`, `restore`, `export`) are assumed to be delivered by the backend team; frontend tasks below integrate against them without changing existing endpoint paths or response shapes (spec section 16).

Current state (verified in codebase):
- Pages exist: `src/app/(admin)/sales-planning/import/page.tsx`, `.../import/[batchId]/`, `.../data/`
- Service exists: `src/services/sales/salesPlanningService.ts` (template, upload, status, rows, errors, detail, history, cancel, reprocess, download, getPlanningData, deleteBatch, deletePlanningData)
- Missing: `commit`, `restore`, `export` service methods; no `PlanningValidationIssue` type; no `/sales-planning/*` entries in `ROUTES` or `accessControl.ts`; `.xls` still accepted in file input (must become `.xlsx`-only per FR-12/13.1)

---

## Phase 1 — Types & Service Layer

- [ ] **T1.1** Add `PlanningValidationIssue` type (spec section 14) and severity union `"ERROR" | "WARNING" | "INFO"`. Keep alongside existing `PlanningError`/`PlanningBatch` types in `salesPlanningService.ts` unless a dedicated `src/types/salesPlanning.ts` is introduced — do not relocate existing types as part of this task (out of scope, avoid unrelated refactor).
- [ ] **T1.2** Add `commitBatch(batchId: number): Promise<PlanningBatch>` calling `POST /sales-planning/import/:id/commit` (spec 11.2, FR-05, FR-06).
- [ ] **T1.3** Add `restoreBatch(batchId: number): Promise<PlanningBatch>` calling `POST /sales-planning/import/:id/restore` (spec 11.2, FR-07).
- [ ] **T1.4** Add `exportPlanningData(filters): Promise<Blob>` calling `GET /sales-planning/export` with the same filter params as `getPlanningData` (spec 11.2, FR-11).
- [ ] **T1.5** Extend `PlanningBatch` type with optional backward-compatible fields needed by the UI: `version`, `replacesBatchId`, `committedBy`, `committedAt`, `restoredBy`, `restoredAt`, `warningRows` (spec 10.1). All new fields optional to preserve backward compatibility (spec 16).
- [ ] **T1.6** Extend `PlanningDataResponse`/row types if new dimensions (Model, Gate, Location, Round, Line) are not already represented — confirm against actual backend response before adding fields.

## Phase 2 — Routing & Access Control

- [ ] **T2.1** Add `SALES_PLANNING_IMPORT`, `SALES_PLANNING_IMPORT_DETAIL`, `SALES_PLANNING_DATA` to `src/constants/routes.ts` `ROUTES` (currently absent — verified gap).
- [ ] **T2.2** Register `/sales-planning/*` matcher(s) in `src/utils/accessControl.ts` using existing `PERMISSIONS.SALES_ORDER_READ` (view), `PERMISSIONS.SALES_ORDER_IMPORT` (upload/confirm/cancel/reprocess/restore), `PERMISSIONS.SALES_ORDER_EXPORT` (export/download) per spec section 6. Both permission constants already exist — no backend permission changes needed.
- [ ] **T2.3** Run `pnpm routes:gen` after route constant changes.
- [ ] **T2.4** Replace any hardcoded `/sales-planning/...` path literals in pages with `ROUTES.*` constants.

## Phase 3 — `/sales-planning/import` (Upload & History)

- [ ] **T3.1** Restrict file input `accept` to `.xlsx` only; remove `.xls` support (spec 13.1, FR-01).
- [ ] **T3.2** Add year/month period picker validation gating the upload action until both are selected and a valid `.xlsx` file is chosen (FR-01).
- [ ] **T3.3** Wire template download to pass selected year/month query params (`GET /sales-planning/template?year=&month=`) per FR-12.
- [ ] **T3.4** Ensure import history table surfaces version, replacement relationship (`replacesBatchId`), committedBy/committedAt where available, and legacy `COMPLETED`/`PARTIAL` statuses render without breaking (spec 8, 16, FR-10).
- [ ] **T3.5** Navigate to batch detail (`/sales-planning/import/[batchId]`) after successful upload (existing behavior — verify still intact).

## Phase 4 — `/sales-planning/import/[batchId]` (Preview & Confirm)

- [ ] **T4.1** Add tabs/sections for Preview Rows, Errors, Warnings using `PlanningValidationIssue.severity` filtering (spec 13.2, FR-04).
- [ ] **T4.2** Display row/valid/error/warning/skipped counts and audit fields (uploadedBy/At, committedBy/At, restoredBy/At) per spec 10.1.
- [ ] **T4.3** Implement **Confirm** action: enabled only when `status === "VALIDATED"` and error count is 0; call `commitBatch`; show `ConfirmModal` before commit; `publishToast()` on success/failure (FR-05, spec 13.2).
- [ ] **T4.4** Implement **Restore** action: enabled only for eligible `SUPERSEDED` batches; call `restoreBatch`; `ConfirmModal` + `publishToast()` (FR-07, spec 13.2).
- [ ] **T4.5** Verify existing Cancel/Reprocess/Download actions still show/hide correctly against the fuller status set (`PENDING/PROCESSING/VALIDATED/INVALID/COMMITTED/SUPERSEDED/FAILED/CANCELLED` + legacy `COMPLETED/PARTIAL`) (spec 8, 16).
- [ ] **T4.6** Add `try/catch/finally` around all new async handlers; use `apiFetch`/`apiFetchJson` only (no direct `fetch`).

## Phase 5 — `/sales-planning/data` (Search & Export)

- [ ] **T5.1** Extend filters to cover Model, Gate, Location, Round, Line in addition to existing Customer/Part/date filters (FR-08).
- [ ] **T5.2** Add daily/monthly/grouped summary metrics (by Customer, Part No, Gate, Location, Round, Line) per FR-09 — confirm exact aggregation shape with backend response before building UI.
- [ ] **T5.3** Add **Export** action calling `exportPlanningData` with current filter state, download as `.xlsx` blob (FR-11).
- [ ] **T5.4** Confirm Clear Filters, Empty/Loading/Error states use shared components (`LoadingState`, `EmptyState`, `ErrorState`) per spec 13.4.

## Phase 6 — Verification

- [ ] **T6.1** `pnpm build` — TypeScript compile check.
- [ ] **T6.2** `pnpm lint`.
- [ ] **T6.3** `pnpm test:e2e` — add/extend Playwright specs for: valid upload+preview+confirm; invalid extension/size/period/header/quantity/total; error/warning tab visibility; permission-based action visibility; history → detail navigation; data filters/summary/export; restore confirmation flow (spec section 17).
- [ ] **T6.4** Manual pass against Acceptance Criteria in spec section 18.

---

## Notes / Open Questions to Confirm With Backend Before Implementation

- Exact response shape for `commit`/`restore`/`export` endpoints (spec marks these as new — not yet in `salesPlanningService.ts`).
- Exact shape of FR-09 grouped summaries (daily/monthly/grouped totals) — not present in current `PlanningDataResponse`.
- Whether `PlanningRow`/`PlanningDataResponse` already include Model/Gate/Location/Round/Line or need backend confirmation before frontend field additions.
