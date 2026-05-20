"use client";

import React from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import ProductionLotKanbanFlowTable from "@/components/production/ProductionLotKanbanFlowTable";
import { matchTrackingByProcessCode } from "@/utils/productionLotFlow";
import type { ProductionOrderLot, ProductProductionStepRow } from "@/types/production";

function lotCurrentStepLabel(lot: ProductionOrderLot): string {
  if (lot.status === "COMPLETED") return "เสร็จสิ้น";
  if (lot.status === "REJECTED") return "ถูกปฏิเสธ";
  if (lot.status === "PENDING") return "รอเริ่มงาน";
  if (lot.currentProcess?.processName) {
    const code = lot.currentProcess.processCode ? ` · ${lot.currentProcess.processCode}` : "";
    return `${lot.currentProcess.processName}${code}`;
  }
  if (lot.status === "IN_PROGRESS") return "กำลังผลิต (ยังไม่ระบุขั้น)";
  return lot.status;
}

function currentStepOperator(lot: ProductionOrderLot): string | null {
  const code = lot.currentProcess?.processCode?.trim();
  if (!code) {
    const active = (lot.tracking ?? []).find((t) => t.status === "IN_PROGRESS");
    return active?.operator?.trim() || null;
  }
  return matchTrackingByProcessCode(lot, code)?.operator?.trim() || null;
}

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "COMPLETED") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  }
  if (s === "IN_PROGRESS") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
  }
  if (s === "REJECTED") {
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
}

type Props = {
  lot: ProductionOrderLot;
  flowSteps: ProductProductionStepRow[];
};

export default function ProductionOrderLotCard({ lot, flowSteps }: Props) {
  const activeOp = currentStepOperator(lot);

  const completedSteps = (lot.tracking ?? [])
    .filter((t) => t.status === "COMPLETED" && (t.process?.processCode || t.processCode))
    .sort((a, b) => new Date(a.endTime ?? 0).getTime() - new Date(b.endTime ?? 0).getTime());

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold text-sm">
            {lot.sequenceNo}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">ล็อต / Kanban</p>
            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate">
              {lot.lotNo}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPillClass(lot.status)}`}
        >
          {lot.status}
        </span>
      </div>

      <div className="p-4 flex flex-col sm:flex-row gap-4 flex-1">
        <div className="flex flex-col items-center gap-2 sm:w-[140px] shrink-0">
          <QRCodeGenerator value={lot.qrCode} size={120} className="rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-white" />
          <p className="font-mono text-[10px] text-center text-gray-500 dark:text-gray-400 break-all leading-tight max-w-[140px]">
            {lot.qrCode}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-3 text-sm">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">PD (คู่)</dt>
              <dd className="font-mono text-xs text-gray-900 dark:text-white">{lot.lotPdNo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">อ้างอิงใบสั่ง</dt>
              <dd className="font-mono text-xs text-gray-900 dark:text-white truncate">
                {lot.orderLotLabel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">จำนวน</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{lot.quantity}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">ขั้นตอนปัจจุบัน</dt>
              <dd className="text-gray-900 dark:text-white">{lotCurrentStepLabel(lot)}</dd>
            </div>
            {activeOp ? (
              <div className="col-span-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-2 py-1.5">
                <dt className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">ผู้ทำ (ขั้นปัจจุบัน)</dt>
                <dd className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-100">{activeOp}</dd>
              </div>
            ) : null}
          </dl>

          {flowSteps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Kanban — สถานะ / ผู้ทำ (login)
              </p>
              <ProductionLotKanbanFlowTable lot={lot} flowSteps={flowSteps} />
            </div>
          )}

          {completedSteps.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ปิดงานแล้ว</p>
              <ul className="space-y-1">
                {completedSteps.map((t, i) => {
                  const op = t.operator?.trim();
                  return (
                    <li key={i} className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-mono font-medium">{t.process?.processCode ?? t.processCode}</span>
                      {t.process?.processName || t.processName ? (
                        <span className="text-gray-500"> — {t.process?.processName ?? t.processName}</span>
                      ) : null}
                      {op ? (
                        <span className="text-gray-800 dark:text-gray-200 font-medium"> · ผู้ทำ: {op}</span>
                      ) : null}
                      {t.endTime && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {new Date(t.endTime).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
