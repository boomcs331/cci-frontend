---
name: refactoring
description: Refactor existing CCI frontend code to improve maintainability without changing behavior. Use for cleaning up anti-patterns, extracting reusable code, or standardizing inconsistent patterns.
---

# Refactoring Skill

## Purpose
Improve code quality, reduce duplication, and standardize patterns across the codebase — without changing any behavior.

## When to Use
- Replacing direct `localStorage.getItem('session')` with `getSession()`
- Replacing local `ApiResponse` interfaces with import from `@/types/api`
- Standardizing service files to object pattern
- Extracting duplicated `URLSearchParams` pagination logic
- Extracting duplicated POST headers
- Moving inline types to `src/types/*`

## Pending Refactors (Priority Order)

| Priority | Issue | Files | Action |
|----------|-------|-------|--------|
| 🔴 High | Direct `localStorage.getItem('session')` | `pc/page.tsx`, `pc/outcome/page.tsx` | Replace with `getSession()` |
| 🟡 Medium | Local `ApiResponse` interface | 6 master-data pages | Import from `@/types/api` |
| 🟡 Medium | Inconsistent service pattern | `productionOrdersService.ts` | Convert to object pattern |
| 🟢 Low | Duplicated `URLSearchParams` pagination | `materialService.ts`, `receivingService.ts` | Extract `buildPaginationParams()` |
| 🟢 Low | Duplicated POST headers | 20+ locations | Extract `jsonBody()` helper |

## Workflow

1. **Identify** one specific anti-pattern to fix (do not mix multiple)
2. **Read** all affected files
3. **Verify** behavior is identical before/after
4. **Make change** file by file
5. **Run** `pnpm build` to confirm no type errors
6. **Run** `pnpm test:e2e` to confirm no regressions

## Example: Fix direct localStorage session access

```typescript
// BEFORE — in pc/page.tsx
useEffect(() => {
  const session = localStorage.getItem('session');
  if (session) {
    const parsedSession = JSON.parse(session);
    setCurrentUser(parsedSession.user?.username || 'admin');
  }
}, []);

// AFTER
import { getSession } from '@/utils/session';

useEffect(() => {
  const session = getSession();
  setCurrentUser(session?.user?.username ?? 'admin');
}, []);
```

## Example: Extract buildPaginationParams

```typescript
// src/utils/queryParams.ts (new utility)
export function buildPaginationParams(
  page: number,
  limit: number,
  filters?: Record<string, unknown>,
): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
  }
  return params;
}
```

## Checklist
- [ ] Behavior is **exactly the same** before and after
- [ ] One anti-pattern at a time — no mixed refactors
- [ ] `pnpm build` passes
- [ ] `pnpm test:e2e` passes
- [ ] No new functionality added during refactor
- [ ] No design changes during refactor

## Constraints
- **Never** refactor code that is not part of the current task
- **Never** change API endpoint paths during refactor
- **Never** change component output/rendering during refactor
- If refactor introduces risk, split into smaller steps
