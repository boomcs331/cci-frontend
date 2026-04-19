import { http, HttpResponse } from "msw";

function json(data: unknown, init?: ResponseInit) {
  return HttpResponse.json(data, {
    status: 200,
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function emptyPaginated(page = 1, limit = 10) {
  return {
    success: true,
    data: {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

function emptyList() {
  return { success: true, data: [] };
}

function emptyObject() {
  return { success: true, data: {} };
}

export const handlers = [
  // Auth
  http.post(/\/auth\/login$/, async () =>
    json({
      token: "test-token",
      user: { id: "1", roles: [{ id: "1", permissions: [{ code: "*" }] }] },
    })
  ),
  http.get(/\/auth\/profile$/, async () => json({ success: true, data: { id: "1" } })),

  // Masters (many pages expect result.data.data + pagination fields)
  http.get(/\/masters\/.*$/, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");

    // /all endpoints usually return arrays
    if (url.pathname.endsWith("/all")) return json(emptyList());

    return json(emptyPaginated(page, limit));
  }),

  // Materials
  http.get(/\/materials\/all$/, async () => json(emptyList())),
  http.get(/\/materials\/stock$/, async () => json({ success: true, data: [] })),
  http.get(/\/materials(\/\d+)?$/, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    if (/\/materials\/\d+$/.test(url.pathname)) return json({ success: true, data: null });
    return json({
      success: true,
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }),

  // Production plans / orders
  http.get(/\/production-plans$/, async () => json({ success: true, data: [] })),
  http.get(/\/production-plans\/\d+\/details$/, async () => json({ success: true, data: {} })),
  http.post(/\/production-plans\/\d+\/confirm-and-issue$/, async () => json({ success: true })),
  http.post(/\/production-plans\/\d+\/generate-product-qr-orders$/, async () => json({ success: true, data: [] })),
  http.get(/\/production-orders(\?.*)?$/, async () => json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
  http.get(/\/production-orders\/\d+$/, async () => json({ success: true, data: null })),
  http.get(/\/production-orders\/processes\/all$/, async () => json(emptyList())),

  // Products
  http.get(/\/products(\?.*)?$/, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    return json(emptyPaginated(page, limit));
  }),
  http.get(/\/products\/\d+$/, async () => json({ success: true, data: null })),
  http.get(/\/products\/\d+\/production-steps$/, async () => json({ success: true, data: [] })),

  // Fallback: keep pages from hard-crashing.
  http.get(/\/.*/, async () => json(emptyObject())),
];

