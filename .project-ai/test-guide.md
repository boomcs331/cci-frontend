# Test Guide — CCI Frontend

---

## Existing Tests

### 1. Visual Regression — `tests/visual.spec.ts`

**Framework**: Playwright  
**Type**: Screenshot comparison (pixel-level)

**What it does:**
- Reads all routes from `tests/routes.generated.json`
- Seeds mock session for auth-required routes via `tests/utils/session.ts`
- Freezes `Date.now()` to `1_700_000_000_000` and `Math.random()` to `0.42` for deterministic output
- Blocks external CDN resources (YouTube, Google APIs)
- Takes full-page screenshots and compares to stored baselines in `tests/visual.spec.ts-snapshots/`

**Skip list**: `SKIP_PATHS` set in the file — add flaky/dynamic pages here.

### 2. Dashboard Redesign — `tests/dashboard-redesign.spec.ts`

Playwright test covering dashboard-specific visual states and interactions.

### 3. Routes Generated — `tests/routes.generated.json`

Auto-generated JSON listing all app routes with:
- `path` — URL path
- `sourceFile` — source page file
- `requiresAuth` — whether session is needed

Regenerate with:
```bash
pnpm routes:gen
```

---

## How to Run Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test tests/visual.spec.ts

# Update visual snapshots (after intentional UI changes)
pnpm exec playwright test --update-snapshots

# Run headed (see browser)
pnpm exec playwright test --headed

# Run with UI mode (interactive)
pnpm exec playwright test --ui
```

### Prerequisites
- Dev or prod server must be running on port 3000
- Backend must be reachable (or MSW mocks active)

```bash
# Start dev server first
pnpm dev

# In another terminal
pnpm test:e2e
```

---

## API Mocking — MSW

**Library**: MSW (Mock Service Worker) v2.13.2  
**Location**: `src/mocks/`  
**Loader**: `src/mocks/MswLoader.tsx` — auto-loaded in `RootLayout`

MSW intercepts API requests in development/test.  
Mock handlers defined in `src/mocks/` — add handlers here for new endpoints.

Worker file: `public/mockServiceWorker.js`

---

## Test Session Seeding

`tests/utils/session.ts` provides `seedSession(page)`:
- Injects a mock session into `localStorage` before page navigation
- Simulates a logged-in user with default permissions

---

## Missing Test Areas

| Area | Risk | Recommendation |
|------|------|---------------|
| Unit tests (utils) | High | Add unit tests for `session.ts`, `api.ts`, `accessControl.ts` |
| Service layer | Medium | Mock `apiFetch`, test service functions |
| Form validation | Medium | Test form submit/validation edge cases |
| Sales order workflow | High | E2E test full lifecycle: DRAFT → APPROVED → COMPLETED |
| Multi-department flow | High | E2E test department selection and header injection |
| Permission enforcement | High | Test that restricted routes redirect non-authorized users |
| Mobile responsiveness | Low | Viewport-specific visual tests |

---

## Recommended Test Strategy

### Unit Tests (Vitest — not yet installed)
Priority files to add unit tests:
1. `src/utils/session.ts` — expiry, multi-dept logic
2. `src/utils/accessControl.ts` — RBAC policy evaluation
3. `src/utils/api.ts` — header injection, error handling
4. `src/constants/permissions.ts` — `hasPermission`, `hasAnyPermission`

```bash
# Install Vitest (not yet in project)
pnpm add -D vitest @testing-library/react @testing-library/user-event
```

### E2E Tests (Playwright — already installed)
Priority flows to add:
1. **Login flow** — valid/invalid credentials, department selection
2. **PC Income** — create receiving, verify QR generation
3. **Sales Order lifecycle** — full DRAFT → COMPLETED flow
4. **Permission denied** — verify redirect for unauthorized routes
5. **Session expiry** — simulate timeout, verify redirect to /signin

### Visual Regression (already configured)
- Baseline snapshots stored in `tests/visual.spec.ts-snapshots/`
- Update snapshots intentionally with `--update-snapshots` flag
- Do NOT update snapshots for unintended changes

---

## Playwright Config — `playwright.config.ts`

```typescript
// Key settings (see full file for details)
baseURL: 'http://localhost:3000'
testDir: './tests'
reporter: [['html'], ['list']]
```

Test results: `test-results/`  
HTML report: `playwright-report/`
