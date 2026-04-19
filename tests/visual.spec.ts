import { test, expect } from "@playwright/test";
import routesData from "./routes.generated.json";
import { seedSession } from "./utils/session";

type RoutesJson = {
  routes: Array<{ path: string; sourceFile: string; requiresAuth: boolean }>;
};

const { routes } = routesData as RoutesJson;

const SKIP_PATHS = new Set<string>([
  // Add known-flaky/dynamic pages here as needed.
]);

function screenshotNameForPath(p: string) {
  if (p === "/") return "root.png";
  return `${p.replace(/^\//, "").replaceAll("/", "__")}.png`;
}

test.describe("visual regression (all routes)", () => {
  for (const route of routes) {
    const title = `${route.path} (${route.sourceFile})`;
    test(title, async ({ page }) => {
      if (SKIP_PATHS.has(route.path)) test.skip(true, "skipped by configuration");

      // Freeze time & randomness for pixel-identical output.
      await page.addInitScript((fixedNow) => {
        const OriginalDate = Date;
         
        class MockDate extends (OriginalDate as any) {
          constructor(...args: any[]) {
            // new Date() => fixed; new Date(x) => real
             
            super(args.length === 0 ? fixedNow : args[0], ...(args.length > 1 ? args.slice(1) : []));
          }
          static now() {
            return fixedNow;
          }
        }
         
        (MockDate as any).parse = OriginalDate.parse;
         
        (MockDate as any).UTC = OriginalDate.UTC;
         
        (window as any).Date = MockDate;

        Math.random = () => 0.42;
      }, 1_700_000_000_000);

      // Prevent third-party embeds from keeping the network busy forever.
      await page.route("**/*", (r) => {
        const url = r.request().url();
        if (
          url.includes("youtube.com") ||
          url.includes("googlevideo.com") ||
          url.includes("ytimg.com") ||
          url.includes("googleapis.com") ||
          url.includes("gstatic.com")
        ) {
          return r.abort();
        }
        return r.continue();
      });

      if (route.requiresAuth) {
        await seedSession(page);
      }

      await page.goto(route.path, { waitUntil: "load" });

      // If session-guard redirects, surface it clearly.
      if (route.requiresAuth) {
        await expect(page).not.toHaveURL(/\/signin$/);
      }

      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
      });

      await expect(page).toHaveScreenshot(screenshotNameForPath(route.path), {
        fullPage: true,
      });
    });
  }
});

