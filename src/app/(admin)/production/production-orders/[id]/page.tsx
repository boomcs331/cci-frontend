"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import { fetchProductionOrder } from "@/services/productionOrdersService";
import { getProductProductionSteps } from "@/services/productProductionStepsService";
import type {
  ProductionOrderDetail,
  ProductionOrderLot,
  ProductProductionStepRow,
} from "@/types/production";

function lotHasCompletedProcess(lot: ProductionOrderLot, processCode: string): boolean {
  const code = (processCode ?? "").trim();
  if (!code) return false;
  return (lot.tracking ?? []).some(
    (t) =>
      t.status === "COMPLETED" &&
      (t.process?.processCode === code || t.processCode === code)
  );
}

function lotCurrentStepLabel(lot: ProductionOrderLot): string {
  if (lot.status === "COMPLETED") return "เสร็จสิ้น";
  if (lot.status === "REJECTED") return "ถูกปฏิเสธ";
  if (lot.status === "PENDING") return "รอเริ่มงาน";
  if (lot.currentProcess?.processName) {
    const code = lot.currentProcess.processCode ? ` · ${lot.currentProcess.processCode}` : "";
    return `${lot.currentProcess.processName}${code}`;
  }
  if (lot.status === "IN_PROGRESS") {
    return "กำลังผลิต (ยังไม่ระบุขั้น)";
  }
  return lot.status;
}

function orderCurrentStepSummary(lots: ProductionOrderLot[]): string {
  if (lots.length === 0) return "—";
  if (lots.every((l) => l.status === "COMPLETED")) {
    return "ทุกล็อตผลิตเสร็จสิ้นแล้ว";
  }
  const inProgress = lots.filter((l) => l.status === "IN_PROGRESS");
  if (inProgress.length === 0) {
    if (lots.some((l) => l.status === "PENDING")) {
      return "ยังไม่มีล็อตที่กำลังผลิต — ล็อตอยู่ในสถานะรอเริ่ม";
    }
    return "—";
  }
  const names = inProgress
    .map((l) => l.currentProcess?.processName)
    .filter((n): n is string => Boolean(n));
  const unique = [...new Set(names)];
  if (unique.length === 1) {
    return `ล็อตที่กำลังผลิตอยู่ที่ขั้น: ${unique[0]}`;
  }
  if (unique.length > 1) {
    return `ล็อตที่กำลังผลิตอยู่คนละขั้น (${unique.length} ขั้น) — ดูรายละเอียดในแต่ละแถว`;
  }
  return "กำลังผลิต (ยังไม่ระบุขั้นจากระบบ)";
}

export default function ProductionOrderQrPage() {
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<ProductionOrderDetail | null>(null);
  const [flowSteps, setFlowSteps] = useState<ProductProductionStepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const o = await fetchProductionOrder(id);
      setOrder(o);
      try {
        const steps = await getProductProductionSteps(o.productId);
        setFlowSteps(
          [...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id)
        );
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
    load();
  }, [load]);

  const handlePrintAll = async (
    lots: ProductionOrderLot[],
    o: ProductionOrderDetail,
    steps: ProductProductionStepRow[]
  ) => {
    if (lots.length === 0) return;
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const stdPack = o.lotSize || 100;
    const partNo = o.product?.productCode ?? "";
    const partName = o.product?.productName ?? "";
    const customerBrand =
      o.product?.customer?.name?.trim() ||
      o.product?.customer?.code?.trim() ||
      "";
    const orderedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id);

    const tags: string[] = [];
    for (const lot of lots) {
      const dataUrl = await QRCode.toDataURL(lot.qrCode, { width: 220, margin: 0 });
      const kanbanNo = String(lot.sequenceNo).padStart(3, "0");
      const fullQty = Math.floor(lot.quantity / stdPack);
      const remainQty = lot.quantity % stdPack;
      const lotMat = lot.lotPdNo || lot.lotNo || "";
      const qrLabel = `${partNo}/${stdPack}/${lot.sequenceNo}`;

      const flowHeaderCells =
        orderedSteps.length > 0
          ? orderedSteps
              .map((s) => {
                const p = s.process;
                const label = p
                  ? `${p.processCode}${p.processName ? ` · ${p.processName}` : ""}`
                  : `#${s.processId}`;
                return `<td class="lbl flow-step">${escapeHtml(label)}</td>`;
              })
              .join("")
          : `<td class="lbl flow-step" colspan="1">${escapeHtml("ยังไม่กำหนดลำดับขั้น (product_production_steps)")}</td>`;

      const flowStatusCells =
        orderedSteps.length > 0
          ? orderedSteps
              .map((s) => {
                const code = s.process?.processCode ?? "";
                const done = lotHasCompletedProcess(lot, code);
                return `<td class="check-cell">${done ? "&#10003;" : ""}</td>`;
              })
              .join("")
          : `<td></td>`;

      tags.push(`
        <div class="kanban">
          <div class="vert"><div class="vert-inner">CHIEW CHAN INDUSTRY (1989)CO.,LTD.(CCI)</div></div>
          <div class="body">
            <table class="top">
              <colgroup>
                <col style="width:13%" />
                <col style="width:28%" />
                <col style="width:11%" />
                <col style="width:13%" />
                <col style="width:10%" />
                <col style="width:10%" />
                <col style="width:15%" />
              </colgroup>
              <tr>
                <td class="lbl">PART NO</td>
                <td class="val big">${escapeHtml(partNo)}</td>
                <td rowspan="5" class="customer-brand"><span>${escapeHtml(customerBrand || "—")}</span></td>
                <td class="lbl">Number Kanban</td>
                <td colspan="2" class="val big bold">${kanbanNo}</td>
                <td rowspan="5" class="qr">
                  <img src="${dataUrl}" alt="qr" />
                  <div class="qr-label">${escapeHtml(qrLabel)}</div>
                </td>
              </tr>
              <tr>
                <td rowspan="2" class="lbl">PART NAME</td>
                <td rowspan="2" class="val big">${escapeHtml(partName)}</td>
                <td rowspan="2" class="lbl">QTY</td>
                <td class="sublbl">จำนวนเต็ม</td>
                <td class="sublbl">จำนวนเศษ</td>
              </tr>
              <tr>
                <td class="val big">${fullQty}</td>
                <td class="val big">${remainQty}</td>
              </tr>
              <tr>
                <td class="lbl">วันเดือนปีผลิต</td>
                <td class="val">${dateStr}</td>
                <td rowspan="2" class="lbl">STD. PACKING</td>
                <td class="val">BOX</td>
                <td class="val">RACK <span class="check">&#10003;</span></td>
              </tr>
              <tr>
                <td class="lbl">Lot No. mat</td>
                <td class="val">${escapeHtml(lotMat)}</td>
                <td colspan="2" class="val big center">${stdPack}</td>
              </tr>
            </table>
            <table class="flow">
              <tr>
                <td class="lbl flow-lbl">Flow Process</td>
                ${flowHeaderCells}
              </tr>
              <tr class="status-row">
                <td class="lbl">สถานะ</td>
                ${flowStatusCells}
              </tr>
            </table>
          </div>
        </div>
      `);
    }

    const w = window.open("", "_blank");
    if (!w) {
      alert("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>Kanban Tag — ${escapeHtml(o.orderNo)}</title>
      <meta charset="utf-8" />
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { background: #f0f0f0; }
        body { font-family: "Segoe UI", "Sarabun", "Tahoma", sans-serif; padding: 0; margin: 0; color: #000; }
        .toolbar {
          position: sticky; top: 0; z-index: 10;
          background: #fff; border-bottom: 1px solid #ddd;
          padding: 8px 12px; display: flex; gap: 8px; justify-content: flex-end;
        }
        .toolbar button {
          padding: 6px 14px; border: 1px solid #2563eb; background: #2563eb;
          color: #fff; border-radius: 6px; cursor: pointer; font-size: 13px;
        }
        .toolbar .secondary { background: #fff; color: #2563eb; }
        .sheet {
          width: 194mm;
          margin: 0 auto;
          padding: 4mm 0;
        }
        .kanban {
          display: flex;
          border: 1px solid #000;
          width: 100%;
          margin: 0 auto 1.2mm auto;
          page-break-inside: avoid;
          break-inside: avoid;
          background: #fff;
        }
        .kanban:last-child { margin-bottom: 0; }
        .vert {
          width: 18px;
          border-right: 1px solid #000;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .vert-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(180deg);
          writing-mode: vertical-rl;
          white-space: nowrap;
          font-weight: 700;
          font-size: 7px;
          letter-spacing: 0.2px;
        }
        .body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .body > table:last-child { flex: 1; }
        table.top, table.flow {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        table.top td, table.flow td {
          border: 1px solid #000;
          padding: 1px 3px;
          font-size: 8.5px;
          line-height: 1.15;
          vertical-align: middle;
        }
        .lbl { font-weight: 600; font-size: 8px; text-align: center; background: #fafafa; }
        .sublbl { font-size: 7.5px; text-align: center; background: #fafafa; }
        .val { text-align: center; }
        .val.big { font-size: 10.5px; font-weight: 700; }
        .val.center { text-align: center; }
        .bold { font-weight: 700; }
        .customer-brand {
          text-align: center;
          font-weight: 900;
          font-style: italic;
          font-size: 14px;
          letter-spacing: 0.5px;
          background: #fff;
          padding: 0 !important;
          word-break: break-word;
          line-height: 1.05;
        }
        .customer-brand span {
          display: inline-block;
          transform: skewX(-10deg);
        }
        .qr {
          text-align: center;
          padding: 1px !important;
          background: #fff;
        }
        .qr img { width: 60px; height: 60px; display: block; margin: 0 auto; }
        .qr-label { font-size: 6.5px; font-family: monospace; margin-top: 1px; word-break: break-all; line-height: 1.1; }
        .check { color: #000; font-weight: 700; }
        .flow td { padding: 1px 2px; text-align: center; }
        .flow-lbl { width: 10%; min-width: 52px; }
        .flow-step { font-size: 7px; line-height: 1.1; word-break: break-word; }
        .status-row td { font-size: 10px; font-weight: 700; }
        .check-cell { font-size: 11px; font-weight: 700; }
        @media print {
          html, body { background: #fff; }
          .toolbar { display: none; }
          .sheet { width: auto; padding: 0; margin: 0; }
          .kanban { margin: 0 0 1.2mm 0; }
        }
      </style></head><body>
      <div class="toolbar">
        <button class="secondary" onclick="window.close()">ปิด</button>
        <button onclick="window.print()">พิมพ์</button>
      </div>
      <div class="sheet">${tags.join("")}</div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); }</script>
      </body></html>`);
    w.document.close();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>;
  }
  if (error || !order) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "ไม่พบข้อมูล"}</p>
        <Link href="/production/production-orders" className="text-blue-600 mt-4 inline-block">
          ← กลับรายการ
        </Link>
      </div>
    );
  }

  const lots = [...(order.lots ?? [])].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const stepSummary = orderCurrentStepSummary(lots);

  return (
    <div>
      <PageBreadcrumb pageTitle={`QR ล็อต — ${order.orderNo}`} />
      <div className="mb-4">
        <Link
          href="/production/production-orders"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← รายการคำสั่งผลิต
        </Link>
      </div>
      <ComponentCard title={`${order.orderNo} · ${order.product?.productCode ?? ""} ${order.product?.productName ?? ""}`}>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
          <p>
            จำนวนสั่ง: <strong>{order.orderQuantity}</strong> · ต่อล็อต: <strong>{order.lotSize}</strong> · จำนวน QR:{" "}
            <strong>{order.totalLots}</strong> · สถานะ: <strong>{order.status}</strong>
          </p>
          <p>
            {"ขั้นตอนปัจจุบัน (สรุปจากล็อต):"}{" "}
            <strong className="text-gray-900 dark:text-gray-100">{stepSummary}</strong>
          </p>
          <p>
            ลูกค้า:{" "}
            <strong className="text-gray-900 dark:text-gray-100">
              {order.product?.customer
                ? `${order.product.customer.name}${order.product.customer.code ? ` (${order.product.customer.code})` : ""}`
                : "—"}
            </strong>
          </p>
          <p className="text-xs">
            เลขล็อตหลัก <span className="font-mono">PG…</span> คู่ <span className="font-mono">PD…</span> แบบรับเข้า
            (วัตถุดิบใช้ <span className="font-mono">PC…</span>) — QR จากค่า PG เหมือน QR จาก PC
          </p>
          <p className="text-xs">
            ข้อความใน QR = <span className="font-mono">qrCode</span> —{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">GET /production-orders/lots/&lt;qr&gt;/status</code>
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Flow Process <span className="font-normal text-gray-500">(product_production_steps)</span>
            </p>
            {flowSteps.length === 0 ? (
              <p className="text-xs text-gray-500">ยังไม่มีลำดับขั้นสำหรับสินค้านี้ หรือโหลดไม่สำเร็จ</p>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {flowSteps.map((s) => (
                  <li key={s.id}>
                    <span className="font-mono text-xs">{s.process?.processCode ?? s.processId}</span>
                    {s.process?.processName ? (
                      <>
                        {" "}
                        <span className="text-gray-600 dark:text-gray-400">— {s.process.processName}</span>
                      </>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => handlePrintAll(lots, order, flowSteps)}
            disabled={lots.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
          >
            พิมพ์ QR ทั้งหมด
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">ลำดับ</th>
                <th className="px-3 py-2 text-left">PG (หลัก)</th>
                <th className="px-3 py-2 text-left">PD (คู่)</th>
                <th className="px-3 py-2 text-left">อ้างอิงใบสั่ง</th>
                <th className="px-3 py-2 text-center">QR</th>
                <th className="px-3 py-2 text-right">จำนวน</th>
                <th className="px-3 py-2 text-left">ขั้นตอนปัจจุบัน</th>
                <th className="px-3 py-2 text-center">สถานะ</th>
                <th className="px-3 py-2 text-left">ประวัติปิดงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lots.length === 0 ? (
                <TableEmptyRow colSpan={9} />
              ) : (
                lots.map((lot) => {
                  const completedSteps = (lot.tracking ?? [])
                    .filter((t) => t.status === "COMPLETED" && (t.process?.processCode || t.processCode))
                    .sort((a, b) => new Date(a.endTime ?? 0).getTime() - new Date(b.endTime ?? 0).getTime());
                  return (
                    <tr key={lot.id}>
                      <td className="px-3 py-2">{lot.sequenceNo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{lot.lotNo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{lot.lotPdNo ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{lot.orderLotLabel ?? "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <QRCodeGenerator value={lot.qrCode} size={88} className="mx-auto" />
                          <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 max-w-[200px] break-all text-center">
                            {lot.qrCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{lot.quantity}</td>
                      <td className="px-3 py-2 text-left max-w-[220px]">{lotCurrentStepLabel(lot)}</td>
                      <td className="px-3 py-2 text-center">{lot.status}</td>
                      <td className="px-3 py-2 min-w-[200px]">
                        {completedSteps.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            {completedSteps.map((t, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {t.process?.processCode ?? t.processCode}
                                </span>
                                {" · "}
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t.process?.processName ?? t.processName}
                                </span>
                                {t.endTime && (
                                  <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                                    {new Date(t.endTime).toLocaleDateString("th-TH", {
                                      year: "numeric", month: "short", day: "numeric",
                                    })}
                                    {" "}
                                    {new Date(t.endTime).toLocaleTimeString("th-TH", {
                                      hour: "2-digit", minute: "2-digit",
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
}
