import fs from "node:fs";
import path from "node:path";

type RouteInfo = {
  /** Normalized URL path (dynamic segments mapped to fixtures). */
  path: string;
  /** Source page file. */
  sourceFile: string;
  /** True when path is likely protected by session-check. */
  requiresAuth: boolean;
};

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, "src", "app");

const PUBLIC_PATHS = new Set(["/signin", "/signup", "/reset-password", "/error-404"]);

function isGroupSegment(seg: string) {
  return seg.startsWith("(") && seg.endsWith(")");
}

function normalizeToUrlSegments(relativeDir: string) {
  const rawSegments = relativeDir.split(path.sep).filter(Boolean);

  const urlSegments: string[] = [];
  for (const seg of rawSegments) {
    if (isGroupSegment(seg)) continue;
    if (seg === "page.tsx") continue;

    // dynamic segments → deterministic fixtures
    if (/^\[\.\.\.[^\]]+\]$/.test(seg)) {
      urlSegments.push("fixture");
      continue;
    }
    if (/^\[[^\]]+\]$/.test(seg)) {
      urlSegments.push("1");
      continue;
    }

    urlSegments.push(seg);
  }

  return urlSegments;
}

function walk(dir: string, out: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.isFile() && entry.name === "page.tsx") {
      out.push(full);
    }
  }
}

function toRouteInfo(pageFile: string): RouteInfo {
  const relFromApp = path.relative(APP_DIR, pageFile);
  const relDir = path.dirname(relFromApp);
  const segments = normalizeToUrlSegments(relDir);
  const urlPath = `/${segments.join("/")}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  return {
    path: urlPath,
    sourceFile: path.relative(PROJECT_ROOT, pageFile).replace(/\\/g, "/"),
    requiresAuth: !PUBLIC_PATHS.has(urlPath) && !urlPath.startsWith("/error-"),
  };
}

function main() {
  if (!fs.existsSync(APP_DIR)) {
    throw new Error(`Expected Next app dir at ${APP_DIR}`);
  }

  const pages: string[] = [];
  walk(APP_DIR, pages);

  const routes = pages.map(toRouteInfo).sort((a, b) => a.path.localeCompare(b.path));

  const outDir = path.join(PROJECT_ROOT, "tests");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "routes.generated.json");
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 2));

  // eslint-disable-next-line no-console
  console.log(`Wrote ${routes.length} routes to ${path.relative(PROJECT_ROOT, outFile)}`);
}

main();

