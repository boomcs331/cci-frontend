"use client";

import type { LotStepQuantitiesPayload } from "@/types/productionLotStepQuantities";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import {
  LOT_TRACE_TABLE_HEADERS,
  formatLotTraceDateTime,
  fgLotStatusLabelTh,
  lotStatusLabelTh,
  lotTraceStepRowCells,
} from "@/utils/lotTraceReportFormat";

type LotTraceLotCardProps = {
  group: LotStepQuantitiesPayload;
  variant: "production" | "fg";
};

export default function LotTraceLotCard({ group, variant }: LotTraceLotCardProps) {
  const isFg = variant === "fg";
  const titlePrefix = isFg ? "FG Lot Trace" : "Lot Trace";
  const statusLabel = isFg
    ? fgLotStatusLabelTh(group.lotStatus)
    : lotStatusLabelTh(group.lotStatus);
  const useProcessDisplayName = !isFg;

  return (
    <div className="w-full rounded-sm border border-gray-400 bg-white p-4 font-mono text-sm text-gray-900 shadow-sm dark:border-gray-500 dark:bg-gray-900/40 dark:text-gray-100 sm:p-5">
      <div className="border-b border-gray-600 pb-2 text-center text-sm font-semibold tracking-tight dark:border-gray-400">
        {titlePrefix} : {group.lotNo}
      </div>
      <div className="mb-1 mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
        ใบสั่ง {group.orderNo}
      </div>
      <div className="mb-3 text-center text-xs text-gray-500 dark:text-gray-500">
        QR {group.qrCode} · จำนวน {group.lotQuantity.toLocaleString()}{" "}
        {group.unit} · {statusLabel}
        {group.remainingQuantity != null
          ? ` · คงเหลือ ${group.remainingQuantity.toLocaleString()}`
          : ""}
        {group.lotCreatedAt
          ? ` · สร้าง ${formatLotTraceDateTime(group.lotCreatedAt)}`
          : ""}
      </div>
      <div className="mb-3 w-full border-t border-gray-400 dark:border-gray-500" />

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] table-auto text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-50 dark:border-gray-300 dark:bg-gray-800/80">
              {LOT_TRACE_TABLE_HEADERS.map((h, hi) => (
                <th
                  key={h}
                  className={`px-2 py-2 font-medium sm:px-3 sm:py-3 ${hi >= 6 && hi <= 7 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {group.steps.map((step) => {
              const cells = lotTraceStepRowCells(
                step,
                group.unit,
                useProcessDisplayName,
              );
              const mismatch =
                step.status === "completed" &&
                step.quantityIn != null &&
                step.quantityOut != null &&
                Math.abs(step.quantityIn - step.quantityOut) > 0.0001;
              return (
                <tr
                  key={`${group.lotNo}-${step.processId ?? step.stepOrder}-${step.processCode}`}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                    step.status === "in_progress"
                      ? "bg-blue-50/50 dark:bg-blue-950/20"
                      : step.status === "completed"
                        ? ""
                        : "bg-gray-50/40 dark:bg-gray-800/30"
                  }`}
                >
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-2 py-2 sm:px-3 sm:py-3 ${
                        ci === 1
                          ? "font-medium"
                          : ci >= 6 && ci <= 7
                            ? `text-right font-medium ${
                                ci === 6
                                  ? "text-green-700 dark:text-green-400"
                                  : mismatch
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-red-700 dark:text-red-400"
                              }`
                            : ""
                      }`}
                      title={
                        ci === 1
                          ? useProcessDisplayName
                            ? processStepDisplayName(
                                step.processCode,
                                step.processName,
                              )
                            : step.stepName
                          : undefined
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isFg && group.splitChildren.length > 0 ? (
        <div className="mt-4 rounded-md border border-violet-300 bg-violet-50/80 px-3 py-2 text-xs dark:border-violet-800 dark:bg-violet-950/30">
          <p className="font-semibold text-violet-900 dark:text-violet-200">
            ล็อตย่อยจาก Split
          </p>
          <ul className="mt-1 space-y-0.5 text-violet-800 dark:text-violet-100">
            {group.splitChildren.map((c) => (
              <li key={c.qrCode}>
                {c.lotNo}: {c.quantity.toLocaleString()} {group.unit} ({c.status})
                {c.splitReason ? ` — ${c.splitReason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 w-full border-t border-gray-400 dark:border-gray-500" />
      <div className="mt-3 text-right text-sm font-semibold sm:text-base">
        {isFg ? (
          <>
            รับเข้ารวม : {group.lotQuantity.toLocaleString()} {group.unit}
            {" · "}
            คงเหลือ :{" "}
            {(group.remainingQuantity ?? group.lotQuantity).toLocaleString()}{" "}
            {group.unit}
          </>
        ) : (
          <>
            จำนวนล็อตปัจจุบัน : {group.lotQuantity.toLocaleString()} {group.unit}
          </>
        )}
      </div>
    </div>
  );
}
