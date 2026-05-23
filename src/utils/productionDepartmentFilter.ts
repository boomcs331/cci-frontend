import {

  departmentMatchesAllowed,

  departmentMatchesAnyUserDepartments,

} from '@/utils/departmentAccess';

import { processStepDisplayName } from '@/utils/productionProcessDisplay';
import type { ProductionOrderLot, ProductProductionStepRow } from '@/types/production';



function normalizeDeptCodes(

  userDepartmentCode: string | string[] | null | undefined,

): string[] {

  if (!userDepartmentCode) return [];

  return Array.isArray(userDepartmentCode)

    ? userDepartmentCode.filter((c) => c?.trim())

    : [userDepartmentCode];

}



/** ขั้นตอนที่แผนกผู้ใช้ทำได้ (allowed ว่าง = ทุกแผนก) */

export function stepAllowedForDepartment(

  step: ProductProductionStepRow,

  userDepartmentCode: string | string[] | null | undefined,

): boolean {

  const codes = normalizeDeptCodes(userDepartmentCode);

  if (!codes.length) return false;

  return departmentMatchesAnyUserDepartments(

    codes,

    step.process?.allowedDepartmentCodes ?? null,

  );

}



export function filterFlowStepsForDepartment(

  steps: ProductProductionStepRow[],

  userDepartmentCode: string | string[] | null | undefined,

  isAdmin: boolean,

): ProductProductionStepRow[] {

  const sorted = [...steps].sort(

    (a, b) => a.stepOrder - b.stepOrder || a.id - b.id,

  );

  const codes = normalizeDeptCodes(userDepartmentCode);

  if (isAdmin || !codes.length) return sorted;

  return sorted.filter((s) => stepAllowedForDepartment(s, codes));

}



/** ล็อตคงค้างที่ขั้นปัจจุบันตรงแผนก (สอดคล้อง backend lotIsDeptBacklog) */

export function lotMatchesDepartmentScope(

  lot: ProductionOrderLot,

  steps: ProductProductionStepRow[],

  userDepartmentCode: string | string[] | null | undefined,

  isAdmin: boolean,

): boolean {

  if (isAdmin) return true;

  const codes = normalizeDeptCodes(userDepartmentCode);

  if (!codes.length) return false;

  if (['SPLIT', 'COMPLETED', 'REJECTED'].includes(lot.status)) return false;

  if (!['PENDING', 'IN_PROGRESS'].includes(lot.status)) return false;



  const procId = lot.currentProcess?.id;

  if (!procId) return false;



  const step = steps.find((s) => s.processId === procId || s.process?.id === procId);

  if (!step) {

    const code = lot.currentProcess?.processCode;

    if (!code) return false;

    const byCode = steps.find(

      (s) =>

        (s.process?.processCode ?? '').toUpperCase() === code.toUpperCase(),

    );

    if (!byCode) return false;

    return stepAllowedForDepartment(byCode, codes);

  }

  return stepAllowedForDepartment(step, codes);

}



export function filterLotsForDepartment(

  lots: ProductionOrderLot[],

  allFlowSteps: ProductProductionStepRow[],

  userDepartmentCode: string | string[] | null | undefined,

  isAdmin: boolean,

): ProductionOrderLot[] {

  if (isAdmin) return lots;

  return lots.filter((lot) =>

    lotMatchesDepartmentScope(lot, allFlowSteps, userDepartmentCode, isAdmin),

  );

}

export function sortFlowSteps(
  steps: ProductProductionStepRow[],
): ProductProductionStepRow[] {
  return [...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id);
}

export function findFlowStepForLot(
  lot: ProductionOrderLot,
  steps: ProductProductionStepRow[],
): ProductProductionStepRow | undefined {
  const procId = lot.currentProcess?.id;
  if (procId) {
    const byId = steps.find(
      (s) => s.processId === procId || s.process?.id === procId,
    );
    if (byId) return byId;
  }
  const code = lot.currentProcess?.processCode?.trim().toUpperCase();
  if (!code) return undefined;
  return steps.find(
    (s) => (s.process?.processCode ?? '').toUpperCase() === code,
  );
}

export function lotAtFirstFlowStep(
  lot: ProductionOrderLot,
  steps: ProductProductionStepRow[],
): boolean {
  const sorted = sortFlowSteps(steps);
  const first = sorted[0];
  if (!first) return false;
  const current = findFlowStepForLot(lot, steps);
  if (!current) return false;
  return (
    current.id === first.id ||
    current.processId === first.processId ||
    (current.process?.processCode ?? '').toUpperCase() ===
      (first.process?.processCode ?? '').toUpperCase()
  );
}

export type LotStepBadge = {
  displayName: string;
  processCode: string | null;
  inProgress: boolean;
};

/** แท็กขั้นบนหัวล็อต — รอเริ่ม: เฉพาะกระบวนการที่ 1 | กำลังผลิต: ขั้นปัจจุบันตรงแผนก login */
export function resolveLotStepBadgeForUser(
  lot: ProductionOrderLot,
  flowSteps: ProductProductionStepRow[],
  userDepartmentCode: string | null | undefined,
  isAdmin: boolean,
): LotStepBadge | null {
  if (['COMPLETED', 'REJECTED', 'SPLIT'].includes(lot.status)) return null;

  const sorted = sortFlowSteps(flowSteps);
  const firstStep = sorted[0];
  const step = findFlowStepForLot(lot, flowSteps);
  const inProgress = lot.status === 'IN_PROGRESS';
  const pending = lot.status === 'PENDING';

  if (pending) {
    if (!firstStep || !lotAtFirstFlowStep(lot, flowSteps)) {
      return null;
    }
    if (
      !isAdmin &&
      (!userDepartmentCode?.trim() ||
        !stepAllowedForDepartment(firstStep, userDepartmentCode))
    ) {
      return null;
    }
    return {
      displayName: processStepDisplayName(
        firstStep.process?.processCode,
        firstStep.process?.processName,
      ),
      processCode: firstStep.process?.processCode ?? null,
      inProgress: false,
    };
  }

  const currentCode =
    lot.currentProcess?.processCode ?? step?.process?.processCode ?? null;
  const currentName = processStepDisplayName(
    currentCode,
    lot.currentProcess?.processName ?? step?.process?.processName,
  );
  if (currentName === '—') return null;

  if (isAdmin) {
    return { displayName: currentName, processCode: currentCode, inProgress };
  }

  if (!userDepartmentCode?.trim()) return null;
  if (!step || !stepAllowedForDepartment(step, userDepartmentCode)) {
    return null;
  }

  return {
    displayName: currentName,
    processCode: currentCode,
    inProgress,
  };
}

