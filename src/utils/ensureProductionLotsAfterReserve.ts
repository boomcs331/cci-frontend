import { getProductProductionSteps } from "@/services/productProductionStepsService";
import {
  effectivePlanItemId,
  generateProductQrOrders,
  resolveProductionOrderForPlanItem,
  type GenerateProductQrOrdersResponse,
} from "@/services/productionPlanQrService";
import { syncPlanItemLotsFromServer } from "@/utils/productionLotTracking";

export interface PlanDetailForLots {
  id?: number;
  planId?: number;
  planCode: string;
  status?: string;
  items: Array<{
    planItemId?: number;
    /** บาง backend ส่งเป็น id ของแถวแผนแทน planItemId */
    id?: number;
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
  }>;
}

const DEFAULT_PACK_SIZE = 100;

/**
 * หลังจองวัตถุดิบเท่านั้น — ไม่สร้าง production_lots ใน DB แล้ว
 * (QR การผลิตถูกสร้างที่ backend หลังยืนยันจอง + ตัดสต็อค / confirm-and-issue)
 */
export async function ensureProductionLotQrsAfterReserve(
  _plan: PlanDetailForLots,
  _options?: { packSize?: number },
): Promise<void> {
  return;
}

/** ซิงก์ localStorage สำหรับแสดงขั้นตอน จาก payload productionQrGeneration หลังจ่ายวัตถุดิบ */
export async function syncPlanItemsFromProductionQrGeneration(
  plan: PlanDetailForLots,
  gen: GenerateProductQrOrdersResponse | null | undefined,
): Promise<void> {
  if (!gen?.orders?.length || !plan.items?.length) return;
  const planId = plan.id ?? plan.planId;
  if (!Number.isFinite(Number(planId))) return;

  const orders = gen.orders;

  for (let itemIndex = 0; itemIndex < plan.items.length; itemIndex++) {
    const item = plan.items[itemIndex];
    const order = resolveProductionOrderForPlanItem(
      gen,
      item,
      itemIndex,
      orders,
    );
    if (!order?.lots?.length) continue;

    let processStepLabels: string[] | undefined;
    try {
      const prod = await getProductProductionSteps(item.productId);
      const labels = [...prod]
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((r) => r.process.processName);
      if (labels.length > 0) processStepLabels = labels;
    } catch {
      processStepLabels = undefined;
    }

    syncPlanItemLotsFromServer({
      planId: Number(planId),
      planCode: plan.planCode,
      itemIndex,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      lots: order.lots.map((l) => ({
        qrCode: l.qrCode,
        quantity: l.quantity,
        sequenceNo: l.sequenceNo,
        lotNo: l.lotNo,
        orderLotLabel: l.orderLotLabel ?? undefined,
      })),
      processStepLabels,
      productionOrderId: order.id,
    });
  }
}

/** หลังจ่ายวัตถุดิบรายแถว — สร้าง/ซิงก์ QR production_lots เฉพาะแถวที่ระบุ */
export async function generateProductQrOrdersAndSyncPlanItems(
  planId: number,
  plan: PlanDetailForLots,
  itemIndexes: number[],
  options?: { packSize?: number },
): Promise<void> {
  if (!Number.isFinite(Number(planId)) || !plan.items?.length || !itemIndexes.length) {
    return;
  }
  const packSize =
    options?.packSize !== undefined && options.packSize > 0
      ? options.packSize
      : DEFAULT_PACK_SIZE;

  const bodyIds = itemIndexes
    .map((i) => effectivePlanItemId(plan.items[i]))
    .filter((x): x is number => x != null);

  const data = await generateProductQrOrders(Number(planId), {
    ...(bodyIds.length ? { planItemIds: bodyIds } : {}),
    defaultLotSize: packSize,
  });
  const orders = data.orders || [];

  for (const itemIndex of itemIndexes) {
    const item = plan.items[itemIndex];
    if (!item) continue;
    const order = resolveProductionOrderForPlanItem(
      data,
      item,
      itemIndex,
      orders,
    );
    if (!order?.lots?.length) continue;

    let processStepLabels: string[] | undefined;
    try {
      const prod = await getProductProductionSteps(item.productId);
      const labels = [...prod]
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((r) => r.process.processName);
      if (labels.length > 0) processStepLabels = labels;
    } catch {
      processStepLabels = undefined;
    }

    syncPlanItemLotsFromServer({
      planId: Number(planId),
      planCode: plan.planCode,
      itemIndex,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      lots: order.lots.map((l) => ({
        qrCode: l.qrCode,
        quantity: l.quantity,
        sequenceNo: l.sequenceNo,
        lotNo: l.lotNo,
        orderLotLabel: l.orderLotLabel ?? undefined,
      })),
      processStepLabels,
      productionOrderId: order.id,
    });
  }
}
