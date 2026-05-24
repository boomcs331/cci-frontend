import { apiFetch } from "@/utils/api";
import { parseApiErrorResponse } from "@/utils/apiErrorMessages";
import type { LotStepTraceReportResult } from "@/types/productionLotStepQuantities";

export type FgLotTraceReportFilters = {
  startDate?: string;
  endDate?: string;
  orderNo?: string;
  lotSearch?: string;
  productId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export async function fetchFgLotTraceReport(
  filters: FgLotTraceReportFilters = {},
): Promise<LotStepTraceReportResult> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.orderNo?.trim()) params.set("orderNo", filters.orderNo.trim());
  if (filters.lotSearch?.trim()) params.set("lotSearch", filters.lotSearch.trim());
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.status) params.set("status", filters.status);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 30));

  const res = await apiFetch(`/products/reports/fg-lot-trace?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      await parseApiErrorResponse(
        res,
        `โหลดรายงานล็อต FG ไม่สำเร็จ (${res.status})`,
      ),
    );
  }
  return res.json();
}
