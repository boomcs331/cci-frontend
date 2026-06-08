import { apiFetch, apiFetchJson } from "@/utils/api";

export interface PlanningBatch {
  id: number;
  batchCode: string;
  year: number;
  month: number;
  status: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  fileName: string;
  uploadedAt: string;
  processedAt: string | null;
  processingDurationMs: number | null;
  errorSummary?: {
    validationErrors: number;
    businessRuleErrors: number;
    byErrorCode: Record<string, number>;
    skippedRows: number;
  };
}

export interface PlanningError {
  id: number;
  rowNumber: number;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  fieldName: string;
  fieldValue: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  errorDetails?: {
    expectedTotal?: number;
    actualTotal?: number;
    difference?: number;
  };
}

export interface PlanningRow {
  id: number;
  customerCode: string;
  customerName?: string;
  productCode: string;
  productName?: string;
  model?: string;
  saleDate: string;
  quantity: number;
  status?: 'VALID' | 'INVALID' | 'SKIPPED';
}

export interface PlanningBatchStatus {
  batchId: number;
  batchCode: string;
  status: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  uploadedAt: string;
  processedAt: string | null;
  processingDurationMs: number | null;
  errorSummary?: {
    validationErrors: number;
    businessRuleErrors: number;
    byErrorCode: Record<string, number>;
    skippedRows: number;
  };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PlanningBatchesResponse {
  batches: PlanningBatch[];
  total: number;
  skip: number;
  take: number;
}

export interface PlanningDataResponse {
  rows: PlanningRow[];
  total: number;
  filters: {
    year?: number;
    month?: number;
    customerCode?: string;
    productCode?: string;
    startDate?: string;
    endDate?: string;
  };
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

export const salesPlanningService = {
  // Download template
  async downloadTemplate(): Promise<Blob> {
    const res = await apiFetch("/sales-planning/template");
    if (!res.ok) {
      throw new Error(`Failed to download template (${res.status})`);
    }
    return res.blob();
  },

  // Upload file
  async uploadFile(file: File, year: number, month: number): Promise<PlanningBatch> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", year.toString());
    formData.append("month", month.toString());

    const res = await apiFetch("/sales-planning/import", {
      method: "POST",
      body: formData,
    });

    return parseEnvelope<PlanningBatch>(res);
  },

  // Get batch status
  async getBatchStatus(batchId: number): Promise<PlanningBatchStatus> {
    const res = await apiFetch(`/sales-planning/import/${batchId}/status`);
    return parseEnvelope<PlanningBatchStatus>(res);
  },

  // Get batch errors
  async getBatchErrors(
    batchId: number,
    options?: {
      skip?: number;
      take?: number;
      errorType?: string;
      errorCode?: string;
      rowNumber?: number;
      fieldName?: string;
    },
  ): Promise<{ errors: PlanningError[]; total: number; skip: number; take: number }> {
    const params = new URLSearchParams();
    if (options?.skip) params.set('skip', options.skip.toString());
    if (options?.take) params.set('take', options.take.toString());
    if (options?.errorType) params.set('errorType', options.errorType);
    if (options?.errorCode) params.set('errorCode', options.errorCode);
    if (options?.rowNumber) params.set('rowNumber', options.rowNumber.toString());
    if (options?.fieldName) params.set('fieldName', options.fieldName);
    const queryString = params.toString();
    const url = `/sales-planning/import/${batchId}/errors${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(url);
    return parseEnvelope<{ errors: PlanningError[]; total: number; skip: number; take: number }>(res);
  },

  // Get batch rows
  async getBatchRows(
    batchId: number,
    options?: { skip?: number; take?: number; customerCode?: string; productCode?: string; status?: string },
  ): Promise<{ rows: PlanningRow[]; total: number; skip: number; take: number }> {
    const params = new URLSearchParams();
    if (options?.skip) params.set('skip', options.skip.toString());
    if (options?.take) params.set('take', options.take.toString());
    if (options?.customerCode) params.set('customerCode', options.customerCode);
    if (options?.productCode) params.set('productCode', options.productCode);
    if (options?.status) params.set('status', options.status);
    const queryString = params.toString();
    const url = `/sales-planning/import/${batchId}/rows${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(url);
    return parseEnvelope<{ rows: PlanningRow[]; total: number; skip: number; take: number }>(res);
  },

  // Get batch detail (batch + rows + errors)
  async getBatchDetail(batchId: number): Promise<{ batch: PlanningBatch; rows: PlanningRow[]; errors: PlanningError[] }> {
    const res = await apiFetch(`/sales-planning/import/${batchId}/detail`);
    return parseEnvelope<{ batch: PlanningBatch; rows: PlanningRow[]; errors: PlanningError[] }>(res);
  },

  // Cancel import
  async cancelImport(batchId: number): Promise<{ message: string }> {
    const res = await apiFetch(`/sales-planning/import/${batchId}/cancel`, {
      method: "POST",
    });
    return parseEnvelope<{ message: string }>(res);
  },

  // Get import history
  async getImportHistory(options?: {
    skip?: number;
    take?: number;
    status?: string;
    year?: number;
    month?: number;
  }): Promise<PlanningBatchesResponse> {
    const res = await apiFetch("/sales-planning/import/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options || {}),
    });
    return parseEnvelope<PlanningBatchesResponse>(res);
  },

  // Get planning data
  async getPlanningData(options?: {
    year?: number;
    month?: number;
    customerCode?: string;
    productCode?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
  }): Promise<PlanningDataResponse> {
    const res = await apiFetch(`/sales-planning${buildQuery(options || {})}`);
    return parseEnvelope<PlanningDataResponse>(res);
  },

  // Get planning row by ID
  async getPlanningRow(id: number): Promise<PlanningRow> {
    const res = await apiFetch(`/sales-planning/row/${id}`);
    return parseEnvelope<PlanningRow>(res);
  },

  // Delete planning data by batch
  async deletePlanningData(batchId: number): Promise<{ message: string }> {
    const res = await apiFetch(`/sales-planning/batch/${batchId}`, {
      method: "DELETE",
    });
    return parseEnvelope<{ message: string }>(res);
  },
};
