"use client";

import React from "react";
import type { ProductionOrderLot, ProductProductionStepRow } from "@/types/production";
import {
  lotOperatorForProcess,
  lotProcessStatusLabel,
} from "@/utils/productionLotFlow";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import { getSession } from "@/utils/session";

type Props = {
  lot: ProductionOrderLot;
  flowSteps: ProductProductionStepRow[];
  compact?: boolean;
};

type StepPhase = "done" | "active" | "pending";

function phaseStatusLabel(phase: StepPhase): string {
  if (phase === "done") return "เสร็จแล้ว";
  if (phase === "active") return "กำลังทำ";
  return "รอ";
}

function statusPillClass(phase: StepPhase): string {
  if (phase === "done") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  }
  if (phase === "active") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
  }
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

function nodeClass(phase: StepPhase): string {
  if (phase === "done") {
    return "bg-emerald-500 border-emerald-500 text-white";
  }
  if (phase === "active") {
    return "bg-blue-500 border-blue-500 text-white ring-4 ring-blue-500/15";
  }
  return "bg-white border-gray-300 text-gray-400 dark:bg-gray-900 dark:border-gray-600";
}

function columnClass(phase: StepPhase): string {
  if (phase === "active") {
    return "bg-blue-50/60 dark:bg-blue-950/25";
  }
  if (phase === "done") {
    return "bg-emerald-50/40 dark:bg-emerald-950/15";
  }
  return "";
}

export default function ProductionLotKanbanFlowTable({
  lot,
  flowSteps,
  compact = false,
}: Props) {
  const sessionUser = getSession()?.user;
  const ordered = [...flowSteps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id);
  if (ordered.length === 0) return null;

  const steps = ordered.map((s, idx) => {
    const code = s.process?.processCode ?? "";
    const phase = lotProcessStatusLabel(lot, code);
    return {
      id: s.id,
      code,
      phase,
      displayName: processStepDisplayName(s.process?.processCode, s.process?.processName),
      operator: lotOperatorForProcess(lot, code, sessionUser),
      idx,
    };
  });

  const nodeSize = compact ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  const py = compact ? "py-2.5" : "py-3.5";

  return (
    <div className="w-full" role="list" aria-label="Kanban timeline">
      <div
        className={`relative w-full rounded-lg border border-gray-100 dark:border-gray-800 ${py}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          const prevDone = i > 0 && steps[i - 1].phase === "done";

          return (
            <div
              key={step.id}
              role="listitem"
              className={`relative flex flex-col items-center min-w-0 px-1 sm:px-2 ${columnClass(step.phase)}`}
            >
              {/* จุดบนเส้น */}
              <div className="relative z-10 flex w-full items-center justify-center">
                {!isFirst ? (
                  <div
                    className={`absolute right-1/2 left-0 top-1/2 h-px -translate-y-1/2 ${
                      prevDone ? "bg-emerald-400 dark:bg-emerald-600" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`relative flex shrink-0 items-center justify-center rounded-full border-2 font-semibold ${nodeSize} ${nodeClass(step.phase)}`}
                  title={`${step.displayName} — ${phaseStatusLabel(step.phase)}`}
                >
                  {step.phase === "done" ? (
                    <svg className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : step.phase === "active" ? (
                    <span className={`rounded-full bg-white ${compact ? "h-1.5 w-1.5" : "h-2 w-2"}`} />
                  ) : (
                    <span className="font-mono tabular-nums opacity-70">{i + 1}</span>
                  )}
                </div>
                {!isLast ? (
                  <div
                    className={`absolute left-1/2 right-0 top-1/2 h-px -translate-y-1/2 ${
                      step.phase === "done"
                        ? "bg-emerald-400 dark:bg-emerald-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>

              {/* รายละเอียดขั้น */}
              <div className="mt-2.5 w-full min-w-0 text-center">
                <p
                  className={`font-semibold text-gray-900 dark:text-white truncate ${
                    compact ? "text-[10px]" : "text-xs"
                  }`}
                  title={step.displayName}
                >
                  {step.displayName}
                </p>
                <span
                  className={`inline-block mt-1 rounded-full px-2 py-0.5 font-medium ${compact ? "text-[9px]" : "text-[10px]"} ${statusPillClass(step.phase)}`}
                >
                  {phaseStatusLabel(step.phase)}
                </span>
                <p
                  className={`mt-1.5 truncate ${compact ? "text-[9px]" : "text-[10px]"} ${
                    step.operator && !step.operator.startsWith("(")
                      ? "font-medium text-gray-700 dark:text-gray-200"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                  title={step.operator || "ยังไม่มีผู้ทำ"}
                >
                  {step.operator || "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
