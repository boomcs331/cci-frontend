"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ProductionOrderLotCard from "@/components/production/ProductionOrderLotCard";
import WorkpieceImage from "@/components/pc/shared/WorkpieceImage";
import { fetchProductionOrder } from "@/services/productionOrdersService";
import { getProductProductionSteps } from "@/services/productProductionStepsService";
import { printProductionOrderKanbanTags } from "@/utils/productionOrderKanbanPrint";
import { resolveProductImagePath } from "@/utils/productImage";
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

function orderCurrentStepSummary(lots: ProductionOrderLot[]): string {
  if (lots.length === 0) return "—";
  if (lots.every((l) => l.status === "COMPLETED")) return "ทุกล็อตผลิตเสร็จสิ้นแล้ว";
  const inProgress = lots.filter((l) => l.status === "IN_PROGRESS");
  if (inProgress.length === 0) {
    if (lots.some((l) => l.status === "PENDING")) {
      return "ยังไม่มีล็อตที่กำลังผลิต — รอเริ่มงาน";
    }
    return "—";
  }
  const names = inProgress
    .map((l) => l.currentProcess?.processName)
    .filter((n): n is string => Boolean(n));
  const unique = [...new Set(names)];
  if (unique.length === 1) return `ล็อตที่กำลังผลิตอยู่ที่: ${unique[0]}`;
  if (unique.length > 1) return `ล็อตกำลังผลิตคนละขั้น (${unique.length} ขั้น)`;
  return "กำลังผลิต (ยังไม่ระบุขั้น)";
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
  const [flowSteps, setFlowSteps] = useState<ProductProductionStepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const o = await fetchProductionOrder(id);
      setOrder(o);
      try {
        const steps = await getProductProductionSteps(o.productId);
        setFlowSteps([...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id));
      } catch {
        setFlowSteps([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setOrder(null);
      setFlowSteps([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const lots = useMemo(
    () => [...(order?.lots ?? [])].sort((a, b) => a.sequenceNo - b.sequenceNo),
    [order?.lots]
  );
  const stats = useMemo(() => lotProgressStats(lots), [lots]);
  const productImagePath = order?.product ? resolveProductImagePath(order.product) : null;

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

  const stepSummary = orderCurrentStepSummary(lots);
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Flow + summary */}
        <div className="xl:col-span-1 space-y-6">
          <ComponentCard title="สรุปความคืบหน้า">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              <span className="text-gray-500 dark:text-gray-400">ขั้นตอนปัจจุบัน: </span>
              <strong>{stepSummary}</strong>
            </p>
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

          <ComponentCard title="Flow Process">
            {flowSteps.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่กำหนดลำดับขั้นสำหรับสินค้านี้</p>
            ) : (
              <ol className="relative border-l-2 border-brand-200 dark:border-brand-800 ml-2 space-y-4">
                {flowSteps.map((s, idx) => (
                  <li key={s.id} className="ml-4">
                    <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                      {s.process?.processCode ?? s.processId}
                    </p>
                    {s.process?.processName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{s.process.processName}</p>
                    )}
                  </li>
                ))}
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

        {/* Lots grid */}
        <div className="xl:col-span-2">
          <ComponentCard
            title={`ล็อตผลิต / QR (${lots.length})`}
            desc="คลิก QR เพื่อสแกนที่หน้ายิงตามแผนก — พิมพ์ Kanban จากปุ่มด้านบน"
          >
            {lots.length === 0 ? (
              <p className="text-center py-10 text-gray-500">ยังไม่มีล็อตในใบสั่งนี้</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lots.map((lot) => (
                  <ProductionOrderLotCard key={lot.id} lot={lot} flowSteps={flowSteps} />
                ))}
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
