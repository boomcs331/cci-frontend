"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ProductionOrderLotCard from "@/components/production/ProductionOrderLotCard";
import WorkpieceImage from "@/components/pc/shared/WorkpieceImage";
import { productionOrdersService } from "@/services/productionOrdersService";
import { getProductProductionSteps } from "@/services/productProductionStepsService";
import { printProductionOrderKanbanTags } from "@/utils/productionOrderKanbanPrint";
import {
  filterFlowStepsForDepartment,
  filterLotsForDepartment,
  lotAtFirstFlowStep,
  sortFlowSteps,
  stepAllowedForDepartment,
} from "@/utils/productionDepartmentFilter";
import { resolveProductImagePath } from "@/utils/productImage";
import {
  processStepDisplayName,
  processStepBadgeClass,
} from "@/utils/productionProcessDisplay";
import { useClientHydrated } from "@/hooks/useClientHydrated";
import { getUserDepartmentCode, isAdmin } from "@/utils/session";
import type {
  ProductionOrderDetail,
  ProductionOrderLot,
  ProductProductionStepRow,
} from "@/types/production";

function orderStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "IN_PROGRESS") return "กำลังผลิต";
  if (s === "COMPLETED") return "เสร็จสิ้น";
  if (s === "DRAFT") return "ร่าง";
  if (s === "CANCELLED") return "ยกเลิก";
  return status;
}

function orderStatusClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "COMPLETED") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-200";
  }
  if (s === "IN_PROGRESS") {
    return "bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-200";
  }
  if (s === "DRAFT") {
    return "bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300";
  }
  return "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-200";
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

const FLOW_STEP_ORDER = ["WELDING", "PRESS", "CHECKING", "COMPLETE"] as const;

type ActiveProcessStep = {
  code: string;
  displayName: string;
  lotCount: number;
  inProgressCount: number;
};

function collectActiveProcessSteps(
  lots: ProductionOrderLot[],
  flowSteps: ProductProductionStepRow[],
): ActiveProcessStep[] {
  const map = new Map<string, ActiveProcessStep>();
  const firstStep = sortFlowSteps(flowSteps)[0];
  const firstCode = firstStep?.process?.processCode?.trim().toUpperCase();

  for (const lot of lots) {
    if (!["PENDING", "IN_PROGRESS"].includes(lot.status)) continue;

    if (lot.status === "PENDING") {
      if (!firstCode || !lotAtFirstFlowStep(lot, flowSteps)) continue;
      const existing = map.get(firstCode);
      if (existing) {
        existing.lotCount += 1;
      } else {
        map.set(firstCode, {
          code: firstCode,
          displayName: processStepDisplayName(
            firstStep?.process?.processCode,
            firstStep?.process?.processName,
          ),
          lotCount: 1,
          inProgressCount: 0,
        });
      }
      continue;
    }

    const code = (lot.currentProcess?.processCode ?? "").trim().toUpperCase();
    if (!code) continue;

    const existing = map.get(code);
    if (existing) {
      existing.lotCount += 1;
      existing.inProgressCount += 1;
    } else {
      map.set(code, {
        code,
        displayName: processStepDisplayName(
          lot.currentProcess?.processCode,
          lot.currentProcess?.processName,
        ),
        lotCount: 1,
        inProgressCount: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const ia = FLOW_STEP_ORDER.indexOf(a.code as (typeof FLOW_STEP_ORDER)[number]);
    const ib = FLOW_STEP_ORDER.indexOf(b.code as (typeof FLOW_STEP_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function buildCurrentStepHeadline(
  lots: ProductionOrderLot[],
  flowSteps: ProductProductionStepRow[],
): string {
  if (lots.length === 0) return "—";
  if (lots.every((l) => l.status === "COMPLETED")) {
    return "ผลิตครบทุกขั้นแล้ว";
  }

  const steps = collectActiveProcessSteps(lots, flowSteps);
  if (steps.length === 0) {
    if (lots.some((l) => l.status === "PENDING")) return "รอเริ่มผลิต";
    return "—";
  }

  if (steps.length === 1) {
    return `อยู่ขั้น ${steps[0].displayName}`;
  }

  return `อยู่ขั้น ${steps.map((s) => s.displayName).join(" · ")}`;
}

function buildOrderCurrentStatus(
  order: ProductionOrderDetail,
  lots: ProductionOrderLot[],
  flowSteps: ProductProductionStepRow[],
): {
  headline: string;
  subline: string;
  activeSteps: ActiveProcessStep[];
} {
  const orderSt = orderStatusLabel(order.status);
  if (lots.length === 0) {
    return {
      headline: orderSt,
      subline: "ยังไม่มีล็อตในใบสั่งนี้",
      activeSteps: [],
    };
  }

  const completed = lots.filter((l) => l.status === "COMPLETED").length;
  const inProgress = lots.filter((l) => l.status === "IN_PROGRESS").length;
  const pending = lots.filter((l) => l.status === "PENDING").length;
  const rejected = lots.filter((l) => l.status === "REJECTED").length;
  const activeSteps = collectActiveProcessSteps(lots, flowSteps);

  const headline = buildCurrentStepHeadline(lots, flowSteps);
  const parts: string[] = [
    `สถานะใบสั่ง: ${orderSt}`,
    `เสร็จ ${completed}/${lots.length}`,
  ];
  if (inProgress > 0) parts.push(`กำลังผลิต ${inProgress} ล็อต`);
  if (pending > 0) parts.push(`รอ ${pending} ล็อต`);
  if (rejected > 0) parts.push(`ปฏิเสธ ${rejected}`);

  return { headline, subline: parts.join(" · "), activeSteps };
}

function lotProgressStats(lots: ProductionOrderLot[]) {
  const total = lots.length;
  const completed = lots.filter((l) => l.status === "COMPLETED").length;
  const inProgress = lots.filter((l) => l.status === "IN_PROGRESS").length;
  const pending = lots.filter((l) => l.status === "PENDING").length;
  return { total, completed, inProgress, pending };
}

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<ProductionOrderDetail | null>(null);
  const [allFlowSteps, setAllFlowSteps] = useState<ProductProductionStepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  /** ล็อตที่อยู่ใน Set = หุบอยู่ — default ว่าง = เปิดทั้งหมด */
  const [collapsedLotIds, setCollapsedLotIds] = useState<Set<number>>(
    () => new Set(),
  );
  /** เก็บ ID ของล็อตที่กำลังโฟกัสอยู่ก่อน reload */
  const [focusedLotId, setFocusedLotId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const o = await productionOrdersService.fetchDetail(id);
      setOrder(o);
      try {
        const steps = await getProductProductionSteps(o.productId);
        setAllFlowSteps(
          [...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id),
        );
      } catch {
        setAllFlowSteps([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setOrder(null);
      setAllFlowSteps([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const hydrated = useClientHydrated();
  const userDeptCode = hydrated ? getUserDepartmentCode() : null;
  const isAdminUser = hydrated ? isAdmin() : false;

  const flowSteps = useMemo(
    () => filterFlowStepsForDepartment(allFlowSteps, userDeptCode, isAdminUser),
    [allFlowSteps, userDeptCode, isAdminUser],
  );

  const allLots = useMemo(
    () => [...(order?.lots ?? [])].sort((a, b) => a.sequenceNo - b.sequenceNo),
    [order?.lots],
  );

  const lots = useMemo(
    () => filterLotsForDepartment(allLots, allFlowSteps, userDeptCode, isAdminUser),
    [allLots, allFlowSteps, userDeptCode, isAdminUser],
  );

  useEffect(() => {
    const validIds = new Set(lots.map((l) => l.id));
    setCollapsedLotIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [lots]);

  useEffect(() => {
    if (focusedLotId && lots.length > 0) {
      const lotExists = lots.some((l) => l.id === focusedLotId);
      if (lotExists) {
        setCollapsedLotIds((prev) => {
          const next = new Set(prev);
          next.delete(focusedLotId);
          return next;
        });
        setTimeout(() => {
          const element = document.getElementById(`lot-${focusedLotId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setFocusedLotId(null);
          }
        }, 100);
      } else {
        setFocusedLotId(null);
      }
    }
  }, [focusedLotId, lots]);

  const stats = useMemo(() => lotProgressStats(lots), [lots]);
  const productImagePath = order?.product ? resolveProductImagePath(order.product) : null;

  const allLotsCollapsed =
    lots.length > 0 && collapsedLotIds.size >= lots.length;
  const allLotsExpanded = collapsedLotIds.size === 0;

  const collapseAllLots = () => {
    setCollapsedLotIds(new Set(lots.map((l) => l.id)));
  };

  const expandAllLots = () => {
    setCollapsedLotIds(new Set());
  };

  const toggleLotCollapsed = (lotId: number) => {
    setCollapsedLotIds((prev) => {
      const next = new Set(prev);
      if (next.has(lotId)) next.delete(lotId);
      else next.add(lotId);
      return next;
    });
  };

  const handlePrintAll = async () => {
    if (!order || lots.length === 0) return;
    setPrinting(true);
    try {
      await printProductionOrderKanbanTags(lots, order, flowSteps);
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายละเอียดคำสั่งผลิต" />
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center text-gray-500">
          กำลังโหลด...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายละเอียดคำสั่งผลิต" />
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-6">
          <p className="text-red-700 dark:text-red-300">{error || "ไม่พบข้อมูล"}</p>
          <Link
            href="/production/production-orders"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← กลับรายการคำสั่งผลิต
          </Link>
        </div>
      </div>
    );
  }

  const statusLots =
    !isAdminUser && userDeptCode?.trim() ? lots : allLots;
  const currentStatus = buildOrderCurrentStatus(order, statusLots, allFlowSteps);
  const stepSummary = buildCurrentStepHeadline(statusLots, allFlowSteps);
  const flowProcessActiveCodes = new Set(
    currentStatus.activeSteps.map((s) => s.code),
  );
  const deptFlowHighlight =
    !isAdminUser && Boolean(userDeptCode?.trim());
  const customerLabel = order.product?.customer
    ? `${order.product.customer.name}${order.product.customer.code ? ` (${order.product.customer.code})` : ""}`
    : "—";

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={`คำสั่งผลิต ${order.orderNo}`} />

      {/* Hero */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white via-brand-50/30 to-blue-50/40 dark:from-gray-900 dark:via-brand-950/20 dark:to-gray-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-200/80 dark:border-gray-700 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex gap-4 min-w-0 flex-1">
            <WorkpieceImage
              path={productImagePath}
              alt={order.product?.productName ?? "สินค้า"}
              size="lg"
              className="hidden sm:block shrink-0 !h-24 !w-24"
            />
            <div className="min-w-0">
              <Link
                href="/production/production-orders"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400 mb-2 inline-block"
              >
                ← รายการคำสั่งผลิต
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  {order.orderNo}
                </h1>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${orderStatusClass(order.status)}`}
                >
                  {orderStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {order.product?.productCode}{" "}
                <span className="text-gray-500 dark:text-gray-400 font-normal">
                  — {order.product?.productName}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ลูกค้า: <span className="font-medium text-gray-800 dark:text-gray-200">{customerLabel}</span>
              </p>
              {order.remarks?.trim() && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{order.remarks}</p>
              )}


            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handlePrintAll()}
              disabled={lots.length === 0 || printing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 shadow-sm"
            >
              {printing ? "กำลังเตรียมพิมพ์..." : "พิมพ์ Kanban ทั้งหมด"}
            </button>
            <Link
              href="/production/dept-step-scan"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ยิง QR ตามแผนก
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
          {[
            { label: "จำนวนสั่ง", value: order.orderQuantity },
            { label: "ต่อล็อต / STD", value: order.lotSize },
            { label: "จำนวน QR", value: order.totalLots },
            { label: "ล็อตเสร็จ", value: `${stats.completed}/${stats.total}` },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3 text-center sm:text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {/* Flow + summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard title="สรุปความคืบหน้า">
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">สถานะปัจจุบันก</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stepSummary}</p>
              {currentStatus.activeSteps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentStatus.activeSteps.map((step) => (
                    <span
                      key={step.code}
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${processStepBadgeClass(step.code, step.inProgressCount > 0)}`}
                    >
                      {step.displayName}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{currentStatus.subline}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                เสร็จ {stats.completed}
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                กำลังผลิต {stats.inProgress}
              </span>
              <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                รอ {stats.pending}
              </span>
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              เลขล็อต <span className="font-mono">PG…</span> คู่ <span className="font-mono">PD…</span> — สแกน QR
              ที่สถานีผลิตเพื่อเริ่ม/ปิดขั้น
            </p>
          </ComponentCard>

          <ComponentCard
            title="Flow Process"
            desc={
              deptFlowHighlight
                ? `ลำดับขั้นทั้งหมด — 「ขั้นปัจุบัน」ตามล็อตที่แผนก ${userDeptCode} รับงาน`
                : "ลำดับขั้นตอนผลิตทั้งหมดของสินค้า"
            }
          >
            {allFlowSteps.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่กำหนดลำดับขั้นสำหรับสินค้านี้</p>
            ) : (
              <ol className="relative border-l-2 border-brand-200 dark:border-brand-800 ml-2 space-y-4">
                {allFlowSteps.map((s, idx) => {
                  const code = (s.process?.processCode ?? "").toUpperCase();
                  const isDeptStep =
                    isAdminUser ||
                    !userDeptCode?.trim() ||
                    stepAllowedForDepartment(s, userDeptCode);
                  const isCurrent =
                    isDeptStep && flowProcessActiveCodes.has(code);
                  const display = processStepDisplayName(
                    s.process?.processCode,
                    s.process?.processName,
                  );
                  return (
                    <li
                      key={s.id}
                      className={`ml-4 rounded-lg pr-2 py-1 transition-colors ${
                        isCurrent
                          ? "bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-400/60 dark:ring-brand-600/50"
                          : ""
                      }`}
                    >
                      <span
                        className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                          isCurrent ? "bg-brand-600 ring-2 ring-brand-300" : "bg-brand-500"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {display}
                        {isCurrent ? (
                          <span className="ml-2 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                            ← ขั้นปัจจุบัน
                          </span>
                        ) : null}
                      </p>
                      <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                        {s.process?.processCode ?? s.processId}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
            {order.productId && (
              <Link
                href={`/master-data/production-steps/${order.productId}`}
                className="inline-block mt-4 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                แก้ไขลำดับขั้นตอนสินค้า →
              </Link>
            )}
          </ComponentCard>
        </div>

        {/* Lots — full width */}
        <div className="w-full">
          <ComponentCard
            title={`ล็อตผลิต / QR (${lots.length})`}
            desc="คลิก QR เพื่อสแกนที่หน้ายิงตามแผนก — แต่ละล็อตมีปุ่มแสดง/พิมพ์ Kanban หรือพิมพ์ทั้งหมดจากด้านบน"
          >
            {lots.length === 0 ? (
              <p className="text-center py-10 text-gray-500">ยังไม่มีล็อตในใบสั่งนี้</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={expandAllLots}
                    disabled={allLotsExpanded}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    ขยายทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllLots}
                    disabled={allLotsCollapsed}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    หุบทั้งหมด
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 w-full">
                  {lots.map((lot) => (
                    <ProductionOrderLotCard
                      key={lot.id}
                      lot={lot}
                      order={order}
                      flowSteps={flowSteps}
                      allFlowSteps={allFlowSteps}
                      userDepartmentCode={userDeptCode}
                      isAdmin={isAdminUser}
                      onLotUpdated={(lotId) => {
                        setFocusedLotId(lotId);
                        void load();
                      }}
                      expanded={!collapsedLotIds.has(lot.id)}
                      onToggleExpanded={() => toggleLotCollapsed(lot.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
