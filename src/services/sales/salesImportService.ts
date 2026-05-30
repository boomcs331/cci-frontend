import { apiFetch, apiFetchJson } from "@/utils/api";

export type ImportBatchStatus = "PENDING" | "VALIDATED" | "COMMITTED" | "FAILED";
export type ImportRowStatus = "PENDING" | "VALID" | "ERROR" | "COMMITTED";

export interface ImportRow {
  id: string;
  batchId: string;
  rowNumber: number;
  status: ImportRowStatus;
  orderGroup: string | null;
  customerCode: string | null;
  productCode: string | null;
  quantity: string | null;
  unitPrice: string | null;
  discount: string | null;
  requiredDate: string | null;
  deliveryDate: string | null;
  salesChannel: string | null;
  note: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface ImportBatch {
  id: string;
  batchCode: string;
  fileName: string;
  uploadedBy: number;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  committedRows: number;
  errorSummary: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
  committedAt: string | null;
  rows?: ImportRow[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ImportBatchesQuery {
  page?: number;
  pageSize?: number;
  status?: ImportBatchStatus;
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

export async function downloadImportTemplate(): Promise<Blob> {
  const res = await apiFetch("/sales/import/template");
  if (!res.ok) {
    throw new Error(`Failed to download template (${res.status})`);
  }
  return res.blob();
}

export async function uploadImportFile(
  file: File,
): Promise<ImportBatch> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/sales/import/upload", {
    method: "POST",
    body: formData,
  });

  return parseEnvelope<ImportBatch>(res);
}

export async function fetchImportBatches(
  query: ImportBatchesQuery,
): Promise<{ items: ImportBatch[]; pagination: Pagination }> {
  const res = await apiFetch(
    `/sales/import/batches${buildQuery(query as Record<string, unknown>)}`,
  );
  return parseEnvelope(res);
}

export async function fetchImportBatch(id: string): Promise<ImportBatch> {
  const res = await apiFetch(`/sales/import/batches/${id}`);
  return parseEnvelope<ImportBatch>(res);
}

export async function commitImportBatch(
  batchId: string,
): Promise<{ batchId: string; committedRows: number; totalRows: number }> {
  const res = await apiFetchJson<ApiEnvelope<{ batchId: string; committedRows: number; totalRows: number }>>(
    "/sales/import/commit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId }),
    },
  );
  return res.data;
}
