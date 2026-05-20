import type { ProductionOrderLot } from "@/types/production";

export function matchTrackingByProcessCode(
  lot: ProductionOrderLot,
  processCode: string
) {
  const code = (processCode ?? "").trim().toUpperCase();
  if (!code) return null;
  const rows = (lot.tracking ?? []).filter((t) => {
    const pc = (t.process?.processCode ?? t.processCode ?? "").trim().toUpperCase();
    return pc === code;
  });
  if (rows.length === 0) return null;
  return (
    rows.find((t) => t.status === "COMPLETED") ??
    rows.find((t) => t.status === "IN_PROGRESS") ??
    rows[0]
  );
}

export function lotHasCompletedProcess(lot: ProductionOrderLot, processCode: string): boolean {
  return matchTrackingByProcessCode(lot, processCode)?.status === "COMPLETED";
}

export function lotOperatorForProcess(lot: ProductionOrderLot, processCode: string): string {
  const row = matchTrackingByProcessCode(lot, processCode);
  const op = row?.operator?.trim();
  if (op) return op;
  if (row?.status === "IN_PROGRESS") return "(กำลังทำ)";
  return "";
}

export function lotProcessStatusLabel(
  lot: ProductionOrderLot,
  processCode: string
): "done" | "active" | "pending" {
  const row = matchTrackingByProcessCode(lot, processCode);
  if (row?.status === "COMPLETED") return "done";
  if (row?.status === "IN_PROGRESS") return "active";
  return "pending";
}
