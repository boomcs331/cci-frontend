import { expect, test } from "@playwright/test";
import { seedSession } from "./utils/session";

const dashboardSections = [
  "dashboard-command-bar",
  "dashboard-metrics",
  "dashboard-alerts",
  "dashboard-trends",
  "dashboard-operations",
  "dashboard-shortcuts",
] as const;

test.beforeEach(async ({ page }) => {
  await seedSession(page);
  await page.goto("/", { waitUntil: "load" });
  await expect(page).not.toHaveURL(/\/signin$/);
});

test("shows the redesigned dashboard sections", async ({ page }) => {
  for (const testId of dashboardSections) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "ภาพรวมการดำเนินงาน" })).toBeVisible();
  await expect(page.getByText("ช่วงเวลาสำหรับแผนและคำสั่งผลิต")).toBeVisible();
});

test("keeps the dashboard within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "load" });

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.getByTestId("dashboard-command-bar")).toBeVisible();
});
