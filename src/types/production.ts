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
  lotPdNo?: string;
  orderLotLabel?: string;
  qrCode: string;
  sequenceNo: number;
  quantity: number;
  status: string;
  currentProcess?: {
    id: number;
    processCode: string;
    processName: string;
    sequenceOrder?: number;
  } | null;
  tracking?: {
    id: number;
    processCode?: string;
    processName?: string;
    process?: { processCode: string; processName: string } | null;
    status: string;
    startTime?: string | null;
    endTime?: string | null;
    operator?: string | null;
    remarks?: string | null;
  }[];
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
  product?: {
    id: number;
    productCode: string;
    productName: string;
    customerId?: number | null;
    /** master.customers — property names จาก entity: code, name */
    customer?: { id: number; code: string; name: string } | null;
  };
  lots?: ProductionOrderLot[];
}

export interface ProductionOrdersListResult {
  orders: ProductionOrderDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
