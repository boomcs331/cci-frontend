# Loop Engineering Master Prompt — CCI Frontend

Use this workflow for EVERY task on the CCI Frontend project.

---

## Required Reading Order (Before ANY Task)

1. **AGENTS.md** — Primary AI instructions
2. **.project-ai/project-context.md** — System overview
3. **.project-ai/architecture.md** — Data flow and structure
4. **.project-ai/coding-rules.md** — Coding conventions
5. **.project-ai/domain-rules.md** — Business rules
6. **Relevant skill** from `.agents/skills/`

### Skill Selection Guide

| Task Type | Use Skill |
|-----------|-----------|
| Add/modify API endpoint | `.agents/skills/backend-api` |
| UI redesign / styling | `.agents/skills/frontend-redesign` |
| Fix a bug | `.agents/skills/bug-fix` |
| Schema / type changes | `.agents/skills/database` |
| Review code quality | `.agents/skills/code-review` |
| Write / fix tests | `.agents/skills/testing` |
| Clean up anti-patterns | `.agents/skills/refactoring` |
| Update documentation | `.agents/skills/documentation` |

---

## Loop Engineering Process

### Phase 1 — UNDERSTAND

**Goal**: Build full context before writing code.

**Actions**:
- Understand the requirement
- Identify affected modules
- Search for existing implementations
- Identify reusable patterns
- Read all related files before coding

**Output**:
- Requirement summary
- Files involved
- Existing patterns found
- Risks

**Do not code yet.**

---

### Phase 2 — PLAN

**Goal**: Create a minimal, targeted implementation plan.

**Actions**:
- Create an implementation plan
- Include: files to modify, new files to create, estimated impact, edge cases, validation strategy

**Wait until plan is complete.**

---

### Phase 3 — IMPLEMENT

**Goal**: Execute the plan with minimal changes.

**Rules**:
- Minimal changes only
- Reuse existing patterns
- Preserve business logic
- Preserve API contracts
- Do not refactor unrelated code
- Follow TypeScript strict mode
- Follow project conventions from `coding-rules.md`

---

### Phase 4 — VERIFY

**Goal**: Confirm the implementation works correctly.

**Actions**:
- Perform verification: Type check, Lint, Build validation, Runtime validation, Edge case review
- Check: Existing functionality still works, No regression introduced, No duplicated logic introduced

---

### Phase 5 — REFLECT

**Goal**: Document decisions and provide summary.

**Output**:
- Summary
- Files changed
- Business impact
- Risks
- Follow-up recommendations

**Never skip any phase.**

---

## Specialized Prompts

### Refactor Prompt

```
Refactor this feature using Loop Engineering.

Requirements:
- Preserve behavior exactly
- No UI changes
- No API contract changes
- No business logic changes

Goals:
- Reduce complexity
- Remove duplicated code
- Improve readability
- Improve maintainability

Use refactoring skill.

Before refactoring:
- Measure current complexity
- Identify duplicated logic
- Identify reusable abstractions

After refactoring:
- Compare before/after
- Explain improvements
- Verify zero regressions
```

### Bug Fix Prompt

```
Fix this bug using Loop Engineering.

Bug description:
<BUG DESCRIPTION>

Use bug-fix skill.

Workflow:
1. Reproduce issue
2. Identify root cause
3. Explain root cause
4. Identify affected files
5. Implement minimal fix
6. Verify fix
7. Check regressions
8. Summarize changes

Constraints:
- No unnecessary refactoring
- Minimal code changes only
- Preserve existing behavior
- Reuse existing project patterns

Deliver:
- Root cause
- Files modified
- Fix explanation
- Regression analysis
```

---

## Example Usage

### Example 1: Performance Improvement

```
Use Loop Engineering Master Prompt.

Task:
Improve Sales Order List page performance.

Requirements:
- Reduce unnecessary re-renders
- Optimize API calls
- Preserve UI behavior
- Preserve API contracts

Focus:
src/app/(admin)/sales
src/components/sales
src/services/sales

Use frontend-redesign + refactoring skills.
```

### Example 2: Bug Fix

```
Use Loop Engineering Master Prompt.

Task:
Bug:
When user closes OTP modal, the system still creates a record.

Investigate and fix.

Use bug-fix skill.

Related modules:
src/components/shared/OTPModal
src/services/*
```

### Example 3: UI Redesign

```
Use Loop Engineering Master Prompt.

Task:
Redesign Production Order Detail page.

Requirements:
- Keep business logic unchanged
- Improve readability
- Improve mobile responsiveness
- Reuse existing shared components

Use frontend-redesign skill.
```

### Example 4: Add New API Endpoint

```
Use Loop Engineering Master Prompt.

Task:
Add API endpoint to fetch production lot trace report.

Requirements:
- GET /products/reports/fg-lot-trace
- Query params: startDate, endDate, orderNo, lotSearch, productId, status, page, limit
- Return LotStepTraceReportResult
- Add to productFgLotService.ts
- Update api-map.md

Focus:
src/services/productFgLotService.ts
src/types/productionLotStepQuantities.ts
.project-ai/api-map.md

Use backend-api skill.
```

### Example 5: Refactor Duplicate Logic

```
Use Loop Engineering Master Prompt.

Task:
Refactor duplicate validation logic in PC income/outcome pages.

Requirements:
- Preserve behavior exactly
- No UI changes
- No API contract changes

Goals:
- Extract validation to shared utility in src/lib/pc/
- Reduce code duplication
- Improve maintainability

Focus:
src/app/(admin)/pc/income/page.tsx
src/app/(admin)/pc/outcome/page.tsx
src/lib/pc/

Use refactoring skill.
```

### Example 6: Add E2E Test

```
Use Loop Engineering Master Prompt.

Task:
Add E2E test for sales order approval flow.

Requirements:
- Test order submission
- Test approval action
- Test rejection action
- Use Playwright
- Mock API responses with MSW

Focus:
tests/sales/order-approval.spec.ts
src/mocks/handlers.ts

Use testing skill.
```

### Example 7: Update Types

```
Use Loop Engineering Master Prompt.

Task:
Add types for Sales Planning module.

Requirements:
- Create src/types/salesPlanning.ts
- Define PlanningBatch, PlanningRow, PlanningError types
- Move inline types from salesPlanningService.ts
- Update imports

Focus:
src/types/salesPlanning.ts
src/services/sales/salesPlanningService.ts

Use database skill.
```

### Example 8: Update Documentation

```
Use Loop Engineering Master Prompt.

Task:
Update api-map.md with new Sales Reports endpoints.

Requirements:
- Document GET /sales/reports/summary
- Document GET /sales/reports/by-customer
- Document GET /sales/reports/by-product
- Document GET /sales/reports/monthly
- Include query parameters and response types

Focus:
.project-ai/api-map.md

Use documentation skill.
```

### Example 9: Code Review

```
Use Loop Engineering Master Prompt.

Task:
Review recent changes to production order lot split feature.

Requirements:
- Check for TypeScript errors
- Verify business logic preserved
- Check for duplicated code
- Verify API contracts unchanged
- Check RBAC compliance

Focus:
src/app/(admin)/production/orders/[id]/lots/split
src/services/productionOrdersService.ts

Use code-review skill.
```

### Example 10: Mobile Responsiveness

```
Use Loop Engineering Master Prompt.

Task:
Improve mobile responsiveness of material list page.

Requirements:
- Keep business logic unchanged
- Add mobile-friendly table layout
- Make filters collapsible on mobile
- Reuse existing responsive components

Focus:
src/app/(admin)/pc/materials/page.tsx
src/components/pc/materials/MaterialListTable.tsx

Use frontend-redesign skill.
```

---

---

## ตัวอย่าง Prompt ภาษาไทย

### ตัวอย่าง 1: เพิ่ม API Endpoint ใหม่

```
ใช้ Loop Engineering Master Prompt

งาน:
เพิ่ม API endpoint เพื่อดึงข้อมูลรายงาน Sales Dashboard KPI

ข้อกำหนด:
- GET /sales/dashboard/kpi
- Return DashboardKPI type
- เพิ่มใน salesDashboardService.ts
- อัปเดต api-map.md

โฟกัส:
src/services/sales/salesDashboardService.ts
src/types/sales.ts
.project-ai/api-map.md

ใช้ backend-api skill
```

### ตัวอย่าง 2: แก้ Bug

```
ใช้ Loop Engineering Master Prompt

งาน:
Bug:
เมื่อผู้ใช้ปิด OTP modal ระบบยังสร้าง record อยู่

สืบสวนและแก้ไข

ใช้ bug-fix skill

โมดูลที่เกี่ยวข้อง:
src/components/shared/OTPModal
src/services/*
```

### ตัวอย่าง 3: Redesign UI

```
ใช้ Loop Engineering Master Prompt

งาน:
Redesign หน้า Production Order Detail

ข้อกำหนด:
- ไม่เปลี่ยน business logic
- ปรับปรุง readability
- ปรับปรุง mobile responsiveness
- ใช้ shared components ที่มีอยู่

ใช้ frontend-redesign skill
```

### ตัวอย่าง 4: Refactor Code

```
ใช้ Loop Engineering Master Prompt

งาน:
Refactor โค้ด validation ซ้ำในหน้า PC income/outcome

ข้อกำหนด:
- รักษา behavior เหมือนเดิม
- ไม่เปลี่ยน UI
- ไม่เปลี่ยน API contract

เป้าหมาย:
- แยก validation เป็น shared utility ใน src/lib/pc/
- ลด code duplication
- ปรับปรุง maintainability

โฟกัส:
src/app/(admin)/pc/income/page.tsx
src/app/(admin)/pc/outcome/page.tsx
src/lib/pc/

ใช้ refactoring skill
```

### ตัวอย่าง 5: เขียน Test

```
ใช้ Loop Engineering Master Prompt

งาน:
เพิ่ม E2E test สำหรับ flow อนุมัติใบสั่งขาย

ข้อกำหนด:
- Test การส่งใบสั่งขาย
- Test การอนุมัติ
- Test การปฏิเสธ
- ใช้ Playwright
- Mock API responses ด้วย MSW

โฟกัส:
tests/sales/order-approval.spec.ts
src/mocks/handlers.ts

ใช้ testing skill
```

### ตัวอย่าง 6: อัปเดต Types

```
ใช้ Loop Engineering Master Prompt

งาน:
เพิ่ม types สำหรับ Sales Planning module

ข้อกำหนด:
- สร้าง src/types/salesPlanning.ts
- Define PlanningBatch, PlanningRow, PlanningError types
- ย้าย inline types จาก salesPlanningService.ts
- อัปเดต imports

โฟกัส:
src/types/salesPlanning.ts
src/services/sales/salesPlanningService.ts

ใช้ database skill
```

### ตัวอย่าง 7: อัปเดต Documentation

```
ใช้ Loop Engineering Master Prompt

งาน:
อัปเดต api-map.md ด้วย Sales Reports endpoints ใหม่

ข้อกำหนด:
- Document GET /sales/reports/summary
- Document GET /sales/reports/by-customer
- Document GET /sales/reports/by-product
- Document GET /sales/reports/monthly
- ระบุ query parameters และ response types

โฟกัส:
.project-ai/api-map.md

ใช้ documentation skill
```

### ตัวอย่าง 8: Code Review

```
ใช้ Loop Engineering Master Prompt

งาน:
Review การเปลี่ยนแปลงล่าสุดของ production order lot split feature

ข้อกำหนด:
- ตรวจสอบ TypeScript errors
- ยืนยัน business logic ยังอยู่
- ตรวจสอบ duplicated code
- ยืนยัน API contracts ไม่เปลี่ยน
- ตรวจสอบ RBAC compliance

โฟกัส:
src/app/(admin)/production/orders/[id]/lots/split
src/services/productionOrdersService.ts

ใช้ code-review skill
```

### ตัวอย่าง 9: Mobile Responsiveness

```
ใช้ Loop Engineering Master Prompt

งาน:
ปรับปรุง mobile responsiveness ของหน้า material list

ข้อกำหนด:
- ไม่เปลี่ยน business logic
- เพิ่ม mobile-friendly table layout
- ทำ filters ให้ collapsible บน mobile
- ใช้ responsive components ที่มีอยู่

โฟกัส:
src/app/(admin)/pc/materials/page.tsx
src/components/pc/materials/MaterialListTable.tsx

ใช้ frontend-redesign skill
```

### ตัวอย่าง 10: ปรับปรุง Performance

```
ใช้ Loop Engineering Master Prompt

งาน:
ปรับปรุง performance หน้า Sales Order List

ข้อกำหนด:
- ลด re-renders ที่ไม่จำเป็น
- Optimize API calls
- รักษา UI behavior
- รักษา API contracts

โฟกัส:
src/app/(admin)/sales
src/components/sales
src/services/sales

ใช้ frontend-redesign + refactoring skills
```

---

## Quick Reference

```
UNDERSTAND → What is being asked?
PLAN       → How do I do it minimally?
IMPLEMENT  → Do it correctly
VERIFY     → Does it work?
REFLECT    → Document it
```
