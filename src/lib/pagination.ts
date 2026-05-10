/**
 * Shared pagination helpers for URL-based list pages (?page=&limit=).
 */

export type PaginationSlice = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Query source for `createPaginationHrefBuilder` (e.g. `useSearchParams()`).
 */
export type PaginationQuerySource = URLSearchParams | string | { toString(): string };

/**
 * Build a href builder that keeps every query param except overwrites `page` and `limit`.
 */
export function createPaginationHrefBuilder(
  currentQuery: PaginationQuerySource,
  limit: number,
): (targetPage: number) => string {
  return (targetPage: number) => {
    const params = new URLSearchParams(
      typeof currentQuery === "string" ? currentQuery : currentQuery.toString(),
    );
    params.set("page", String(targetPage));
    params.set("limit", String(limit));
    const s = params.toString();
    return s ? `?${s}` : "?";
  };
}

/**
 * Visible page numbers for numeric links (sliding window, same rules as PaginationFooter).
 */
export function getPaginationPageNumbers(
  currentPage: number,
  totalPages: number,
  maxButtons: number,
): number[] {
  const tp = Math.max(1, totalPages);
  const safe = Math.min(Math.max(1, currentPage), tp);
  const n = Math.min(maxButtons, tp);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const pageNum = i + Math.max(safe - 2, 1);
    if (pageNum <= tp) out.push(pageNum);
  }
  return out;
}
