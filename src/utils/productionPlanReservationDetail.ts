/** รายละเอียดแผนจาก GET /production-plans/:id/details — ใช้ร่วมหน้ารายละเอียดและหน้าพิมพ์ */

export interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  requiredQuantity: number;
  availableQty: number;
  unit: string;
}

export interface Reservation {
  materialId: number;
  materialCode: string;
  materialName: string;
  reservedQuantity: number;
  lotNumber?: string;
  lotPdNo?: string;
  qrCode?: string;
  qr_code?: string;
  receiveDate?: string;
  createDate: string;
}

export interface PlanItem {
  planItemId?: number;
  id?: number;
  productId: number;
  productCode?: string;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
  materialsIssued?: boolean;
}

export interface PlanDetail {
  id?: number;
  planId?: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: string;
  remarks?: string;
  createBy?: string;
  createDate?: string;
  /** ผู้ใช้ที่สร้างรายการจ่ายออกวัตถุดิบ (จาก material_issuing.create_by ไม่ซ้ำ) */
  materialIssuedBy: string[];
  items: PlanItem[];
  reservations?: Reservation[];
}

export function normalizePlanItem(input: unknown): PlanItem {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const materials = Array.isArray(raw.materials) ? (raw.materials as Material[]) : [];
  return {
    planItemId: raw.planItemId as number | undefined,
    id: raw.id as number | undefined,
    productId: Number(raw.productId),
    productCode: raw.productCode != null ? String(raw.productCode) : undefined,
    productName: String(raw.productName ?? ''),
    quantity: Number(raw.quantity),
    unit: String(raw.unit ?? ''),
    materials,
    materialsIssued: raw.materialsIssued as boolean | undefined,
  };
}

function pickCreateDate(o: Record<string, unknown>): string | undefined {
  const v = o.createDate ?? o.create_date;
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function pickCreateBy(o: Record<string, unknown>): string | undefined {
  const v = o.createBy ?? o.create_by;
  if (v == null) return undefined;
  return String(v);
}

function pickMaterialIssuedBy(o: Record<string, unknown>): string[] {
  const v = o.materialIssuedBy ?? o.material_issued_by;
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function normalizePlanDetail(raw: unknown): PlanDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.message === 'string' && typeof o.statusCode === 'number') {
    return null;
  }
  if (o.planCode == null && o.planName == null) {
    return null;
  }
  const itemsRaw = o.items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((it) => normalizePlanItem(it))
    : [];
  const resRaw = o.reservations;
  const reservations = Array.isArray(resRaw) ? (resRaw as Reservation[]) : [];
  return {
    id: o.id as number | undefined,
    planId: o.planId as number | undefined,
    planCode: String(o.planCode ?? ''),
    planName: String(o.planName ?? ''),
    planDate: String(o.planDate ?? ''),
    planTime: o.planTime != null ? String(o.planTime) : undefined,
    status: String(o.status ?? ''),
    remarks: o.remarks != null ? String(o.remarks) : undefined,
    createBy: pickCreateBy(o),
    createDate: pickCreateDate(o),
    materialIssuedBy: pickMaterialIssuedBy(o),
    items,
    reservations,
  };
}

export function reservationMaterialQr(r: Reservation): string {
  return (r.qrCode ?? r.qr_code ?? '').trim();
}
