import { apiFetch, apiFetchJson } from "@/utils/api";

export type SalesOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export interface SalesOrderListItem {
  id: string;
  orderNo: string;
  customerId: number;
  salesUserId: string | null;
  status: SalesOrderStatus;
  salesChannel: string | null;
  orderDate: string;
  deliveryDate: string | null;
  requiredDate?: string | null;
  grandTotal: string;
  subtotal?: string;
  discountTotal?: string;
  note?: string | null;
  createDate: string;
  customer?: { id: number; name: string; code: string } | null;
}

export interface OrderItemRow {
  id: string;
  productId: number;
  quantity: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
  product?: { id: number; productCode: string; productName: string };
}

export interface StatusHistoryRow {
  id: string;
  fromStatus: SalesOrderStatus | null;
  toStatus: SalesOrderStatus;
  reason: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface ApprovalRow {
  id: string;
  decision: "APPROVED" | "REJECTED";
  reason: string | null;
  approverId: string;
  decidedAt: string;
}

export interface StockMovementRow {
  id: string;
  productId: number;
  movement: "IN" | "OUT" | "RESERVE" | "RELEASE";
  quantity: string;
  note: string | null;
  createDate: string;
}

export interface SalesOrderDetail extends SalesOrderListItem {
  items: OrderItemRow[];
  history: StatusHistoryRow[];
  approvals?: ApprovalRow[];
  stockMovements?: StockMovementRow[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrdersQuery {
  search?: string;
  status?: SalesOrderStatus | "";
  customerId?: string;
  salesUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateOrderInput {
  customerId: number;
  salesChannel?: string;
  orderDate?: string;
  requiredDate?: string;
  deliveryDate?: string;
  note?: string;
  status?: "DRAFT" | "PENDING";
  items: CreateOrderItemInput[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      (body as { message?: string })?.message ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  return body.data;
}

export async function fetchSalesOrders(
  query: OrdersQuery,
): Promise<{ items: SalesOrderListItem[]; pagination: Pagination }> {
  const res = await apiFetch(`/sales/orders${buildQuery(query as Record<string, unknown>)}`);
  return parseEnvelope(res);
}

export async function fetchPendingApprovals(
  query: OrdersQuery,
): Promise<{ items: SalesOrderListItem[]; pagination: Pagination }> {
  const res = await apiFetch(
    `/sales/orders/pending-approval${buildQuery(query as Record<string, unknown>)}`,
  );
  return parseEnvelope(res);
}

export async function fetchSalesOrder(id: string): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(`/sales/orders/${id}`).then(
    (b) => b.data,
  );
}

export async function createSalesOrder(
  input: CreateOrderInput,
): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>("/sales/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((b) => b.data);
}

export async function submitSalesOrder(id: string): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(
    `/sales/orders/${id}/submit`,
    { method: "POST" },
  ).then((b) => b.data);
}

export async function approveSalesOrder(id: string): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(
    `/sales/orders/${id}/approve`,
    { method: "POST" },
  ).then((b) => b.data);
}

export async function rejectSalesOrder(
  id: string,
  reason: string,
): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(
    `/sales/orders/${id}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  ).then((b) => b.data);
}

export async function cancelSalesOrder(
  id: string,
  reason?: string,
): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(
    `/sales/orders/${id}/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason ?? undefined }),
    },
  ).then((b) => b.data);
}

export async function advanceSalesOrderStatus(
  id: string,
  status: "PROCESSING" | "SHIPPING" | "COMPLETED",
  note?: string,
): Promise<SalesOrderDetail> {
  return apiFetchJson<ApiEnvelope<SalesOrderDetail>>(
    `/sales/orders/${id}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    },
  ).then((b) => b.data);
}

export async function exportOrdersToExcel(
  query: OrdersQuery,
): Promise<Blob> {
  const res = await apiFetch(`/sales/orders/export${buildQuery(query as Record<string, unknown>)}`);
  if (!res.ok) {
    throw new Error(`Failed to export orders (${res.status})`);
  }
  return res.blob();
}

export async function exportOrdersToPDF(
  query: OrdersQuery,
): Promise<Blob> {
  const res = await apiFetch(`/sales/orders/export/pdf${buildQuery(query as Record<string, unknown>)}`);
  if (!res.ok) {
    throw new Error(`Failed to export orders to PDF (${res.status})`);
  }
  return res.blob();
}
