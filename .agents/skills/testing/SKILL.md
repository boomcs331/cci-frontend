---
name: testing
description: Write, run, or improve tests for the CCI frontend. Use when adding Playwright E2E tests, updating visual snapshots, or creating unit tests for utilities.
---

# Testing Skill

## Purpose
Verify that features work correctly and prevent regressions through automated tests.

## When to Use
- Adding E2E tests for new features
- Updating visual regression snapshots after intentional UI changes
- Writing unit tests for utility functions
- Debugging failing tests

## Workflow

1. **Read** `.project-ai/test-guide.md` — understand test infrastructure
2. **Read** `playwright.config.ts` — understand test configuration
3. **Read** `tests/utils/session.ts` — understand session seeding
4. **Identify** test type needed (E2E vs unit vs visual)
5. **Write** test using existing patterns
6. **Run** test: `pnpm test:e2e`
7. **Update snapshots** if visual change is intentional: `--update-snapshots`

## E2E Test Pattern (Playwright)

```typescript
import { test, expect } from '@playwright/test';
import { seedSession } from './utils/session';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
    await page.goto('/target-route');
  });

  test('should display data correctly', async ({ page }) => {
    await expect(page.getByRole('heading')).toContainText('Expected Title');
    await expect(page.getByTestId('data-table')).toBeVisible();
  });

  test('should submit form successfully', async ({ page }) => {
    await page.getByRole('button', { name: 'เพิ่มใหม่' }).click();
    await page.getByLabel('รหัส').fill('TEST001');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText('บันทึกสำเร็จ')).toBeVisible();
  });
});
```

## Visual Regression Pattern

```typescript
// Add to tests/visual.spec.ts SKIP_PATHS if page is flaky
const SKIP_PATHS = new Set<string>([
  '/pc/production-tracking', // flaky due to real-time data
]);

// Update snapshots after intentional UI change
// pnpm exec playwright test --update-snapshots
```

## Session Seeding

```typescript
import { seedSession } from './utils/session';

// Seeds mock session with default admin permissions
await seedSession(page);

// For department-specific tests, seed with specific dept
await page.evaluate((dept) => {
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  session.activeDepartmentId = dept;
  localStorage.setItem('session', JSON.stringify(session));
}, 'PC_DEPT_ID');
```

## Checklist
- [ ] Test covers happy path + at least one error path
- [ ] Auth-required routes use `seedSession()`
- [ ] Assertions are specific (text content, visibility, URL)
- [ ] No `page.waitForTimeout()` — use `waitFor` selectors instead
- [ ] Test names are descriptive in Thai/English
- [ ] `pnpm test:e2e` passes locally

## Constraints
- Never delete existing passing tests
- Never update snapshots without explicitly confirming the visual change is intentional
- Do not write tests that depend on external backend — use MSW mocks
- Keep test files in `tests/` directory only

## Commands

```bash
pnpm test:e2e                          # Run all tests
pnpm exec playwright test visual.spec.ts   # Run specific file
pnpm exec playwright test --update-snapshots  # Update baselines
pnpm exec playwright test --headed        # See browser
pnpm exec playwright test --ui            # Interactive UI mode
pnpm exec playwright show-report          # View HTML report
```
