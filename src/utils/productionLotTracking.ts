/**
 * QR ล็อตผลิต — เก็บสถานะใน localStorage (ฝั่งเดียวกับเบราว์เซอร์)
 * รูปแบบ QR: CCI:PL:{planId}:{itemIndex}:{lotIndex}
 */

export const PRODUCTION_LOT_QR_PREFIX = "CCI:PL:";

/**
 * ค่าที่สแกนแล้วให้เลื่อนล็อตที่เลือกไว้ “ปิดงานขั้นปัจจุบัน → ขั้นถัดไป”
 * พิมพ์เป็น QR / Code128 ได้ — ใช้หน้ายิงบาร์โค้ดหลังสแกน QR ล็อตแล้ว
 */
export const PRODUCTION_CLOSE_STEP_BARCODES = [
  "CCI:PRODUCTION:CLOSE-STEP",
  "PD-CLOSE-STEP",
] as const;

export function isProductionCloseStepBarcode(raw: string): boolean {
  const t = raw.trim();
  return (PRODUCTION_CLOSE_STEP_BARCODES as readonly string[]).includes(t);
}

export interface ProductionLotPayload {
  planId: number;
  itemIndex: number;
  lotIndex: number;
}

export const PRODUCTION_STEPS = [
  { id: "wait", label: "รอเริ่มผลิต" },
  { id: "wip", label: "กำลังผลิต" },
  { id: "pack", label: "บรรจุ" },
  { id: "qc", label: "ตรวจสอบ QC" },
  { id: "done", label: "เสร็จสมบูรณ์" },
] as const;

export type ProductionStepId = (typeof PRODUCTION_STEPS)[number]["id"];

export interface ProductionLotRecord {
  /** ค่าที่เข้ารหัสใน QR — จากเซิร์ฟเวอร์เป็นรหัสแบบวัตถุดิบ (QR-PG…); แบบเดิมในเครื่องเป็น CCI:PL:… */
  qrPayload: string;
  planId: number;
  planCode: string;
  itemIndex: number;
  lotIndex: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  /** 0 .. labelsForRecord(this).length - 1 */
  stepIndex: number;
  updatedAt: string;
  /** ชื่อขั้นตอนตามสินค้า (จาก API) — ถ้าไม่มีใช้ PRODUCTION_STEPS เดิม */
  processStepLabels?: string[];
  /** ข้อมูลขั้นตอนยังเก็บในเบราว์เซอร์; QR/ล็อตหลักมาจากตาราง production_lots เมื่อ source เป็น server */
  source?: "local" | "server";
  lotNo?: string;
  orderLotLabel?: string;
  productionOrderId?: number;
}

const STORAGE_KEY = "cci-production-lot-tracking-v1";

function readAll(): Record<string, ProductionLotRecord> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return {};
    const p = JSON.parse(s) as Record<string, ProductionLotRecord>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ProductionLotRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function encodeProductionLotQr(p: ProductionLotPayload): string {
  const planId = Number(p.planId);
  const itemIndex = Number(p.itemIndex);
  const lotIndex = Number(p.lotIndex);
  if (!Number.isFinite(planId) || !Number.isFinite(itemIndex) || !Number.isFinite(lotIndex)) {
    throw new Error(
      `encodeProductionLotQr: ค่าไม่ถูกต้อง planId=${p.planId} itemIndex=${p.itemIndex} lotIndex=${p.lotIndex}`,
    );
  }
  return `${PRODUCTION_LOT_QR_PREFIX}${planId}:${itemIndex}:${lotIndex}`;
}

export function decodeProductionLotQr(raw: string): ProductionLotPayload | null {
  const t = raw.trim();
  if (!t.startsWith(PRODUCTION_LOT_QR_PREFIX)) return null;
  const rest = t.slice(PRODUCTION_LOT_QR_PREFIX.length);
  const parts = rest.split(":");
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map((x) => Number(x));
  if (![a, b, c].every((n) => Number.isInteger(n) && n >= 0)) return null;
  return { planId: a, itemIndex: b, lotIndex: c };
}

export function getLotRecord(qrPayload: string): ProductionLotRecord | undefined {
  const r = readAll()[qrPayload];
  if (!r) return undefined;
  const max = maxStepForRecord(r);
  if (r.stepIndex > max) {
    const fixed = { ...r, stepIndex: max, updatedAt: new Date().toISOString() };
    upsertLotRecord(fixed);
    return fixed;
  }
  return r;
}

export function upsertLotRecord(record: ProductionLotRecord) {
  const all = readAll();
  all[record.qrPayload] = record;
  writeAll(all);
}

export function labelsForRecord(r: ProductionLotRecord): string[] {
  if (r.processStepLabels && r.processStepLabels.length > 0) {
    return r.processStepLabels;
  }
  return PRODUCTION_STEPS.map((s) => s.label);
}

export function maxStepForRecord(r: ProductionLotRecord): number {
  return Math.max(0, labelsForRecord(r).length - 1);
}

export function advanceLotStep(qrPayload: string): ProductionLotRecord | null {
  const all = readAll();
  const r = all[qrPayload];
  if (!r) return null;
  const max = maxStepForRecord(r);
  r.stepIndex = Math.min(r.stepIndex + 1, max);
  r.updatedAt = new Date().toISOString();
  writeAll(all);
  return r;
}

export function setLotStepIndex(qrPayload: string, stepIndex: number): ProductionLotRecord | null {
  const all = readAll();
  const r = all[qrPayload];
  if (!r) return null;
  const max = maxStepForRecord(r);
  r.stepIndex = Math.max(0, Math.min(stepIndex, max));
  r.updatedAt = new Date().toISOString();
  writeAll(all);
  return r;
}

export function deleteLotsForPlanItem(planId: number, itemIndex: number) {
  const all = readAll();
  for (const k of Object.keys(all)) {
    const r = all[k];
    if (r.planId === planId && r.itemIndex === itemIndex) delete all[k];
  }
  writeAll(all);
}

export function listLotsForPlanItem(
  planId: number,
  itemIndex: number
): ProductionLotRecord[] {
  return Object.values(readAll())
    .filter((r) => r.planId === planId && r.itemIndex === itemIndex)
    .map((r) => {
      const max = maxStepForRecord(r);
      if (r.stepIndex > max) {
        const fixed = { ...r, stepIndex: max, updatedAt: new Date().toISOString() };
        upsertLotRecord(fixed);
        return fixed;
      }
      return r;
    })
    .sort((a, b) => a.lotIndex - b.lotIndex);
}

/** หลังเรียก POST generate-product-qr-orders — เขียนลง localStorage ด้วย qrPayload = qr_code จาก DB */
export function syncPlanItemLotsFromServer(params: {
  planId: number;
  planCode: string;
  itemIndex: number;
  productId: number;
  productName: string;
  unit: string;
  lots: Array<{
    qrCode: string;
    quantity: string | number;
    sequenceNo: number;
    lotNo?: string;
    orderLotLabel?: string;
  }>;
  processStepLabels?: string[];
  productionOrderId?: number;
}): ProductionLotRecord[] {
  const {
    planId,
    planCode,
    itemIndex,
    productId,
    productName,
    unit,
    lots,
    processStepLabels,
    productionOrderId,
  } = params;

  deleteLotsForPlanItem(planId, itemIndex);

  const sorted = [...lots].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const records: ProductionLotRecord[] = [];
  let i = 0;
  for (const lot of sorted) {
    const qty = Number(lot.quantity);
    const rec: ProductionLotRecord = {
      qrPayload: lot.qrCode,
      planId,
      planCode,
      itemIndex,
      lotIndex: i,
      productId,
      productName,
      quantity: Number.isFinite(qty) ? qty : 0,
      unit,
      stepIndex: 0,
      updatedAt: new Date().toISOString(),
      source: "server",
      lotNo: lot.lotNo,
      orderLotLabel: lot.orderLotLabel,
      productionOrderId,
      ...(processStepLabels && processStepLabels.length > 0
        ? { processStepLabels: [...processStepLabels] }
        : {}),
    };
    records.push(rec);
    upsertLotRecord(rec);
    i++;
  }
  return records;
}

export function generateLotRecords(params: {
  planId: number;
  planCode: string;
  itemIndex: number;
  productId: number;
  productName: string;
  unit: string;
  totalQty: number;
  packSize: number;
  /** ลำดับชื่อขั้นตอนผลิตตามสินค้า — ถ้าไม่ส่งหรือว่าง จะใช้ PRODUCTION_STEPS เดิม */
  processStepLabels?: string[];
}): ProductionLotRecord[] {
  const {
    planId,
    planCode,
    itemIndex,
    productId,
    productName,
    unit,
    totalQty,
    packSize,
    processStepLabels,
  } = params;
  if (!Number.isFinite(packSize) || packSize <= 0) return [];
  if (!Number.isFinite(totalQty) || totalQty <= 0) return [];
  if (!Number.isFinite(Number(planId))) return [];

  deleteLotsForPlanItem(Number(planId), itemIndex);

  const n = Math.ceil(totalQty / packSize);
  const records: ProductionLotRecord[] = [];
  const pid = Number(planId);
  for (let i = 0; i < n; i++) {
    const qty = Math.min(packSize, totalQty - i * packSize);
    const qrPayload = encodeProductionLotQr({
      planId: pid,
      itemIndex,
      lotIndex: i,
    });
    const rec: ProductionLotRecord = {
      qrPayload,
      planId: pid,
      planCode,
      itemIndex,
      lotIndex: i,
      productId,
      productName,
      quantity: qty,
      unit,
      stepIndex: 0,
      updatedAt: new Date().toISOString(),
      source: "local",
      ...(processStepLabels && processStepLabels.length > 0
        ? { processStepLabels: [...processStepLabels] }
        : {}),
    };
    records.push(rec);
    upsertLotRecord(rec);
  }
  return records;
}

export function stepLabel(stepIndex: number): string {
  const s = PRODUCTION_STEPS[stepIndex];
  return s ? s.label : "—";
}

/** ชื่อขั้นตอนตามข้อมูลล็อต (รองรับขั้นตอนจากสินค้า) */
export function stepLabelForRecord(r: ProductionLotRecord, stepIndex: number): string {
  const labels = labelsForRecord(r);
  const l = labels[stepIndex];
  return l ?? "—";
}
