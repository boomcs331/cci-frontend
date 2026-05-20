"use client";

import React from "react";
import type { ProductionOrderLot, ProductProductionStepRow } from "@/types/production";
import {
  lotOperatorForProcess,
  lotProcessStatusLabel,
} from "@/utils/productionLotFlow";

type Props = {
  lot: ProductionOrderLot;
  flowSteps: ProductProductionStepRow[];
  compact?: boolean;
};

export default function ProductionLotKanbanFlowTable({ lot, flowSteps, compact }: Props) {
  const ordered = [...flowSteps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id);
  if (ordered.length === 0) return null;

  const thClass = compact
    ? "border border-gray-200 dark:border-gray-600 px-1 py-1 font-mono text-[9px] font-semibold text-gray-800 dark:text-gray-200 align-bottom min-w-[2.5rem] max-w-[4.5rem]"
    : "border border-gray-200 dark:border-gray-600 px-1.5 py-1 font-mono text-[10px] font-semibold text-gray-800 dark:text-gray-200 align-bottom min-w-[3rem]";

  const lblClass =
    "border border-gray-200 dark:border-gray-600 px-1.5 py-1 text-[9px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 whitespace-nowrap w-[3.25rem]";

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse table-fixed min-w-full">
        <thead>
          <tr>
            <th className={lblClass}>Flow</th>
            {ordered.map((s) => {
              const code = s.process?.processCode ?? String(s.processId);
              const name = s.process?.processName?.trim();
              const phase = lotProcessStatusLabel(lot, code);
              return (
                <th
                  key={s.id}
                  className={`${thClass} ${
                    phase === "done"
                      ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : phase === "active"
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : "bg-white dark:bg-gray-900/40"
                  }`}
                  title={name ? `${code} — ${name}` : code}
                >
                  <div className="truncate">{code}</div>
                  {name && !compact ? (
                    <div className="font-sans font-normal text-[8px] text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">
                      {name}
                    </div>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={lblClass}>สถานะ</td>
            {ordered.map((s) => {
              const code = s.process?.processCode ?? "";
              const phase = lotProcessStatusLabel(lot, code);
              return (
                <td
                  key={`st-${s.id}`}
                  className={`border border-gray-200 dark:border-gray-600 px-1 py-1 text-center text-xs font-bold ${
                    phase === "done"
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20"
                      : phase === "active"
                        ? "text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/20"
                        : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  {phase === "done" ? "✓" : phase === "active" ? "●" : "—"}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className={lblClass}>ผู้ทำ</td>
            {ordered.map((s) => {
              const code = s.process?.processCode ?? "";
              const label = lotOperatorForProcess(lot, code);
              const phase = lotProcessStatusLabel(lot, code);
              return (
                <td
                  key={`op-${s.id}`}
                  className={`border border-gray-200 dark:border-gray-600 px-1 py-1 text-center align-middle ${
                    phase === "active"
                      ? "bg-blue-50/60 dark:bg-blue-950/15"
                      : phase === "done"
                        ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                        : ""
                  }`}
                >
                  <span
                    className={`block truncate font-sans ${
                      compact ? "text-[9px]" : "text-[10px]"
                    } ${
                      label && !label.startsWith("(")
                        ? "font-semibold text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500 italic"
                    }`}
                    title={label || undefined}
                  >
                    {label || "—"}
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
