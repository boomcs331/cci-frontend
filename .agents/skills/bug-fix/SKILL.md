---
name: bug-fix
description: Diagnose and fix bugs in the CCI frontend. Use when something is broken, behaving incorrectly, or causing errors in the browser.
---

# Bug Fix Skill

## Purpose
Find the root cause of a bug and apply a minimal, targeted fix without breaking other functionality.

## When to Use
- Page crashes or shows an error boundary
- Infinite re-render / refresh loop
- Wrong data displayed
- API call failing unexpectedly
- Permission redirect not working correctly
- Session expiry not behaving correctly

## Workflow

1. **Reproduce** — understand exactly when the bug occurs
2. **Read** `.project-ai/domain-rules.md` — verify expected behavior
3. **Read** `.project-ai/architecture.md` — trace the data flow
4. **Locate** root cause (not symptom) — search relevant files
5. **Implement** minimal fix — one targeted change
6. **Verify** fix resolves issue without side effects
7. **Check** related paths (same component used elsewhere?)

## Known Bug Patterns

| Symptom | Likely Cause | Fix Location |
|---------|-------------|-------------|
| Infinite page refresh | `setSession()` called unconditionally | `useSessionCheck.ts` — compare before update |
| 401 redirect on login page | Auth endpoint not in bypass list | `api.ts` `AUTH_BYPASS_ENDPOINTS` |
| Session lost on refresh | Using `fetch()` directly (no auth headers) | Replace with `apiFetch()` |
| Wrong department data | Missing `x-department-id` header | Check `applySessionAuthHeaders` or service call |
| Permission denied on valid user | Route not in `accessControl.ts` | Add to `ROUTE_POLICIES` |
| Data not refreshing after save | `fetchData()` not called after mutation | Add `void fetchData()` after success |
| Type error on build | `any` type or missing import | Fix type, import from `@/types/*` |
| `localStorage` error SSR | Direct localStorage in non-client code | Wrap with `typeof window !== 'undefined'` check |

## Checklist
- [ ] Root cause identified (not just symptom)
- [ ] Minimal change — no unnecessary refactoring
- [ ] Existing tests still pass (`pnpm test:e2e`)
- [ ] `pnpm build` passes
- [ ] Related usages checked (grep for the changed function)
- [ ] No new anti-patterns introduced

## Constraints
- Fix only what is broken — never refactor unrelated code during a bug fix
- Never remove error handling
- Never change API contracts to work around a bug
- Add a comment explaining the fix if it's non-obvious

## Example
> Bug: Page refreshes infinitely after login

Root cause: `setSession()` dispatches `SESSION_UPDATED_EVENT` → triggers re-render → `useEffect` in `useSessionCheck` runs again → fetches `/auth/menu` → calls `setSession()` again.

Fix: Compare menus before calling `setSession()`:
```typescript
const menusChanged = JSON.stringify(session.menus) !== JSON.stringify(newMenus);
if (menusChanged) {
  setSession({ ...session, menus: newMenus });
}
```
