---
name: code-review
description: Review code changes in the CCI frontend for correctness, consistency, and adherence to project rules. Use before merging or after implementing changes.
---

# Code Review Skill

## Purpose
Ensure code quality, consistency with existing patterns, and absence of anti-patterns before changes are merged.

## When to Use
- Before committing new features
- After AI-generated code
- When reviewing pull requests
- Periodic code quality audits

## Workflow

1. **Read** `.project-ai/coding-rules.md` — review criteria checklist
2. **Read** `.project-ai/domain-rules.md` — business rule violations
3. **Scan** changed files for anti-patterns
4. **Report** findings categorized by severity
5. **Suggest** minimal fixes — reference existing patterns

## Review Checklist

### Critical (must fix before merge)
- [ ] No `fetch()` calls — only `apiFetch` / `apiFetchJson`
- [ ] No direct `localStorage.getItem('session')` — use `getSession()`
- [ ] No hardcoded URLs like `http://localhost:3006`
- [ ] No `any` types
- [ ] No local `ApiResponse` interface duplicates
- [ ] `setSession()` has change-check guard
- [ ] All async functions have `try/catch`
- [ ] New routes added to `ROUTES` constant and `accessControl.ts`

### High (should fix)
- [ ] No hardcoded permission strings — use `PERMISSIONS.*`
- [ ] No hardcoded route strings — use `ROUTES.*`
- [ ] Service functions use object pattern
- [ ] `import type` used for type-only imports
- [ ] `useEffect` has correct dependency array
- [ ] `useCallback` wraps async fetchers
- [ ] Shared components used for loading/error/empty states

### Medium (nice to fix)
- [ ] `@/*` aliases used instead of relative paths
- [ ] Toast uses `publishToast()` not `alert()`
- [ ] Date formatted with `th-TH` locale
- [ ] Boolean states use `is/has/can` naming prefix
- [ ] New components added to correct folder

### Low (optional)
- [ ] Comments added for non-obvious logic
- [ ] Types are specific (no `string` where enum exists)
- [ ] Magic numbers extracted to constants

## Report Format

```markdown
## Code Review Report

### Critical
- [file:line] Description of issue → suggested fix

### High
- [file:line] Description of issue → suggested fix

### Passed
- No issues found in: [list of areas checked]
```

## Constraints
- Suggest minimal fixes — not full rewrites
- Reference the existing codebase for pattern examples
- Never suggest adding new dependencies for solved problems
