export type SplitLotChildResult = {
  id: number;
  lotNo: string;
  orderNoRef?: string | null;
  qrCode: string;
  quantity: number;
  status: string;
  currentProcessId: number | null;
  keptOriginalQr?: boolean;
};

export type SplitLotResult = {
  sourceLot: {
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
