"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import { fetchProductionOrder } from "@/services/productionOrdersService";
import type { ProductionOrderDetail, ProductionOrderLot } from "@/types/production";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const o = await fetchProductionOrder(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrintAll = async (lots: ProductionOrderLot[], o: ProductionOrderDetail) => {
    if (lots.length === 0) return;
    const cells: string[] = [];
    for (const lot of lots) {
      const dataUrl = await QRCode.toDataURL(lot.qrCode, { width: 140, margin: 1 });
      const ref = lot.orderLotLabel || "";
      const pd = lot.lotPdNo || "";
      cells.push(`
        <div class="cell">
          <img src="${dataUrl}" alt="" />
          <div class="meta">${o.orderNo} · ${o.product?.productName ?? ""}</div>
          <div class="meta">${lot.lotNo}${pd ? " · " + pd : ""} · ${lot.quantity} ชิ้น</div>
          ${ref ? `<div class="meta">ใบสั่ง: ${ref}</div>` : ""}
          <div class="code">${lot.qrCode}</div>
        </div>
      `);
    }
    const w = window.open("", "_blank");
    if (!w) {
      alert("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>QR ล็อตผลิต</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: flex-start; }
        .cell { border: 1px solid #ccc; padding: 12px; width: 200px; text-align: center; page-break-inside: avoid; }
        .meta { font-size: 11px; margin-top: 6px; color: #333; }
        .code { font-size: 9px; font-family: monospace; margin-top: 4px; word-break: break-all; color: #666; }
      </style></head><body>
      <h2 style="font-size:16px;margin-bottom:12px;">คำสั่งผลิต ${o.orderNo} — สแกนได้เหมือน QR วัตถุดิบ (API ล็อตผลิต)</h2>
      <div class="grid">${cells.join("")}</div>
      <script>window.onload = function(){ window.print(); }</script>
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
          <p className="text-xs">
            เลขล็อตหลัก <span className="font-mono">PG…</span> คู่ <span className="font-mono">PD…</span> แบบรับเข้า
            (วัตถุดิบใช้ <span className="font-mono">PC…</span>) — QR จากค่า PG เหมือน QR จาก PC
          </p>
          <p className="text-xs">
            ข้อความใน QR = <span className="font-mono">qrCode</span> —{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">GET /production-orders/lots/&lt;qr&gt;/status</code>
          </p>
        </div>
        {lots.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีล็อต / QR</p>
        ) : (
          <>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => handlePrintAll(lots, order)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lots.map((lot) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ComponentCard>
    </div>
  );
}
