import type { Page } from "@playwright/test";

type TestSession = {
  token: string;
  user: {
    id: string;
    email: string;
    roles: Array<{
      id: string;
      permissions: Array<{ code: string }>;
    }>;
  };
  expiresAt: number;
};

export async function seedSession(page: Page, opts?: { isAdmin?: boolean }) {
  // Fixed timestamp for deterministic screenshots (avoid time-dependent UI diffs).
  const now = 1_700_000_000_000;
  const isAdmin = opts?.isAdmin ?? true;

  const session: TestSession = {
    token: "test-token",
    user: {
      id: "1",
      email: "test@example.com",
      roles: [
        {
          id: isAdmin ? "1" : "2",
          permissions: [{ code: "*" }],
        },
      ],
    },
    expiresAt: now + 60 * 60 * 1000,
  };

  await page.addInitScript((value) => {
    window.localStorage.setItem("session", JSON.stringify(value));
  }, session);
}

