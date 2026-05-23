import { apiFetch } from "@/utils/api";
import { parseApiErrorResponse } from "@/utils/apiErrorMessages";
import type { ProductionOrderDetail, ProductionOrdersListResult } from "@/types/production";
import type { LotStationPayload } from "@/types/productionLotStation";
import type { SplitLotResult } from "@/types/productionLotSplit";

export async function fetchProductionOrders(page = 1, limit = 20): Promise<ProductionOrdersListResult> {
  const res = await apiFetch(`/production-orders?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const msg = await parseApiErrorResponse(
      res,
      `โหลดรายการคำสั่งผลิตไม่สำเร็จ (${res.status})`,
    );
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchProductionOrder(id: number): Promise<ProductionOrderDetail> {
  const res = await apiFetch(`/production-orders/${id}`);
  if (!res.ok) {
    throw new Error(`โหลดคำสั่งผลิตไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  return parseApiErrorResponse(res, fallback);
}

export async function fetchLotStation(qrCode: string): Promise<LotStationPayload> {
  const res = await apiFetch(
    `/production-orders/lots/${encodeURIComponent(qrCode)}/station`,
  );
  if (!res.ok) {
    throw new Error(await parseApiError(res, `โหลดสถานีล็อตไม่สำเร็จ (${res.status})`));
  }
  return res.json();
}

export async function startLotProcess(
  qrCode: string,
  processId: number,
  operator: string,
): Promise<void> {
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
}

export async function completeLotProcess(
  qrCode: string,
  processId: number,
  remarks?: string,
): Promise<void> {
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
}

/** เหมือน advanceStepForStation ในหน้า Dept QR — ใช้ qr ของล็อตโดยตรง */
export async function advanceLotStepAtStation(
  station: LotStationPayload,
  options: { remarks?: string; operator: string },
): Promise<void> {
  const { remarks, operator } = options;
  const safeRemarks = (remarks ?? "").trim();

  if (station.status === "COMPLETED" || !station.qrCode) {
    throw new Error("ล็อตนี้เสร็จสิ้นแล้ว หรือไม่มีการดำเนินการต่อ");
  }

  if (station.nextAction === "complete" && station.completeProcessId) {
    await completeLotProcess(
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
    await startLotProcess(station.qrCode, pid, operator);
    await completeLotProcess(
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
}

export async function splitProductionLot(
  qrCode: string,
  params: {
    releasedQuantity: number;
    reason: string;
    operator: string;
  },
): Promise<SplitLotResult> {
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
}
