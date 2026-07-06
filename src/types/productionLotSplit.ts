export type SplitLotChildResult = {
  id: number;
  lotNo: string;
  orderNoRef?: string | null;
  qrCode: string;
  quantity: number;
  status: string;
  currentProcessId: number | null;
  parentLotId?: number;
  keptOriginalQr?: boolean;
};

export type SplitLotTrace = {
  splitMode?: "FIRST_PROCESS" | "GENERAL";
  parentLotId: number;
  parentLotNo: string;
  parentQrCode: string;
  parentStatus: string;
  parentRetired?: boolean;
  reason: string;
  operator: string;
  releasedQuantity: number;
  remainingQuantity: number;
  splitAt: string;
};

export type SplitLotResult = {
  splitTrace?: SplitLotTrace;
  parent?: {
    id: number;
    lotNo: string;
    orderNoRef?: string | null;
    qrCode: string;
    quantity: number;
    status: string;
    retired: boolean;
    keptOriginalQr?: boolean;
  };
  children: SplitLotChildResult[];
};
