"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import ProductionKanbanPreviewModal from "@/components/production/ProductionKanbanPreviewModal";
import ProductionCloseStepModal from "@/components/production/ProductionCloseStepModal";
import ProductionSplitLotModal from "@/components/production/ProductionSplitLotModal";
import ProductionLotKanbanFlowTable from "@/components/production/ProductionLotKanbanFlowTable";
import ProductionLotStepQuantityTable from "@/components/production/ProductionLotStepQuantityTable";
import { matchTrackingByProcessCode } from "@/utils/productionLotFlow";
import { resolveOperatorLabel } from "@/utils/resolveStoredUserLabel";
import { getSession } from "@/utils/session";
import {
  buildProductionKanbanTagsHtml,
  printProductionOrderKanbanTag,
} from "@/utils/productionOrderKanbanPrint";
import { processStepBadgeClass } from "@/utils/productionProcessDisplay";
import { resolveLotStepBadgeForUser } from "@/utils/productionDepartmentFilter";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import {
  advanceLotStepAtStation,
  fetchLotStation,
  fetchLotStepQuantities,
  splitProductionLot,
} from "@/services/productionOrdersService";
import type { LotStationPayload } from "@/types/productionLotStation";
import type { LotStepQuantitiesPayload } from "@/types/productionLotStepQuantities";
import type {
  ProductionOrderDetail,
  ProductionOrderLot,
  ProductProductionStepRow,
} from "@/types/production";

function currentStepOperator(lot: ProductionOrderLot): string | null {
  const code = lot.currentProcess?.processCode?.trim();
  if (!code) {
    const active = (lot.tracking ?? []).find((t) => t.status === "IN_PROGRESS");
    return active?.operator?.trim() || null;
  }
  return matchTrackingByProcessCode(lot, code)?.operator?.trim() || null;
}

function lotStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "PENDING") return "รอเริ่ม";
  if (s === "IN_PROGRESS") return "กำลังผลิต";
  if (s === "COMPLETED") return "เสร็จสิ้น";
  if (s === "REJECTED") return "ถูกปฏิเสธ";
  if (s === "SPLIT") return "แยกล็อต";
  return status;
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

function CollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type Props = {
  lot: ProductionOrderLot;
  order: ProductionOrderDetail;
  flowSteps: ProductProductionStepRow[];
  /** ลำดับขั้นเต็มของสินค้า (ใช้หาขั้นที่ 1) */
  allFlowSteps: ProductProductionStepRow[];
  userDepartmentCode?: string | null;
  isAdmin?: boolean;
  onLotUpdated?: (lotId: number) => void;
  /** default เปิด — ควบคุมจากหน้ารายละเอียดใบสั่ง */
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

export default function ProductionOrderLotCard({
  lot,
  order,
  flowSteps,
  allFlowSteps,
  userDepartmentCode = null,
  isAdmin = false,
  onLotUpdated,
  expanded = true,
  onToggleExpanded,
}: Props) {
  const [kanbanPreviewOpen, setKanbanPreviewOpen] = useState(false);
  const [kanbanPreviewHtml, setKanbanPreviewHtml] = useState<string | null>(null);
  const [kanbanPreviewLoading, setKanbanPreviewLoading] = useState(false);
  const [kanbanPrintBusy, setKanbanPrintBusy] = useState(false);
  const [station, setStation] = useState<LotStationPayload | null>(null);
  const [stationLoading, setStationLoading] = useState(false);
  const [stepBusy, setStepBusy] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitBusy, setSplitBusy] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [stepQty, setStepQty] = useState<LotStepQuantitiesPayload | null>(null);
  const [stepQtyLoading, setStepQtyLoading] = useState(false);
  const [stepQtyError, setStepQtyError] = useState<string | null>(null);
  const [closeStepModalOpen, setCloseStepModalOpen] = useState(false);
  const sessionUser = getSession()?.user;

  const getOperator = useCallback((): string => {
    const username = getSession()?.user?.username?.trim();
    return username || "scanner";
  }, []);

  const reloadStation = useCallback(async () => {
    if (!lot.qrCode?.trim()) {
      setStation(null);
      return;
    }
    setStationLoading(true);
    setStepError(null);
    try {
      const data = await fetchLotStation(lot.qrCode);
      setStation(data);
    } catch (err) {
      setStation(null);
      setStepError(err instanceof Error ? err.message : "โหลดสถานีล็อตไม่สำเร็จ");
    } finally {
      setStationLoading(false);
    }
  }, [lot.qrCode]);

  const reloadStepQuantities = useCallback(async () => {
    if (!lot.qrCode?.trim()) {
      setStepQty(null);
      return;
    }
    setStepQtyLoading(true);
    setStepQtyError(null);
    try {
      const data = await fetchLotStepQuantities(lot.qrCode);
      setStepQty(data);
    } catch (err) {
      setStepQty(null);
      setStepQtyError(
        err instanceof Error ? err.message : "โหลดยอดรับเข้า/จ่ายออกไม่สำเร็จ",
      );
    } finally {
      setStepQtyLoading(false);
    }
  }, [lot.qrCode]);

  useEffect(() => {
    void reloadStation();
    void reloadStepQuantities();
  }, [reloadStation, reloadStepQuantities]);

  const rawActiveOp = currentStepOperator(lot);
  const activeOp = rawActiveOp ? resolveOperatorLabel(rawActiveOp, sessionUser) : null;

  const openKanbanPreview = async () => {
    setKanbanPreviewOpen(true);
    setKanbanPreviewLoading(true);
    setKanbanPreviewHtml(null);
    try {
      const html = await buildProductionKanbanTagsHtml([lot], order, flowSteps);
      setKanbanPreviewHtml(html);
    } finally {
      setKanbanPreviewLoading(false);
    }
  };

  const handlePrintKanban = async () => {
    setKanbanPrintBusy(true);
    try {
      await printProductionOrderKanbanTag(lot, order, flowSteps);
    } finally {
      setKanbanPrintBusy(false);
    }
  };

  const completedSteps = (lot.tracking ?? [])
    .filter((t) => t.status === "COMPLETED" && (t.process?.processCode || t.processCode))
    .sort((a, b) => new Date(a.endTime ?? 0).getTime() - new Date(b.endTime ?? 0).getTime());

  const stepBadge = resolveLotStepBadgeForUser(
    lot,
    allFlowSteps.length ? allFlowSteps : flowSteps,
    userDepartmentCode,
    isAdmin,
  );

  const stepActionLabel = useMemo(() => {
    if (!station) return null;
    if (station.nextAction === "complete" && station.inProgress) {
      return processStepDisplayName(
        station.inProgress.processCode,
        station.inProgress.processName,
      );
    }
    if (station.nextAction === "start" && station.expectedProcess) {
      return processStepDisplayName(
        station.expectedProcess.processCode,
        station.expectedProcess.processName,
      );
    }
    return stepBadge?.displayName ?? null;
  }, [station, stepBadge]);

  const canCloseStep =
    station != null &&
    station.status !== "COMPLETED" &&
    station.status !== "SPLIT" &&
    ((station.nextAction === "complete" && station.canComplete) ||
      (station.nextAction === "start" && station.canStart));

  const canSplit = !["COMPLETED", "SPLIT", "REJECTED"].includes(
    lot.status.toUpperCase(),
  );
  const isFirstProcessStep = useMemo(() => {
    const steps = (allFlowSteps.length ? allFlowSteps : flowSteps).slice().sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );
    if (!steps.length) return false;
    const firstProcessId = steps[0]?.processId;
    const currentId =
      lot.currentProcess?.id ??
      (lot.status.toUpperCase() === "PENDING" ? firstProcessId : null);
    return Boolean(firstProcessId && currentId === firstProcessId);
  }, [allFlowSteps, flowSteps, lot.currentProcess?.id, lot.status]);

  const openSplitModal = () => {
    if (!canSplit) return;
    setSplitError(null);
    setSplitModalOpen(true);
  };

  const handleSplitConfirm = async (qty: number, reason: string) => {
    setSplitBusy(true);
    setSplitError(null);
    try {
      await splitProductionLot(lot.qrCode, {
        releasedQuantity: qty,
        reason,
        operator: getOperator(),
      });
      setSplitModalOpen(false);
      await reloadStation();
      await reloadStepQuantities();
      onLotUpdated?.(lot.id);
    } catch (err) {
      setSplitError(err instanceof Error ? err.message : "แบ่งล็อตไม่สำเร็จ");
    } finally {
      setSplitBusy(false);
    }
  };

  const openCloseStepModal = () => {
    if (!station || !canCloseStep) return;
    setStepError(null);
    setCloseStepModalOpen(true);
  };

  const handleCloseStepConfirm = async (remarks: string) => {
    if (!station || !canCloseStep) return;

    setStepBusy(true);
    setStepError(null);
    try {
      await advanceLotStepAtStation(station, {
        operator: getOperator(),
        remarks: remarks || undefined,
      });
      setCloseStepModalOpen(false);
      await reloadStation();
      await reloadStepQuantities();
      onLotUpdated?.(lot.id);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "ปิดขั้นตอนไม่สำเร็จ");
    } finally {
      setStepBusy(false);
    }
  };

  return (
    <>
    <article id={`lot-${lot.id}`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden flex flex-col">
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 ${
          onToggleExpanded ? "cursor-pointer select-none" : ""
        }`}
        onClick={onToggleExpanded ? onToggleExpanded : undefined}
        onKeyDown={
          onToggleExpanded
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleExpanded();
                }
              }
            : undefined
        }
        role={onToggleExpanded ? "button" : undefined}
        tabIndex={onToggleExpanded ? 0 : undefined}
        aria-expanded={onToggleExpanded ? expanded : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onToggleExpanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded();
              }}
              className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-200/80 dark:hover:bg-gray-700"
              title={expanded ? "หุบรายละเอียด" : "ขยายรายละเอียด"}
              aria-label={expanded ? "หุบรายละเอียด" : "ขยายรายละเอียด"}
            >
              <CollapseChevron open={expanded} />
            </button>
          ) : null}
          <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold text-sm">
            {lot.sequenceNo}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">ล็อต / Kanban</p>
            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate">
              {lot.lotNo}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button
                type="button"
                disabled={kanbanPreviewLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  void openKanbanPreview();
                }}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
              >
                {kanbanPreviewLoading ? "..." : "แสดง Kanban"}
              </button>
              <button
                type="button"
                disabled={kanbanPrintBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePrintKanban();
                }}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                {kanbanPrintBusy ? "..." : "พิมพ์ Kanban"}
              </button>
              {canCloseStep ? (
                <button
                  type="button"
                  disabled={stepBusy || stationLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    openCloseStepModal();
                  }}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:opacity-50"
                  title={
                    stepActionLabel && stepActionLabel !== "—"
                      ? `ปิดขั้นตอน ${stepActionLabel}`
                      : "ปิดขั้นตอนปัจจุบัน"
                  }
                >
                  {stepBusy ? "..." : "ปิดขั้นตอน"}
                </button>
              ) : null}
              {canSplit ? (
                <button
                  type="button"
                  disabled={splitBusy || stepBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSplitModal();
                  }}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-md border border-violet-400 text-violet-700 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-300 dark:hover:bg-violet-950/40 disabled:opacity-50"
                >
                  แบ่งล็อต
                </button>
              ) : null}
            </div>
            {station?.denyReason && !canCloseStep ? (
              <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                {station.denyReason}
              </p>
            ) : null}
            {stepError ? (
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{stepError}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center sm:justify-end gap-1.5 shrink-0">
          {stepBadge ? (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${processStepBadgeClass(
                stepBadge.processCode,
                stepBadge.inProgress,
              )}`}
              title={stepBadge.processCode ?? undefined}
            >
              {stepBadge.displayName}
            </span>
          ) : null}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPillClass(lot.status)}`}
            title={lot.status}
          >
            {lotStatusLabel(lot.status)}
          </span>
        </div>
      </div>

      {expanded ? (
      <div className="p-4 flex flex-col gap-4 flex-1 w-full">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex flex-col items-center gap-2 sm:w-[140px] shrink-0">
            <QRCodeGenerator value={lot.qrCode} size={120} className="rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-white" />
            <p className="font-mono text-[10px] text-center text-gray-500 dark:text-gray-400 break-all leading-tight max-w-[140px]">
              {lot.qrCode}
            </p>
          </div>

          <div className="flex-1 min-w-0 text-sm">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5">
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
            {activeOp ? (
              <div className="col-span-2 sm:col-span-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-2 py-1.5">
                <dt className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">ผู้ทำ (ขั้นปัจจุบัน)</dt>
                <dd className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-100">{activeOp}</dd>
              </div>
            ) : null}
            </dl>
          </div>
        </div>

        {(allFlowSteps.length ? allFlowSteps : flowSteps).length > 0 && (
          <div className="w-full min-w-0">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Kanban — สถานะ / ผู้ทำ (login)
            </p>
            <ProductionLotKanbanFlowTable
              lot={lot}
              flowSteps={allFlowSteps.length ? allFlowSteps : flowSteps}
            />
          </div>
        )}

        <div className="w-full min-w-0 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              สอบกลับ — รับเข้า / จ่ายออก แต่ละขั้นตอน
            </p>
            <Link
              href={`/production/lot-trace-report?lot=${encodeURIComponent(lot.lotNo)}`}
              className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              เปิดในรายงาน →
            </Link>
          </div>
          {stepQtyLoading ? (
            <p className="text-xs text-gray-500">กำลังโหลดยอดต่อขั้น...</p>
          ) : stepQtyError ? (
            <p className="text-xs text-red-600 dark:text-red-400">{stepQtyError}</p>
          ) : stepQty?.steps?.length ? (
            <>
              <ProductionLotStepQuantityTable
                steps={stepQty.steps}
                unit={stepQty.unit || "PCS"}
                sessionUser={sessionUser}
              />
              {stepQty.splitChildren.length > 0 ? (
                <div className="mt-2 rounded-md bg-violet-50 dark:bg-violet-950/25 border border-violet-100 dark:border-violet-900/40 px-2.5 py-2">
                  <p className="text-[10px] font-medium text-violet-800 dark:text-violet-200 mb-1">
                    ล็อตย่อยจาก Split
                  </p>
                  <ul className="space-y-0.5 text-[10px] text-violet-900 dark:text-violet-100">
                    {stepQty.splitChildren.map((c) => (
                      <li key={c.qrCode} className="font-mono">
                        {c.lotNo}: {c.quantity} {stepQty.unit}
                        {c.splitReason ? ` — ${c.splitReason}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-gray-500">ยังไม่มีข้อมูลขั้นตอน</p>
          )}
        </div>

        {completedSteps.length > 0 && (
          <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ปิดงานแล้ว</p>
              <ul className="space-y-1">
                {completedSteps.map((t, i) => {
                  const op = t.operator?.trim()
                    ? resolveOperatorLabel(t.operator, sessionUser)
                    : undefined;
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
      ) : (
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          คลิกหัวการ์ดเพื่อขยายรายละเอียด · QR {lot.qrCode}
        </div>
      )}
    </article>

    <ProductionKanbanPreviewModal
      isOpen={kanbanPreviewOpen}
      onClose={() => setKanbanPreviewOpen(false)}
      title={lot.lotNo}
      subtitle={`${order.orderNo} · ลำดับ ${lot.sequenceNo}`}
      html={kanbanPreviewHtml}
      loading={kanbanPreviewLoading}
      onPrint={() => void handlePrintKanban()}
      printing={kanbanPrintBusy}
    />

    {station && canCloseStep ? (
      <ProductionCloseStepModal
        isOpen={closeStepModalOpen}
        onClose={() => {
          if (!stepBusy) setCloseStepModalOpen(false);
        }}
        onConfirm={handleCloseStepConfirm}
        lot={lot}
        station={station}
        stepLabel={
          stepActionLabel && stepActionLabel !== "—" ? stepActionLabel : "ขั้นตอน"
        }
        busy={stepBusy}
      />
    ) : null}

    {canSplit ? (
      <ProductionSplitLotModal
        isOpen={splitModalOpen}
        onClose={() => {
          if (!splitBusy) setSplitModalOpen(false);
        }}
        onConfirm={handleSplitConfirm}
        lot={lot}
        order={order}
        isFirstProcessStep={isFirstProcessStep}
        busy={splitBusy}
        externalError={splitError}
      />
    ) : null}
    </>
  );
}
