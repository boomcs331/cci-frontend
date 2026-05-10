"use client";

import React, { useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SupplierBrief = { id: number; code: string; name: string } | null;

type TraceForward = {
  direction: "forward";
  lot: {
    id: number;
    lotNo: string;
    qrCode: string;
    quantity: number;
    remainingQuantity: number;
    unit: string | null;
    status: string;
    materialId: number;
    materialCode: string | null;
    materialName: string | null;
  };
  receiving: {
    id: number;
    receivingNo: string;
    receivingDate: string;
    poNo: string | null;
    remark: string | null;
    materialId: number;
    materialCode: string | null;
    materialName: string | null;
    supplier: SupplierBrief;
  } | null;
  usages: Array<{
    issuingLotId: number;
    quantity: number;
    unit: string | null;
    qrCode: string;
    issuing: {
      id: number;
      issuingNo: string;
      issuingDate: string;
      workOrderNo: string | null;
      machineNo: string | null;
      partNo: string | null;
      department: string | null;
      productionOrderId: number | null;
      remark: string | null;
      issuingType: string | null;
      materialId: number;
      materialCode: string | null;
      materialName: string | null;
      issuingTypeName: string | null;
    } | null;
  }>;
};

type IssuingHeader = TraceForward["usages"][number]["issuing"] extends infer U
  ? NonNullable<U>
  : never;

type TraceBackward = {
  direction: "backward";
  issuing: IssuingHeader;
  lines: Array<{
    issuingLotId: number;
    quantity: number;
    unit: string | null;
    lineQrCode: string;
    lot: {
      id: number;
      lotNo: string;
      qrCode: string;
      quantity: number;
      remainingQuantity: number;
      unit: string | null;
      status: string;
      materialId: number;
      materialCode: string | null;
      materialName: string | null;
    } | null;
    receiving: {
      id: number;
      receivingNo: string;
      receivingDate: string;
      poNo: string | null;
      remark: string | null;
      supplier: SupplierBrief;
    } | null;
  }>;
};

type TraceLine = TraceBackward["lines"][number];

type TraceProductionOrder = {
  direction: "production-order";
  productionOrder: {
    id: number;
    orderNo: string;
    status: string;
    orderQuantity: number;
    productId: number;
    productCode: string | null;
    productName: string | null;
  };
  issuings: Array<{ issuing: IssuingHeader; lines: TraceLine[] }>;
};

type TraceResult = TraceForward | TraceBackward | TraceProductionOrder;

function formatThDateTime(iso: string | undefined | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNum(n: number): string {
  return Number(n).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function buildExportRows(result: TraceResult): Record<string, unknown>[] {
  if (result.direction === "forward") {
    const r = result.receiving;
    return result.usages.map((u) => ({
      โหมด: "Lot/QR",
      Lot: result.lot.lotNo,
      QR: result.lot.qrCode,
      วัตถุดิบ_Lot: `${result.lot.materialCode ?? ""} ${result.lot.materialName ?? ""}`,
      เลขที่รับ: r?.receivingNo ?? "",
      วันที่รับ: r ? formatThDateTime(r.receivingDate) : "",
      ผู้ขาย: r?.supplier
        ? `${r.supplier.code} — ${r.supplier.name}`
        : "",
      PO: r?.poNo ?? "",
      เลขที่จ่าย: u.issuing?.issuingNo ?? "",
      วันที่จ่าย: u.issuing ? formatThDateTime(u.issuing.issuingDate) : "",
      จำนวนดึง: u.quantity,
      หน่วย: u.unit ?? "",
      วัตถุดิบจ่าย: `${u.issuing?.materialCode ?? ""} ${u.issuing?.materialName ?? ""}`,
      WO: u.issuing?.workOrderNo ?? "",
      คำสั่งผลิต_ID: u.issuing?.productionOrderId ?? "",
    }));
  }
  if (result.direction === "backward") {
    const h = result.issuing;
    return result.lines.map((line) => ({
      โหมด: "ใบจ่าย",
      เลขที่จ่าย: h.issuingNo,
      วันที่จ่าย: formatThDateTime(h.issuingDate),
      วัตถุดิบหัวใบจ่าย: `${h.materialCode ?? ""} ${h.materialName ?? ""}`,
      จำนวนรวมใบจ่าย: h.totalQuantity,
      Lot: line.lot?.lotNo ?? "",
      จำนวนที่ใช้: line.quantity,
      หน่วย: line.unit ?? "",
      วัตถุดิบ_Lot: `${line.lot?.materialCode ?? ""} ${line.lot?.materialName ?? ""}`,
      เลขที่รับ: line.receiving?.receivingNo ?? "",
      วันที่รับ: line.receiving
        ? formatThDateTime(line.receiving.receivingDate)
        : "",
      ผู้ขาย: line.receiving?.supplier
        ? `${line.receiving.supplier.code} — ${line.receiving.supplier.name}`
        : "",
    }));
  }
  const po = result.productionOrder;
  const rows: Record<string, unknown>[] = [];
  for (const block of result.issuings) {
    const h = block.issuing;
    for (const line of block.lines) {
      rows.push({
        โหมด: "คำสั่งผลิต",
        เลขคำสั่งผลิต: po.orderNo,
        สถานะคำสั่ง: po.status,
        สินค้า: `${po.productCode ?? ""} ${po.productName ?? ""}`,
        เลขที่จ่าย: h.issuingNo,
        วันที่จ่าย: formatThDateTime(h.issuingDate),
        วัตถุดิบหัวใบจ่าย: `${h.materialCode ?? ""} ${h.materialName ?? ""}`,
        Lot: line.lot?.lotNo ?? "",
        จำนวนที่ใช้: line.quantity,
        หน่วย: line.unit ?? "",
        เลขที่รับ: line.receiving?.receivingNo ?? "",
        วันที่รับ: line.receiving
          ? formatThDateTime(line.receiving.receivingDate)
          : "",
        ผู้ขาย: line.receiving?.supplier
          ? `${line.receiving.supplier.code} — ${line.receiving.supplier.name}`
          : "",
      });
    }
  }
  if (rows.length === 0) {
    rows.push({
      โหมด: "คำสั่งผลิต",
      เลขคำสั่งผลิต: po.orderNo,
      สถานะคำสั่ง: po.status,
      สินค้า: `${po.productCode ?? ""} ${po.productName ?? ""}`,
      หมายเหตุ: "ไม่มีรายการใบจ่ายผูกคำสั่งผลิตนี้",
    });
  }
  return rows;
}

function exportTraceExcel(result: TraceResult) {
  const rows = buildExportRows(result);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "สอบกลับ");
  const stamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `traceability_${stamp}.xlsx`);
}

function exportTracePdf(result: TraceResult) {
  const rows = buildExportRows(result);
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(11);
  doc.text("รายงานการสอบกลับ (Traceability)", 14, 16);
  if (rows.length === 0) {
    doc.save(`traceability_${new Date().toISOString().split("T")[0]}.pdf`);
    return;
  }
  autoTable(doc, {
    startY: 22,
    head: [keys],
    body: rows.map((r) => keys.map((k) => String(r[k] ?? ""))),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [55, 65, 81] },
  });
  doc.save(`traceability_${new Date().toISOString().split("T")[0]}.pdf`);
}

export default function PCTraceabilityPage() {
  const [mode, setMode] = useState<"lot" | "issuing" | "productionOrder">(
    "lot",
  );
  const [lotNo, setLotNo] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [issuingNo, setIssuingNo] = useState("");
  const [productionOrderNo, setProductionOrderNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TraceResult | null>(null);

  const search = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (mode === "lot") {
        const ln = lotNo.trim();
        const qr = qrCode.trim();
        if (!ln && !qr) {
          setError("กรุณากรอก Lot หรือ QR code");
          setLoading(false);
          return;
        }
        const q = ln
          ? `lotNo=${encodeURIComponent(ln)}`
          : `qrCode=${encodeURIComponent(qr)}`;
        const res = await apiFetch(
          `/materials/transactions/traceability/by-lot?${q}`,
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || json.error || "ค้นหาไม่สำเร็จ");
          return;
        }
        setResult(json.data as TraceForward);
      } else if (mode === "issuing") {
        const no = issuingNo.trim();
        if (!no) {
          setError("กรุณากรอกเลขที่ใบจ่าย");
          setLoading(false);
          return;
        }
        const res = await apiFetch(
          `/materials/transactions/traceability/by-issuing?issuingNo=${encodeURIComponent(no)}`,
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || json.error || "ค้นหาไม่สำเร็จ");
          return;
        }
        setResult(json.data as TraceBackward);
      } else {
        const on = productionOrderNo.trim();
        if (!on) {
          setError("กรุณากรอกเลขที่คำสั่งผลิต (order_no)");
          setLoading(false);
          return;
        }
        const res = await apiFetch(
          `/materials/transactions/traceability/by-production-order?orderNo=${encodeURIComponent(on)}`,
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || json.error || "ค้นหาไม่สำเร็จ");
          return;
        }
        setResult(json.data as TraceProductionOrder);
      }
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, [mode, lotNo, qrCode, issuingNo, productionOrderNo]);

  const renderIssuingSummary = (h: IssuingHeader) => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
      <div>
        <dt className="text-gray-500 dark:text-gray-400">เลขที่</dt>
        <dd className="font-medium text-gray-900 dark:text-white">
          {h.issuingNo}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">วันที่จ่าย</dt>
        <dd className="text-gray-900 dark:text-white">
          {formatThDateTime(h.issuingDate)}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">สถานะ</dt>
        <dd className="text-gray-900 dark:text-white">{h.status}</dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">วัตถุดิบ (หัวใบจ่าย)</dt>
        <dd className="text-gray-900 dark:text-white">
          {h.materialCode} — {h.materialName}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">จำนวนรวม</dt>
        <dd className="text-gray-900 dark:text-white">
          {formatNum(h.totalQuantity)} {h.unit ?? ""}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">ประเภทจ่าย</dt>
        <dd className="text-gray-900 dark:text-white">
          {h.issuingTypeName ?? h.issuingType ?? "-"}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">WO</dt>
        <dd className="text-gray-900 dark:text-white">{h.workOrderNo ?? "-"}</dd>
      </div>
      <div>
        <dt className="text-gray-500 dark:text-gray-400">คำสั่งผลิต</dt>
        <dd className="text-gray-900 dark:text-white">
          {h.productionOrderId != null ? `#${h.productionOrderId}` : "-"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-gray-500 dark:text-gray-400">หมายเหตุ</dt>
        <dd className="text-gray-900 dark:text-white">{h.remark ?? "-"}</dd>
      </div>
    </dl>
  );

  const renderLinesTable = (lines: TraceLine[]) =>
    lines.length === 0 ? (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        ไม่มีรายการผูก Lot — สอบกลับไม่สมบูรณ์
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2">Lot</th>
              <th className="px-3 py-2 text-right">จำนวนที่ใช้</th>
              <th className="px-3 py-2">วัตถุดิบ (Lot)</th>
              <th className="px-3 py-2">ใบรับ</th>
              <th className="px-3 py-2">วันที่รับ</th>
              <th className="px-3 py-2">ผู้ขาย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {lines.map((line) => (
              <tr key={line.issuingLotId}>
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  {line.lot?.lotNo ?? "-"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {formatNum(line.quantity)} {line.unit ?? ""}
                </td>
                <td className="px-3 py-2">
                  {line.lot?.materialCode} — {line.lot?.materialName}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {line.receiving?.receivingNo ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatThDateTime(line.receiving?.receivingDate)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {line.receiving?.supplier
                    ? `${line.receiving.supplier.code} — ${line.receiving.supplier.name}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <div>
      <PageBreadcrumb pageTitle="รายงานการสอบกลับ" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            การสอบกลับวัตถุดิบ (Traceability)
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            สอบจาก Lot/QR, ใบจ่าย หรือเลขคำสั่งผลิต — ดูโซ่ใบรับและการใช้งาน
          </p>
        </div>

        <ComponentCard title="ค้นหา">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode("lot");
                setError(null);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "lot"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              จาก Lot / QR
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("issuing");
                setError(null);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "issuing"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              จากใบจ่าย
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("productionOrder");
                setError(null);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "productionOrder"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              จากคำสั่งผลิต
            </button>
          </div>

          {mode === "lot" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Lot No.
                </label>
                <input
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  placeholder="ระบุ Lot (ถ้ามี)"
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  QR code
                </label>
                <input
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="หรือวาง QR"
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={search}
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
                >
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
              </div>
            </div>
          ) : mode === "issuing" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  เลขที่ใบจ่าย (issuing_no)
                </label>
                <input
                  value={issuingNo}
                  onChange={(e) => setIssuingNo(e.target.value)}
                  placeholder="เช่น ISS-2026-0001"
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={search}
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
                >
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  เลขที่คำสั่งผลิต (order_no)
                </label>
                <input
                  value={productionOrderNo}
                  onChange={(e) => setProductionOrderNo(e.target.value)}
                  placeholder="เลขที่ตรงกับ production_orders.order_no"
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={search}
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
                >
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </ComponentCard>

        {result && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportTraceExcel(result)}
              className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => exportTracePdf(result)}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              PDF
            </button>
          </div>
        )}

        {result?.direction === "forward" && (
          <>
            <ComponentCard title="สรุป Lot (จุดเริ่ม — สอบไปข้างหน้า)">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Lot No.</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {result.lot.lotNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">QR</dt>
                  <dd className="font-mono text-xs break-all text-gray-900 dark:text-white">
                    {result.lot.qrCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">สถานะ</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.lot.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">วัตถุดิบ</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.lot.materialCode} — {result.lot.materialName}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">
                    จำนวนรับ / คงเหลือ
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {formatNum(result.lot.quantity)} /{" "}
                    {formatNum(result.lot.remainingQuantity)}{" "}
                    {result.lot.unit ?? ""}
                  </dd>
                </div>
              </dl>
            </ComponentCard>

            <ComponentCard title="ต้นทาง — ใบรับเข้า">
              {result.receiving ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">เลขที่รับ</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {result.receiving.receivingNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">วันที่รับ</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {formatThDateTime(result.receiving.receivingDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">ผู้ขาย</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {result.receiving.supplier
                        ? `${result.receiving.supplier.code} — ${result.receiving.supplier.name}`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">PO</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {result.receiving.poNo ?? "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500 dark:text-gray-400">หมายเหตุ</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {result.receiving.remark ?? "-"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">ไม่พบข้อมูลใบรับ</p>
              )}
            </ComponentCard>

            <ComponentCard
              title={`การนำไปใช้ — ใบจ่าย (${result.usages.length})`}
            >
              {result.usages.length === 0 ? (
                <p className="text-sm text-gray-500">
                  ยังไม่มีรายการจ่ายจาก Lot นี้
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                        <th className="px-3 py-2">ใบจ่าย</th>
                        <th className="px-3 py-2">วันที่จ่าย</th>
                        <th className="px-3 py-2 text-right">จำนวนดึง</th>
                        <th className="px-3 py-2">วัตถุดิบ (ปลายทางจ่าย)</th>
                        <th className="px-3 py-2">WO / เครื่อง</th>
                        <th className="px-3 py-2">คำสั่งผลิต</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {result.usages.map((u) => (
                        <tr key={u.issuingLotId}>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">
                            {u.issuing?.issuingNo ?? "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatThDateTime(u.issuing?.issuingDate)}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {formatNum(u.quantity)} {u.unit ?? ""}
                          </td>
                          <td className="px-3 py-2">
                            {u.issuing?.materialCode} — {u.issuing?.materialName}
                            {u.issuing?.issuingTypeName
                              ? ` (${u.issuing.issuingTypeName})`
                              : ""}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {u.issuing?.workOrderNo ?? "-"}
                            {u.issuing?.machineNo ? ` / ${u.issuing.machineNo}` : ""}
                          </td>
                          <td className="px-3 py-2">
                            {u.issuing?.productionOrderId != null
                              ? `#${u.issuing.productionOrderId}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ComponentCard>
          </>
        )}

        {result?.direction === "backward" && (
          <>
            <ComponentCard title="สรุปใบจ่าย (จุดเริ่ม — สอบย้อนกลับ)">
              {renderIssuingSummary(result.issuing)}
            </ComponentCard>
            <ComponentCard title={`Lot รับเข้าที่ใช้ (${result.lines.length})`}>
              {renderLinesTable(result.lines)}
            </ComponentCard>
          </>
        )}

        {result?.direction === "production-order" && (
          <>
            <ComponentCard title="คำสั่งผลิต">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">เลขที่</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {result.productionOrder.orderNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">สถานะ</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.productionOrder.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">จำนวนสั่ง</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {formatNum(result.productionOrder.orderQuantity)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">สินค้า</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.productionOrder.productCode} —{" "}
                    {result.productionOrder.productName}
                  </dd>
                </div>
              </dl>
            </ComponentCard>

            {result.issuings.length === 0 ? (
              <ComponentCard title="ใบจ่ายที่ผูกคำสั่งผลิต">
                <p className="text-sm text-gray-500">
                  ยังไม่มีใบจ่ายที่ระบุ production_order_id ตรงกับคำสั่งนี้
                </p>
              </ComponentCard>
            ) : (
              result.issuings.map((block) => (
                <React.Fragment key={block.issuing.id}>
                  <ComponentCard title={`ใบจ่าย ${block.issuing.issuingNo}`}>
                    {renderIssuingSummary(block.issuing)}
                  </ComponentCard>
                  <ComponentCard
                    title={`Lot รับเข้าที่ใช้ — ${block.issuing.issuingNo} (${block.lines.length})`}
                  >
                    {renderLinesTable(block.lines)}
                  </ComponentCard>
                </React.Fragment>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
