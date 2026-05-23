export type LotStationProcess = {
  processId: number;
  processCode: string;
  processName: string;
  allowedDepartmentCodes: string[] | null;
};

export type LotStationPayload = {
  lotNo: string;
  qrCode: string;
  quantity: number;
  status: string;
  orderNo: string;
  productCode: string;
  productName: string;
  userDepartmentCode: string | null;
  isAdminGlobal: boolean;
  currentStepPhase?: "IN_PROGRESS" | "WAITING_START" | "COMPLETED";
  stepSummaryTh?: string;
  departmentAlertTh?: string | null;
  route: LotStationProcess[];
  inProgress: (LotStationProcess & { startTime: string }) | null;
  expectedProcess: LotStationProcess | null;
  nextAction: "start" | "complete" | "none";
  canStart: boolean;
  canComplete: boolean;
  completeProcessId: number | null;
  denyReason: string | null;
};
