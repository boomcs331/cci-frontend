# AGENTS.md — CCI Frontend

Primary instruction source for AI agents working on this project.  
**Read this file before every task.**

---

## Before Every Task

1. Read `.project-ai/project-context.md` — understand the system
2. Read `.project-ai/architecture.md` — understand data flow
3. Read `.project-ai/coding-rules.md` — understand conventions
4. Read `.project-ai/domain-rules.md` — understand business rules
5. Identify affected modules and files
6. Make a minimal plan
7. Implement with targeted changes only
8. Verify: `pnpm build` must pass
9. Summarize impact

---

## Never

- Break existing business logic
- Remove or disable existing features
- Change API endpoint paths or response shapes (backward compatibility)
- Refactor code unrelated to the current task
- Use `fetch()` directly — always use `apiFetch` / `apiFetchJson`
- Access `localStorage` directly for session — use `getSession()`
- Use `any` TypeScript type
- Hardcode URLs, route strings, or permission codes
- Call `setSession()` without first checking if data changed
- Add `alert()` — always use `publishToast()`
- Define `ApiResponse` interface locally — import from `@/types/api`
- Deploy to production without explicit user approval

---

## Always

- Reuse existing patterns before creating new ones
- Import types from `@/types/*`
- Use `PERMISSIONS.*` from `@/constants/permissions`
- Use `ROUTES.*` from `@/constants/routes`
- Use shared components from `@/components/shared`
- Add `try/catch/finally` to every async function
- Wrap `useSearchParams` pages in `<React.Suspense>`
- Add new routes to both `ROUTES` constant and `accessControl.ts`
- Use object pattern for service files
- Keep changes minimal and scoped

---

## Skill Selection Guide

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

## Project Quick Reference

```
Framework:   Next.js 16, React 19, TypeScript (strict)
Styling:     TailwindCSS 4 + Material UI 6
Backend:     NestJS at :3006 (proxied via Next.js rewrites)
Auth:        JWT in localStorage session, 1-hour expiry
RBAC:        Permission + department based, see accessControl.ts
Dev server:  pnpm dev  (port 3000)
Build check: pnpm build
E2E tests:   pnpm test:e2e
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/api.ts` | **All** API calls go through here |
| `src/utils/session.ts` | **All** session reads/writes go through here |
| `src/utils/accessControl.ts` | Route permission policies |
| `src/hooks/useSessionCheck.ts` | Auth guard (in every admin page) |
| `src/app/(admin)/layout.tsx` | Admin layout — do not break |
| `next.config.ts` | Proxy config — do not change rewrites |
| `.env.local` | Env vars — do not hardcode these values |
| `src/constants/permissions.ts` | All permission codes |
| `src/constants/routes.ts` | All route paths |
| `src/components/shared/` | Shared UI components |

---

## Loop Engineering Workflow

Follow `.project-ai/loop-engineering.md` for every non-trivial task:

```
UNDERSTAND → PLAN → IMPLEMENT → VERIFY → REFLECT
```

---

## Environment Variables

| Variable | Value | Do Not Hardcode |
|----------|-------|----------------|
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | ✅ Use `getApiBaseUrl()` |
| `NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT` | `/auth/login` | ✅ Use env var |
| `BACKEND_INTERNAL_URL` | `http://127.0.0.1:3006` | ✅ Configured in next.config.ts |

---

## Verification Commands

```bash
pnpm build          # TypeScript compile check (must pass before commit)
pnpm lint           # ESLint check
pnpm dev            # Start dev server for manual testing
pnpm test:e2e       # Playwright E2E tests
pnpm routes:gen     # Regenerate routes.generated.json after adding pages
```
