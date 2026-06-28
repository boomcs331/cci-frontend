import { apiFetch } from "@/utils/api";
import { parseApiErrorResponse } from "@/utils/apiErrorMessages";
import type { ProductionOrderDetail, ProductionOrdersListResult } from "@/types/production";
import type { LotStationPayload } from "@/types/productionLotStation";
import type {
  LotStepQuantitiesPayload,
  LotStepTraceReportResult,
} from "@/types/productionLotStepQuantities";
import type { SplitLotResult } from "@/types/productionLotSplit";

async function parseApiError(res: Response, fallback: string): Promise<string> {
  return parseApiErrorResponse(res, fallback);
}

export type LotStepTraceReportFilters = {
  startDate?: string;
  endDate?: string;
  orderNo?: string;
  lotSearch?: string;
  productId?: string;
  status?: string;
  includeSplitRetired?: boolean;
  page?: number;
  limit?: number;
};

export const productionOrdersService = {
  /**
   * Fetch production orders list
   */
  fetchList: async (page = 1, limit = 20): Promise<ProductionOrdersListResult> => {
    const res = await apiFetch(`/production-orders?page=${page}&limit=${limit}`);
    if (!res.ok) {
      const msg = await parseApiErrorResponse(
        res,
        `โหลดรายการคำสั่งผลิตไม่สำเร็จ (${res.status})`,
      );
      throw new Error(msg);
    }
    return res.json();
  },

  /**
   * Fetch single production order detail
   */
  fetchDetail: async (id: number): Promise<ProductionOrderDetail> => {
    const res = await apiFetch(`/production-orders/${id}`);
    if (!res.ok) {
      throw new Error(`โหลดคำสั่งผลิตไม่สำเร็จ (${res.status})`);
    }
    return res.json();
  },

  /**
   * Fetch lot station information
   */
  fetchLotStation: async (qrCode: string): Promise<LotStationPayload> => {
    const res = await apiFetch(
      `/production-orders/lots/${encodeURIComponent(qrCode)}/station`,
    );
    if (!res.ok) {
      throw new Error(await parseApiError(res, `โหลดสถานีล็อตไม่สำเร็จ (${res.status})`));
    }
    return res.json();
  },

  /**
   * Fetch lot step trace report
   */
  fetchLotStepTraceReport: async (
    filters: LotStepTraceReportFilters = {},
  ): Promise<LotStepTraceReportResult> => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.orderNo?.trim()) params.set("orderNo", filters.orderNo.trim());
    if (filters.lotSearch?.trim()) params.set("lotSearch", filters.lotSearch.trim());
    if (filters.productId) params.set("productId", filters.productId);
    if (filters.status) params.set("status", filters.status);
    if (filters.includeSplitRetired) params.set("includeSplitRetired", "true");
    params.set("page", String(filters.page ?? 1));
    params.set("limit", String(filters.limit ?? 30));

    const res = await apiFetch(
      `/production-orders/reports/lot-step-trace?${params.toString()}`,
    );
    if (!res.ok) {
      throw new Error(
        await parseApiError(res, `โหลดรายงานสอบกลับล็อตไม่สำเร็จ (${res.status})`),
      );
    }
    return res.json();
  },

  /**
   * Fetch lot step quantities
   */
  fetchLotStepQuantities: async (
    qrCode: string,
  ): Promise<LotStepQuantitiesPayload> => {
    const res = await apiFetch(
      `/production-orders/lots/${encodeURIComponent(qrCode)}/step-quantities`,
    );
    if (!res.ok) {
      throw new Error(
        await parseApiError(res, `โหลดยอดรับเข้า/จ่ายออกต่อขั้นไม่สำเร็จ (${res.status})`),
      );
    }
    return res.json();
  },

  /**
   * Start lot process
   */
  startLotProcess: async (
    qrCode: string,
    processId: number,
    operator: string,
  ): Promise<void> => {
    const res = await apiFetch(
      `/production-orders/lots/${encodeURIComponent(qrCode)}/start`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId, operator }),
      },
    );
    if (!res.ok) {
      throw new Error(await parseApiError(res, "เริ่มขั้นตอนไม่สำเร็จ"));
    }
  },

  /**
   * Complete lot process
   */
  completeLotProcess: async (
    qrCode: string,
    processId: number,
    remarks?: string,
  ): Promise<void> => {
    const res = await apiFetch(
      `/production-orders/lots/${encodeURIComponent(qrCode)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId,
          remarks: remarks?.trim() || undefined,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(await parseApiError(res, "ปิดขั้นตอนไม่สำเร็จ"));
    }
  },

  /**
   * Advance lot step at station
   * เหมือน advanceStepForStation ในหน้า Dept QR — ใช้ qr ของล็อตโดยตรง
   */
  advanceLotStepAtStation: async (
    station: LotStationPayload,
    options: { remarks?: string; operator: string },
  ): Promise<void> => {
    const { remarks, operator } = options;
    const safeRemarks = (remarks ?? "").trim();

    if (station.status === "COMPLETED" || !station.qrCode) {
      throw new Error("ล็อตนี้เสร็จสิ้นแล้ว หรือไม่มีการดำเนินการต่อ");
    }

    if (station.nextAction === "complete" && station.completeProcessId) {
      await productionOrdersService.completeLotProcess(
        station.qrCode,
        station.completeProcessId,
        safeRemarks ||
          station.inProgress?.processName ||
          station.inProgress?.processCode ||
          "complete",
      );
      return;
    }

    if (station.nextAction === "start" && station.expectedProcess) {
      const pid = station.expectedProcess.processId;
      await productionOrdersService.startLotProcess(station.qrCode, pid, operator);
      await productionOrdersService.completeLotProcess(
        station.qrCode,
        pid,
        safeRemarks ||
          station.expectedProcess.processName ||
          station.expectedProcess.processCode ||
          "complete",
      );
      return;
    }

    throw new Error(station.denyReason || "ไม่สามารถปิดขั้นตอนได้ในขณะนี้");
  },

  /**
   * Split production lot
   */
  splitLot: async (
    qrCode: string,
    params: {
      releasedQuantity: number;
      reason: string;
      operator: string;
    },
  ): Promise<SplitLotResult> => {
    const res = await apiFetch(
      `/production-orders/lots/${encodeURIComponent(qrCode)}/split`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releasedQuantity: params.releasedQuantity,
          moveReleasedToNextStep: true,
          operator: params.operator,
          reason: params.reason.trim(),
        }),
      },
    );
    if (!res.ok) {
      throw new Error(await parseApiError(res, "Split ล็อตไม่สำเร็จ"));
    }
    return res.json();
  },
};
