import { apiFetch } from "@/utils/api";

export interface GenerateProductQrOrdersBody {
  planItemIds?: number[];
  defaultLotSize?: number;
  lotSizeByProductId?: Record<string, number>;
}

export type GenerateProductQrOrdersResponse = {
  planId: number;
  planCode: string;
  summary: Array<{
    planItemId: number;
    productId: number;
    quantity: number;
    lotSize: number;
    totalQrCodes: number;
    productionOrderId: number;
    orderNo: string;
  }>;
  orders: Array<{
    id: number;
    orderNo: string;
    planId: number | null;
    /** เท่ากับ production_plan_items.id และ summary.planItemId */
    planItemId: number;
    productId: number;
    orderQuantity: number;
    lotSize: number;
    totalLots: number;
    status: string;
    remarks?: string | null;
    createDate?: string;
    lots: Array<{
      id: number;
      orderId: number;
      qrCode: string;
      lotNo: string;
      lotPdNo?: string | null;
      orderLotLabel?: string | null;
      sequenceNo: number;
      quantity: number;
      status: string;
      currentProcessId?: number | null;
    }>;
  }>;
};

export async function generateProductQrOrders(
  planId: number,
  body: GenerateProductQrOrdersBody,
): Promise<GenerateProductQrOrdersResponse> {
  const res = await apiFetch(`/production-plans/${planId}/generate-product-qr-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({}));
    const msg =
      (raw as { message?: string | string[] })?.message ?? res.statusText;
    const text = Array.isArray(msg) ? msg.join(", ") : String(msg);
    throw new Error(text || "generate-product-qr-orders failed");
  }

  return res.json() as Promise<GenerateProductQrOrdersResponse>;
}

/** ดึงรหัสแถวแผนจาก item — รองรับ planItemId หรือ id จาก backend */
export function effectivePlanItemId(item: unknown): number | undefined {
  if (item == null || typeof item !== "object") return undefined;
  const o = item as Record<string, unknown>;
  const tryNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
    return undefined;
  };
  const fromPlanItemId = tryNum(o.planItemId);
  if (fromPlanItemId != null) return fromPlanItemId;
  for (const key of ["id", "itemId", "productionPlanItemId"] as const) {
    const n = tryNum(o[key]);
    if (n != null) return n;
  }
  return undefined;
}

/**
 * จับคู่ order จาก generate-product-qr-orders กับแถวในแผน
 * (กรณีไม่มี planItemId ใน /details จะใช้ลำดับ index หรือ summary)
 */
export function resolveProductionOrderForPlanItem(
  data: GenerateProductQrOrdersResponse,
  item: unknown,
  itemIndex: number,
  orders: NonNullable<GenerateProductQrOrdersResponse["orders"]> = data.orders ??
    [],
): GenerateProductQrOrdersResponse["orders"][number] | undefined {
  const pid = effectivePlanItemId(item);
  if (pid != null) {
    const byPid = orders.find((o) => o.planItemId === pid);
    if (byPid?.lots?.length) return byPid;
    for (const s of data.summary ?? []) {
      if (s.planItemId === pid) {
        const byOid = orders.find((o) => o.id === s.productionOrderId);
        if (byOid?.lots?.length) return byOid;
      }
    }
  }
  const atIdx = orders[itemIndex];
  if (atIdx?.lots?.length) return atIdx;
  const summ = data.summary?.[itemIndex];
  if (summ?.productionOrderId != null) {
    const byOid = orders.find((o) => o.id === summ.productionOrderId);
    if (byOid?.lots?.length) return byOid;
  }
  if (orders.length === 1 && orders[0]?.lots?.length) return orders[0];
  return undefined;
}
