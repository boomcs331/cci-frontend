# Loop Engineering — CCI Frontend

AI development workflow using the Loop Engineering methodology.  
Every task must pass through all 5 phases sequentially.

---

## Phase 1: UNDERSTAND

**Goal**: Build full context before writing a single line of code.

### Inputs
- User task description
- Affected module (PC / Production / Sales / Master Data / Users)
- Referenced files or components

### Checklist
- [ ] Read `.project-ai/project-context.md`
- [ ] Read `.project-ai/architecture.md`
- [ ] Read `.project-ai/coding-rules.md`
- [ ] Read `.project-ai/domain-rules.md`
- [ ] Read relevant section of `.project-ai/api-map.md`
- [ ] Read source files for affected module
- [ ] Identify all files that will need to change
- [ ] Identify all downstream effects (other components using changed code)

### Outputs
- Summary of what needs to change and why
- List of affected files
- Identified risks or constraints

### Success Criteria
- No ambiguity about what the task requires
- All domain rules for the affected area understood
- Scope is minimal and clearly defined

---

## Phase 2: PLAN

**Goal**: Create a minimal, targeted implementation plan.

### Inputs
- Output from Phase 1
- Existing patterns from codebase

### Checklist
- [ ] Identify existing pattern to reuse (service? shared component? hook?)
- [ ] Write step-by-step implementation plan (max 7 steps)
- [ ] Confirm no changes to business logic outside task scope
- [ ] Confirm no new dependencies needed (use existing libs)
- [ ] Confirm backward compatibility preserved
- [ ] Identify what tests are needed

### Outputs
- Ordered implementation steps
- List of new files (if any)
- List of modified files
- Test approach

### Success Criteria
- Plan uses existing patterns
- Minimal file changes
- No unnecessary refactoring

---

## Phase 3: IMPLEMENT

**Goal**: Execute the plan with minimal, targeted changes.

### Inputs
- Plan from Phase 2
- Source files read in Phase 1

### Checklist
- [ ] Follow coding-rules.md for every file touched
- [ ] Use `@/types/*` — no local type duplicates
- [ ] Use `PERMISSIONS.*` and `ROUTES.*` constants
- [ ] Use `apiFetch` / `apiFetchJson` — no direct fetch
- [ ] Use `getSession()` — no direct localStorage
- [ ] Use shared components — no custom loading/error UI
- [ ] Add `try/catch/finally` to every async function
- [ ] Wrap pages with `useSearchParams` in `<React.Suspense>`
- [ ] New routes added to `ROUTES` constant and `accessControl.ts`
- [ ] New services use object pattern

### Outputs
- Changed files (minimal diff)
- New files (if unavoidable)

### Success Criteria
- Code passes TypeScript strict check (`pnpm build`)
- No `any` types introduced
- No new anti-patterns introduced

---

## Phase 4: VERIFY

**Goal**: Confirm the implementation works correctly and safely.

### Inputs
- Changed files from Phase 3

### Checklist
- [ ] TypeScript compiles: `pnpm build` (no errors)
- [ ] Lint passes: `pnpm lint`
- [ ] Feature works in dev server: `pnpm dev`
- [ ] Affected routes accessible (no infinite redirect)
- [ ] Permission guard works (non-authorized user redirected)
- [ ] No `console.error` in browser dev tools
- [ ] Visual regression not broken (check screenshots)
- [ ] Session expiry still works (no loop)

### Outputs
- Verification results
- List of any issues found

### Success Criteria
- Build passes with 0 errors
- Feature behaves as specified
- No regressions in related areas

---

## Phase 5: REFLECT

**Goal**: Document decisions and update knowledge base.

### Inputs
- Completed implementation
- Any discoveries made during the task

### Checklist
- [ ] Update `.project-ai/api-map.md` if new endpoints used
- [ ] Update `.project-ai/domain-rules.md` if new business rules discovered
- [ ] Update `.project-ai/database-map.md` if new data shapes found
- [ ] Note any anti-patterns found in codebase for future cleanup
- [ ] Note any risks or tech debt introduced (with TODO comment)
- [ ] Summarize impact for the user

### Outputs
- Impact summary
- Updated knowledge files (if needed)
- List of future improvements (tech debt)

### Success Criteria
- Knowledge base reflects current state
- Next AI agent can understand what was changed and why

---

## Quick Reference

```
UNDERSTAND → what is being asked?
PLAN       → how do I do it minimally?
IMPLEMENT  → do it correctly
VERIFY     → does it work?
REFLECT    → document it
```

## Common Failure Modes

| Failure | Cause | Prevention |
|---------|-------|-----------|
| Infinite re-render | `setSession()` without change check | Always compare before calling |
| Permission denied on new page | Route not in `accessControl.ts` | Phase 2 checklist: add to `ROUTE_POLICIES` |
| Type error on build | Local interface duplicating `@/types` | Phase 3: import from `@/types/*` |
| 401 loop | Wrong auth endpoint used with `apiFetch` | Add to `AUTH_BYPASS_ENDPOINTS` if public |
| Session not attached | Using `fetch()` directly | Always use `apiFetch` |
| Stale data after submit | `fetchData()` not called after mutation | Call `void fetchData()` after success |
