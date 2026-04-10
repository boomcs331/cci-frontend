/** Master ขั้นตอนผลิต (production_processes) — GET /production-orders/processes/all คืน array ตรงๆ */
export interface ProductionProcess {
  id: number;
  processCode: string;
  processName: string;
  sequenceOrder: number;
  isActive: boolean;
}

/** แถวจาก GET /products/:id/production-steps */
export interface ProductProductionStepRow {
  id: number;
  productId: number;
  stepOrder: number;
  processId: number;
  process: ProductionProcess;
  createDate?: string;
  updateDate?: string;
}

export interface ProductionStepDraft {
  processCode: string;
  processName?: string;
}

export interface SetProductionStepsPayload {
  steps: ProductionStepDraft[];
}

/** ล็อตคำสั่งผลิต (production_lots) — ค่า QR รูปแบบเดียวกับวัตถุดิบ */
export interface ProductionOrderLot {
  id: number;
  orderId: number;
  lotNo: string;
  /** คู่แบบ PD (วัตถุดิบ) */
  lotPdNo?: string;
  /** อ้างอิงใบสั่ง เช่น PO...-LOT001 */
  orderLotLabel?: string;
  qrCode: string;
  sequenceNo: number;
  quantity: number;
  status: string;
}

export interface ProductionOrderDetail {
  id: number;
  orderNo: string;
  productId: number;
  orderQuantity: number;
  lotSize: number;
  totalLots: number;
  status: string;
  remarks?: string;
  product?: { id: number; productCode: string; productName: string };
  lots?: ProductionOrderLot[];
}

export interface ProductionOrdersListResult {
  orders: ProductionOrderDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
