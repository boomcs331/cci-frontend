export type LotStepQuantityStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected";

export type LotStepQuantityRow = {
  stepOrder: number;
  processId?: number;
  processCode: string;
  processName: string;
  stepCode?: string;
  stepName?: string;
  status: LotStepQuantityStatus;
  quantityIn: number | null;
  quantityOut: number | null;
  operator: string | null;
  startTime: string | null;
  endTime: string | null;
  remarks: string | null;
};

export type LotStepQuantitiesPayload = {
  lotId?: number;
  lotNo: string;
  qrCode: string;
  lotQuantity: number;
  remainingQuantity?: number;
  lotStatus: string;
  productionLotId?: number | null;
  lotCreatedAt?: string | null;
  orderNo: string;
  productId?: number;
  productCode: string | null;
  productName: string | null;
  unit: string;
  steps: LotStepQuantityRow[];
  splitChildren: Array<{
    lotNo: string;
    qrCode: string;
    quantity: number;
    status: string;
    splitReason: string | null;
  }>;
};

export type LotStepTraceReportResult = {
  success: boolean;
  data: LotStepQuantitiesPayload[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
