"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import LotTraceReportList from "@/components/production/LotTraceReportList";
import { apiFetch } from "@/utils/api";
import {
  fetchLotStepTraceReport,
  type LotStepTraceReportFilters,
} from "@/services/productionOrdersService";
import type { LotStepQuantitiesPayload } from "@/types/productionLotStepQuantities";
import {
  LOT_TRACE_TABLE_HEADERS,
  buildLotTraceProductGroupedCsv,
  buildLotTraceProductGroupedExportAoA,
  buildLotTraceProductGroups,
  lotStatusLabelTh,
  lotTraceStepRowCells,
} from "@/utils/lotTraceReportFormat";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ensureThaiPdfFontsLoaded,
  registerThaiFontOnDoc,
  THAI_PDF_FONT,
} from "@/utils/jspdf-thai-font";

type ProductOption = {
  id: number;
  productCode: string;
  productName: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด (ยกเว้น SPLIT)" },
  { value: "PENDING", label: "รอเริ่ม" },
  { value: "IN_PROGRESS", label: "กำลังผลิต" },
  { value: "COMPLETED", label: "ปิดงานแล้ว" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "SPLIT", label: "แยกล็อตแล้ว (QR เก่า)" },
];

export default function ProductionLotTraceReportPage() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<LotStepQuantitiesPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [lotSearch, setLotSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [includeSplitRetired, setIncludeSplitRetired] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const limit = 30;

  const productGroups = useMemo(
    () => buildLotTraceProductGroups(groups),
    [groups],
  );

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/products?page=1&limit=500");
      const data = await res.json();
      const rows = (data.data ?? data.products ?? []) as ProductOption[];
      setProducts(rows);
    } catch {
      setProducts([]);
    }
  };

  const loadReport = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    const activePage = pageOverride ?? page;
    try {
      const filters: LotStepTraceReportFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        orderNo: orderNo || undefined,
        lotSearch: lotSearch || undefined,
        productId: productId || undefined,
        status: status || undefined,
        includeSplitRetired: includeSplitRetired || status === "SPLIT",
        page: activePage,
        limit,
      };
      const result = await fetchLotStepTraceReport(filters);
      setGroups(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch (err) {
      console.error(err);
      setGroups([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    startDate,
    endDate,
    orderNo,
    lotSearch,
    productId,
    status,
    includeSplitRetired,
    page,
  ]);

  useEffect(() => {
    void fetchProducts();
    const lotFromUrl = searchParams.get("lot")?.trim();
    if (lotFromUrl) {
      setLotSearch(lotFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleSearch = () => {
    setPage(1);
    void loadReport(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setOrderNo("");
    setLotSearch("");
    setProductId("");
    setStatus("");
    setIncludeSplitRetired(false);
    setPage(1);
    setTimeout(() => void loadReport(1), 50);
  };

  const rowCount = useMemo(
    () => groups.reduce((n, g) => n + g.steps.length, 0),
    [groups],
  );

  const handleExportExcel = () => {
    const aoa = buildLotTraceProductGroupedExportAoA(productGroups);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lot Trace");
    XLSX.writeFile(
      wb,
      `LotTrace_${new Date().toLocaleDateString("th-TH")}.xlsx`,
    );
  };

  const handleExportCSV = () => {
    const csv = buildLotTraceProductGroupedCsv(productGroups);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LotTrace_${new Date().toLocaleDateString("th-TH")}.csv`;
    link.click();
  };

  const handleExportPDF = async () => {
    try {
      await ensureThaiPdfFontsLoaded();
    } catch (e) {
      console.error(e);
      window.alert("ไม่สามารถโหลดฟอนต์ไทยสำหรับ PDF ได้");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    registerThaiFontOnDoc(doc);
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 12;

    for (let pi = 0; pi < productGroups.length; pi++) {
      const pg = productGroups[pi];
      if (pi > 0 && y > pageH - 60) {
        doc.addPage();
        y = 12;
      }

      doc.setFontSize(12);
      doc.setFont(THAI_PDF_FONT, "bold");
      doc.text(`รหัสสินค้า : ${pg.productCode}`, margin, y);
      y += 6;
      doc.setFont(THAI_PDF_FONT, "normal");
      doc.setFontSize(9);
      const nameLines = doc.splitTextToSize(pg.productName, pageW - 2 * margin);
      doc.text(nameLines, margin, y);
      y += nameLines.length * 4 + 4;
      doc.text(
        `${pg.lotCount} ล็อต · รวม ${pg.totalLotQuantity.toLocaleString()} ${pg.unit}`,
        margin,
        y,
      );
      y += 10;

      for (let li = 0; li < pg.lots.length; li++) {
        const g = pg.lots[li];
        if (y > pageH - 50) {
          doc.addPage();
          y = 12;
        }

        doc.setFontSize(10);
        doc.setFont(THAI_PDF_FONT, "bold");
        doc.text(`Lot Trace : ${g.lotNo}`, margin, y);
        y += 5;
        doc.setFont(THAI_PDF_FONT, "normal");
        doc.setFontSize(8);
        doc.text(
          `${g.orderNo} · ${lotStatusLabelTh(g.lotStatus)}`,
          margin,
          y,
        );
        y += 7;

        autoTable(doc, {
          startY: y,
          head: [LOT_TRACE_TABLE_HEADERS.slice() as string[]],
          body: g.steps.map((s) => lotTraceStepRowCells(s, g.unit)),
          styles: { font: THAI_PDF_FONT, fontStyle: "normal", fontSize: 7 },
          headStyles: {
            font: THAI_PDF_FONT,
            fontStyle: "bold",
            fillColor: [31, 41, 55],
          },
          margin: { left: margin, right: margin },
        });

        const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
          .lastAutoTable.finalY;
        y = lastY + 12;
      }
      y += 4;
    }

    doc.save(`LotTrace_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="สอบกลับล็อต (รับเข้า-จ่ายออก)" />
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            รายงานสอบกลับล็อตผลิต
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            แสดงรายการสรุปตามรหัสสินค้า — กดดูล็อต แล้วกดดู Lot Trace เพื่อดูรับเข้า / จ่ายออกทุกขั้นตอน
          </p>
        </div>

        <ComponentCard title="ค้นหา">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่สร้างล็อต (จาก)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่สร้างล็อต (ถึง)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                เลขที่ใบสั่งผลิต
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="PO..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ล็อต / QR
              </label>
              <input
                type="text"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                placeholder="เลขล็อต หรือ QR"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                สินค้า
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">ทั้งหมด</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.productName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                สถานะล็อต
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2">
                <input
                  type="checkbox"
                  checked={includeSplitRetired}
                  onChange={(e) => setIncludeSplitRetired(e.target.checked)}
                  className="rounded border-gray-300"
                />
                รวมล็อต SPLIT (QR เก่า)
              </label>
            </div>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={handleSearch}
                className="h-11 flex-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                ค้นหา
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-11 flex-1 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title={`Lot Trace (${productGroups.length} รหัสสินค้า · ${groups.length} ล็อต · ${rowCount} แถวขั้นตอน · ทั้งหมด ${total} ล็อต)`}
        >
          {groups.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="h-11 rounded-lg bg-green-600 px-6 text-white hover:bg-green-700"
              >
                Excel
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="h-11 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => void handleExportPDF().catch((e) => console.error(e))}
                className="h-11 rounded-lg bg-red-600 px-6 text-white hover:bg-red-700"
              >
                PDF
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : productGroups.length === 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] table-auto text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                    <th className="w-10 px-2 py-3" />
                    <th className="px-3 py-3 text-left font-medium">รหัสสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">ชื่อสินค้า</th>
                    <th className="px-3 py-3 text-right font-medium">จำนวนล็อต</th>
                    <th className="px-3 py-3 text-right font-medium">รวมจำนวน</th>
                    <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  <TableEmptyRow colSpan={6} />
                </tbody>
              </table>
            </div>
          ) : (
            <LotTraceReportList
              productGroups={productGroups}
              variant="production"
              autoExpandLotSearch={lotSearch}
            />
          )}

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                หน้า {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                ถัดไป
              </button>
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </div>
  );
}
