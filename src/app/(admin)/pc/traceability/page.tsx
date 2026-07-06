"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  SearchCard,
  FormField,
  ActionButton,
  DataTable,
  StatusBadge,
  LoadingState,
  type Column,
} from "@/components/shared";
import { apiFetch } from "@/utils/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ensureThaiPdfFontsLoaded,
  registerThaiFontOnDoc,
  THAI_PDF_FONT,
} from "@/utils/jspdf-thai-font";

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
      status?: string | null;
      totalQuantity?: number | null;
      unit?: string | null;
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
      จำนวนรวมใบจ่าย: (h as any).totalQuantity,
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

async function exportTracePdf(result: TraceResult) {
  await ensureThaiPdfFontsLoaded();
  const rows = buildExportRows(result);
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const doc = new jsPDF({ orientation: "landscape" });
  registerThaiFontOnDoc(doc);
  doc.setFont(THAI_PDF_FONT, "normal");
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
    styles: {
      font: THAI_PDF_FONT,
      fontStyle: "normal",
      fontSize: 7,
    },
    headStyles: {
      font: THAI_PDF_FONT,
      fontStyle: "bold",
      fillColor: [55, 65, 81],
    },
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
          {formatNum(h.totalQuantity ?? 0)} {h.unit ?? ""}
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

  const linesColumns: Column<TraceLine>[] = [
    {
      key: "lotNo",
      title: "Lot",
      render: (_, line) => (
        <span className="font-medium whitespace-nowrap">{line.lot?.lotNo ?? "-"}</span>
      ),
    },
    {
      key: "quantity",
      title: "จำนวนที่ใช้",
      align: "right",
      render: (_, line) => (
        <span className="whitespace-nowrap">
          {formatNum(line.quantity)} {line.unit ?? ""}
        </span>
      ),
    },
    {
      key: "material",
      title: "วัตถุดิบ (Lot)",
      render: (_, line) => (
        <span>{line.lot?.materialCode} — {line.lot?.materialName}</span>
      ),
    },
    {
      key: "receivingNo",
      title: "ใบรับ",
      render: (_, line) => (
        <span className="whitespace-nowrap">{line.receiving?.receivingNo ?? "-"}</span>
      ),
    },
    {
      key: "receivingDate",
      title: "วันที่รับ",
      render: (_, line) => (
        <span className="whitespace-nowrap">{formatThDateTime(line.receiving?.receivingDate)}</span>
      ),
    },
    {
      key: "supplier",
      title: "ผู้ขาย",
      render: (_, line) => (
        <span className="text-xs">
          {line.receiving?.supplier
            ? `${line.receiving.supplier.code} — ${line.receiving.supplier.name}`
            : "-"}
        </span>
      ),
    },
  ];

  const renderLinesTable = (lines: TraceLine[]) => (
    <DataTable
      columns={linesColumns}
      data={lines}
      rowKey="issuingLotId"
      emptyMessage="ไม่มีรายการผูก Lot — สอบกลับไม่สมบูรณ์"
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title="รายงานการสอบกลับ"
        description="สอบจาก Lot/QR, ใบจ่าย หรือเลขคำสั่งผลิต — ดูโซ่ใบรับและการใช้งาน"
      />

      <SearchCard>
        <div className="flex flex-wrap gap-2 mb-4">
          <ActionButton
            type="button"
            variant={mode === "lot" ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setMode("lot");
              setError(null);
              setResult(null);
            }}
          >
            จาก Lot / QR
          </ActionButton>
          <ActionButton
            type="button"
            variant={mode === "issuing" ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setMode("issuing");
              setError(null);
              setResult(null);
            }}
          >
            จากใบจ่าย
          </ActionButton>
          <ActionButton
            type="button"
            variant={mode === "productionOrder" ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setMode("productionOrder");
              setError(null);
              setResult(null);
            }}
          >
            จากคำสั่งผลิต
          </ActionButton>
        </div>

        {mode === "lot" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Lot No."
              name="lotNo"
              value={lotNo}
              onChange={(value) => setLotNo(String(value))}
              placeholder="ระบุ Lot (ถ้ามี)"
            />
            <FormField
              label="QR code"
              name="qrCode"
              value={qrCode}
              onChange={(value) => setQrCode(String(value))}
              placeholder="หรือวาง QR"
            />
            <div className="flex items-end">
              <ActionButton
                type="button"
                variant="primary"
                loading={loading}
                className="w-full"
                onClick={search}
              >
                ค้นหา
              </ActionButton>
            </div>
          </div>
        ) : mode === "issuing" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="เลขที่ใบจ่าย (issuing_no)"
                name="issuingNo"
                value={issuingNo}
                onChange={(value) => setIssuingNo(String(value))}
                placeholder="เช่น ISS-2026-0001"
              />
            </div>
            <div className="flex items-end">
              <ActionButton
                type="button"
                variant="primary"
                loading={loading}
                className="w-full"
                onClick={search}
              >
                ค้นหา
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="เลขที่คำสั่งผลิต (order_no)"
                name="productionOrderNo"
                value={productionOrderNo}
                onChange={(value) => setProductionOrderNo(String(value))}
                placeholder="เลขที่ตรงกับ production_orders.order_no"
              />
            </div>
            <div className="flex items-end">
              <ActionButton
                type="button"
                variant="primary"
                loading={loading}
                className="w-full"
                onClick={search}
              >
                ค้นหา
              </ActionButton>
            </div>
          </div>
        )}
      </SearchCard>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <LoadingState message="กำลังค้นหาข้อมูลสอบกลับ…" />
      )}

      {result && (
        <div className="flex flex-wrap gap-2">
          <ActionButton
            type="button"
            variant="success"
            onClick={() => exportTraceExcel(result)}
          >
            Excel
          </ActionButton>
          <ActionButton
            type="button"
            variant="danger"
            onClick={() => void exportTracePdf(result).catch((e) => console.error(e))}
          >
            PDF
          </ActionButton>
        </div>
      )}

        {result?.direction === "forward" && (
          <>
            <ContentCard title="สรุป Lot (จุดเริ่ม — สอบไปข้างหน้า)">
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
            </ContentCard>

            <ContentCard title="ต้นทาง — ใบรับเข้า">
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
            </ContentCard>

            <ContentCard
              title={`การนำไปใช้ — ใบจ่าย (${result.usages.length})`}
            >
              <DataTable
                columns={[
                  {
                    key: "issuingNo",
                    title: "ใบจ่าย",
                    render: (_, u) => (
                      <span className="font-medium whitespace-nowrap">{u.issuing?.issuingNo ?? "-"}</span>
                    ),
                  },
                  {
                    key: "issuingDate",
                    title: "วันที่จ่าย",
                    render: (_, u) => (
                      <span className="whitespace-nowrap">{formatThDateTime(u.issuing?.issuingDate)}</span>
                    ),
                  },
                  {
                    key: "quantity",
                    title: "จำนวนดึง",
                    align: "right",
                    render: (_, u) => (
                      <span className="whitespace-nowrap">
                        {formatNum(u.quantity)} {u.unit ?? ""}
                      </span>
                    ),
                  },
                  {
                    key: "material",
                    title: "วัตถุดิบ (ปลายทางจ่าย)",
                    render: (_, u) => (
                      <span>
                        {u.issuing?.materialCode} — {u.issuing?.materialName}
                        {u.issuing?.issuingTypeName
                          ? ` (${u.issuing.issuingTypeName})`
                          : ""}
                      </span>
                    ),
                  },
                  {
                    key: "workOrder",
                    title: "WO / เครื่อง",
                    render: (_, u) => (
                      <span className="text-xs">
                        {u.issuing?.workOrderNo ?? "-"}
                        {u.issuing?.machineNo ? ` / ${u.issuing.machineNo}` : ""}
                      </span>
                    ),
                  },
                  {
                    key: "productionOrderId",
                    title: "คำสั่งผลิต",
                    render: (_, u) => (
                      <span>
                        {u.issuing?.productionOrderId != null
                          ? `#${u.issuing.productionOrderId}`
                          : "-"}
                      </span>
                    ),
                  },
                ]}
                data={result.usages}
                rowKey="issuingLotId"
                emptyMessage="ยังไม่มีรายการจ่ายจาก Lot นี้"
              />
            </ContentCard>
          </>
        )}

        {result?.direction === "backward" && (
          <>
            <ContentCard title="สรุปใบจ่าย (จุดเริ่ม — สอบย้อนกลับ)">
              {renderIssuingSummary(result.issuing)}
            </ContentCard>
            <ContentCard title={`Lot รับเข้าที่ใช้ (${result.lines.length})`}>
              {renderLinesTable(result.lines)}
            </ContentCard>
          </>
        )}

        {result?.direction === "production-order" && (
          <>
            <ContentCard title="คำสั่งผลิต">
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
            </ContentCard>

            {result.issuings.length === 0 ? (
              <ContentCard title="ใบจ่ายที่ผูกคำสั่งผลิต">
                <p className="text-sm text-gray-500">
                  ยังไม่มีใบจ่ายที่ระบุ production_order_id ตรงกับคำสั่งนี้
                </p>
              </ContentCard>
            ) : (
              result.issuings.map((block) => (
                <React.Fragment key={block.issuing.id}>
                  <ContentCard title={`ใบจ่าย ${block.issuing.issuingNo}`}>
                    {renderIssuingSummary(block.issuing)}
                  </ContentCard>
                  <ContentCard
                    title={`Lot รับเข้าที่ใช้ — ${block.issuing.issuingNo} (${block.lines.length})`}
                  >
                    {renderLinesTable(block.lines)}
                  </ContentCard>
                </React.Fragment>
              ))
            )}
          </>
        )}
    </PageContainer>
  );
}
