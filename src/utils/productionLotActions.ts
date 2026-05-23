import {
  findFlowStepForLot,
  stepAllowedForDepartment,
} from "@/utils/productionDepartmentFilter";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import type { ProductionOrderLot, ProductProductionStepRow } from "@/types/production";

export type LotCompleteAction = {
  canComplete: boolean;
  processId: number | null;
  processLabel: string | null;
};

/** ปิดกระบวนการได้เมื่อมี tracking IN_PROGRESS และแผนก login ทำขั้นนี้ได้ (หรือ admin) */
export function canCompleteLotProcess(
  lot: ProductionOrderLot,
  flowSteps: ProductProductionStepRow[],
  userDepartmentCode: string | null | undefined,
  isAdmin: boolean,
): LotCompleteAction {
  if (["COMPLETED", "REJECTED", "SPLIT"].includes(lot.status)) {
    return { canComplete: false, processId: null, processLabel: null };
  }

  const tracking = (lot.tracking ?? []).find((t) => t.status === "IN_PROGRESS");
  if (!tracking?.processId) {
    return { canComplete: false, processId: null, processLabel: null };
  }

  const step = findFlowStepForLot(lot, flowSteps);
  if (!isAdmin) {
    if (
      !userDepartmentCode?.trim() ||
      !step ||
      !stepAllowedForDepartment(step, userDepartmentCode)
    ) {
      return { canComplete: false, processId: null, processLabel: null };
    }
  }

  const processLabel = processStepDisplayName(
    lot.currentProcess?.processCode ??
      step?.process?.processCode ??
      tracking.process?.processCode ??
      tracking.processCode,
    lot.currentProcess?.processName ??
      step?.process?.processName ??
      tracking.process?.processName ??
      tracking.processName,
  );

  return {
    canComplete: true,
    processId: tracking.processId,
    processLabel: processLabel === "—" ? null : processLabel,
  };
}
