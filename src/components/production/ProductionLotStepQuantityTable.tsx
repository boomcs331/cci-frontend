"use client";

import React from "react";
import type { LotStepQuantityRow } from "@/types/productionLotStepQuantities";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import { resolveOperatorLabel } from "@/utils/resolveStoredUserLabel";
import type { SessionUser } from "@/utils/session";

type Props = {
  steps: LotStepQuantityRow[];
  unit: string;
  sessionUser?: SessionUser | null;
  compact?: boolean;
};

function statusLabel(status: LotStepQuantityRow["status"]): string {
  if (status === "completed") return "เสร็จแล้ว";
  if (status === "in_progress") return "กำลังทำ";
  if (status === "rejected") return "ปฏิเสธ";
  return "รอ";
}

function statusClass(status: LotStepQuantityRow["status"]): string {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  }
  if (status === "in_progress") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
  }
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

function fmtQty(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const n = Number(value);
  const text = Number.isInteger(n) ? String(n) : n.toLocaleString("th-TH", { maximumFractionDigits: 4 });
  return `${text} ${unit}`;
}

export default function ProductionLotStepQuantityTable({
  steps,
  unit,
  sessionUser = null,
  compact = false,
}: Props) {
  if (!steps.length) return null;

  const textSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className={`w-full min-w-[520px] ${textSize}`}>
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80 text-left text-gray-600 dark:text-gray-400">
            <th className="px-2 py-1.5 font-semibold w-8">#</th>
            <th className="px-2 py-1.5 font-semibold">ขั้นตอน</th>
            <th className="px-2 py-1.5 font-semibold w-20">สถานะ</th>
            <th className="px-2 py-1.5 font-semibold text-right w-24">รับเข้า</th>
            <th className="px-2 py-1.5 font-semibold text-right w-24">จ่ายออก</th>
            <th className="px-2 py-1.5 font-semibold">ผู้ทำ</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            const displayName = processStepDisplayName(step.processCode, step.processName);
            const op =
              step.operator?.trim() && sessionUser
                ? resolveOperatorLabel(step.operator, sessionUser)
                : step.operator?.trim() || "—";
            const balanceMismatch =
              step.status === "completed" &&
              step.quantityIn != null &&
              step.quantityOut != null &&
              Math.abs(step.quantityIn - step.quantityOut) > 0.0001;

            return (
              <tr
                key={step.processId}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
              >
                <td className="px-2 py-1.5 text-gray-500 tabular-nums">{step.stepOrder}</td>
                <td className="px-2 py-1.5">
                  <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                  <span className="ml-1 font-mono text-gray-400">{step.processCode}</span>
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 font-medium ${statusClass(step.status)}`}
                  >
                    {statusLabel(step.status)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-900 dark:text-white">
                  {fmtQty(step.quantityIn, unit)}
                </td>
                <td
                  className={`px-2 py-1.5 text-right font-mono tabular-nums ${
                    balanceMismatch
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-gray-900 dark:text-white"
                  }`}
                  title={balanceMismatch ? "รับเข้า ≠ จ่ายออก (อาจมี split)" : undefined}
                >
                  {fmtQty(step.quantityOut, unit)}
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={op}>
                  {op}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
