"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  SearchCard,
  FormField,
  ActionButton,
  LoadingState,
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

interface TransactionReport {
  materialId: number;
  materialCode: string;
  materialName: string;
  receivingNo: string;
  receivingDate: string;
  issueDate: string | null;
  transactionId: number | null;
  transactionNo: string | null;
  referenceNo: string | null;
  transactionType: string | null;
  lotNo: string | null;
  received: number;
  issued: number;
  balance: number;
}

/** YYYY-MM-DD จาก API = วันปฏิทินไทย — parse ที่เที่ยง UTC+7 แล้วแสดงใน Asia/Bangkok */
function formatReportYmd(
  ymd: string | null | undefined,
  locale: "th-TH" | "en-GB" = "th-TH",
): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
  const d = new Date(`${ymd}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale, { timeZone: "Asia/Bangkok" });
}

/** แถวจ่ายออก (รวมแถวรวมหลายครั้ง — transactionId อาจเป็น null) */
function isIssueRow(r: TransactionReport): boolean {
  return Number(r.issued) > 0;
}

/** แสดงในคอลัมน์ประเภทให้สอดคล้องบัตรสต็อก (RECEIVE / ISSUE) */
function displayMovementType(r: TransactionReport): string {
  const t = (r.transactionType || "").trim();
  if (t) return t.toUpperCase();
  return isIssueRow(r) ? "ISSUE" : "RECEIVE";
}

type StockCardGroup = {
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  rows: TransactionReport[];
  currentBalance: number;
};

/** หัวคอลัมน์ตาราง — ต้องตรงกับ preview */
const STOCK_CARD_TABLE_HEADERS = [
  "เลขที่ใบรับ",
  "วันที่รับเข้า",
  "วันที่จ่าย",
  "เลขที่ใบจ่าย",
  "เลข TXN",
  "ประเภท",
  "รหัส วัตถุดิบ",
  "ชื่อ วัตถุดิบ",
  "รับเข้า",
  "จ่ายออก",
  "คงเหลือ",
] as const;

/** ค่าแต่ละแถวใน export ให้ตรงรูปแบบ preview (วันที่ th-TH, ตัวเลข toLocaleString) */
function stockCardPreviewRowCells(r: TransactionReport): string[] {
  return [
    r.receivingNo || "-",
    formatReportYmd(r.receivingDate, "th-TH"),
    formatReportYmd(r.issueDate ?? undefined, "th-TH"),
    r.referenceNo ?? "-",
    r.transactionNo ?? "-",
    displayMovementType(r),
    r.materialCode,
    r.materialName,
    parseFloat(r.received.toString()).toLocaleString(),
    parseFloat(r.issued.toString()).toLocaleString(),
    parseFloat(r.balance.toString()).toLocaleString(),
  ];
}

function escapeCsvField(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

function buildStockCardExportAoA(groups: StockCardGroup[]): (string | number)[][] {
  const aoa: (string | number)[][] = [];
  for (const g of groups) {
    aoa.push([`Stock Card : ${g.materialCode}`]);
    aoa.push([g.materialName]);
    aoa.push([]);
    aoa.push([...STOCK_CARD_TABLE_HEADERS]);
    for (const r of g.rows) {
      aoa.push(stockCardPreviewRowCells(r));
    }
    aoa.push([]);
    aoa.push([
      `Current Balance : ${g.currentBalance.toLocaleString()} ${g.unit}`,
    ]);
    aoa.push([]);
  }
  return aoa;
}

function buildStockCardCsv(groups: StockCardGroup[]): string {
  const lines: string[] = [];
  for (const g of groups) {
    lines.push(escapeCsvField(`Stock Card : ${g.materialCode}`));
    lines.push(escapeCsvField(g.materialName));
    lines.push("");
    lines.push(STOCK_CARD_TABLE_HEADERS.map(escapeCsvField).join(","));
    for (const r of g.rows) {
      lines.push(stockCardPreviewRowCells(r).map(escapeCsvField).join(","));
    }
    lines.push("");
    lines.push(
      escapeCsvField(
        `Current Balance : ${g.currentBalance.toLocaleString()} ${g.unit}`,
      ),
    );
    lines.push("");
  }
  return lines.join("\r\n");
}

function buildStockCardGroups(
  reports: TransactionReport[],
  unitByMaterialId: Map<number, string>,
): StockCardGroup[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const r of reports) {
    if (!seen.has(r.materialId)) {
      seen.add(r.materialId);
      order.push(r.materialId);
    }
  }
  return order.map((mid) => {
    const rows = reports.filter((r) => r.materialId === mid);
    const last = rows[rows.length - 1];
    return {
      materialId: mid,
      materialCode: rows[0].materialCode,
      materialName: rows[0].materialName,
      unit: unitByMaterialId.get(mid) || "PCS",
      rows,
      currentBalance: last ? Number(last.balance) : 0,
    };
  });
}

export default function PCReportPage() {
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);

  const unitByMaterialId = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of materials) {
      const u = x.unitMaster?.code || x.unitMaster?.name;
      const label = u && String(u).trim() ? String(u) : "PCS";
      m.set(Number(x.id), label);
    }
    return m;
  }, [materials]);

  const stockCardGroups = useMemo(
    () => buildStockCardGroups(reports, unitByMaterialId),
    [reports, unitByMaterialId],
  );

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch("/materials/all");
      const data = await res.json();
      setMaterials(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/materials/transactions/report/transactions?";
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (materialId) url += `materialId=${materialId}&`;

      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, materialId]);

  useEffect(() => {
    fetchMaterials();
    fetchReport();
  }, [fetchReport]);

  const handleSearch = () => {
    fetchReport();
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setMaterialId("");
    setTimeout(() => fetchReport(), 100);
  };

  const handleExportExcel = () => {
    const aoa = buildStockCardExportAoA(stockCardGroups);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Card");
    XLSX.writeFile(
      wb,
      `StockCard_${new Date().toLocaleDateString("th-TH")}.xlsx`,
    );
  };

  const handleExportCSV = () => {
    const csv = buildStockCardCsv(stockCardGroups);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `StockCard_${new Date().toLocaleDateString("th-TH")}.csv`;
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

    for (let gi = 0; gi < stockCardGroups.length; gi++) {
      const g = stockCardGroups[gi];
      if (gi > 0 && y > pageH - 50) {
        doc.addPage();
        y = 12;
      }

      doc.setFontSize(11);
      doc.setFont(THAI_PDF_FONT, "bold");
      doc.text(`Stock Card : ${g.materialCode}`, margin, y);
      y += 6;
      doc.setFont(THAI_PDF_FONT, "normal");
      doc.setFontSize(9);
      const nameLines = doc.splitTextToSize(g.materialName, pageW - 2 * margin);
      doc.text(nameLines, margin, y);
      y += nameLines.length * 4 + 6;

      autoTable(doc, {
        startY: y,
        head: [STOCK_CARD_TABLE_HEADERS.slice() as string[]],
        body: g.rows.map((r) => stockCardPreviewRowCells(r)),
        styles: {
          font: THAI_PDF_FONT,
          fontStyle: "normal",
          fontSize: 7,
        },
        headStyles: {
          font: THAI_PDF_FONT,
          fontStyle: "bold",
          fillColor: [31, 41, 55],
        },
        margin: { left: margin, right: margin },
      });

      const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY;
      y = lastY + 8;
      doc.setFontSize(10);
      doc.setFont(THAI_PDF_FONT, "bold");
      doc.text(
        `Current Balance : ${g.currentBalance.toLocaleString()} ${g.unit}`,
        margin,
        y,
      );
      y += 14;
      doc.setFont(THAI_PDF_FONT, "normal");
    }

    doc.save(`StockCard_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="รายงานการรับเข้า-จ่ายออกวัตถุดิบ"
        description="แยกตามรหัสวัตถุดิบเป็น Stock Card — ตารางครบทุกฟิลด์ — คงเหลือสะสมต่อใบรับตามลำดับแถว"
      />

      <SearchCard>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormField
            label="วันที่เริ่มต้น"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(value) => setStartDate(String(value))}
          />
          <FormField
            label="วันที่สิ้นสุด"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(value) => setEndDate(String(value))}
          />
          <FormField
            label="วัตถุดิบ"
            name="materialId"
            type="select"
            value={materialId}
            onChange={(value) => setMaterialId(String(value))}
            options={[
              { value: "", label: "ทั้งหมด" },
              ...materials.map((m) => ({
                value: String(m.id),
                label: `${m.matCode} - ${m.matName}`,
              })),
            ]}
          />
          <div className="flex items-end gap-2">
            <ActionButton
              variant="primary"
              className="flex-1"
              onClick={handleSearch}
            >
              ค้นหา
            </ActionButton>
            <ActionButton
              variant="secondary"
              className="flex-1"
              onClick={handleReset}
            >
              รีเซ็ต
            </ActionButton>
          </div>
        </div>
      </SearchCard>

        <ContentCard
          title={`Stock Card (${stockCardGroups.length} วัตถุดิบ · ${reports.length} แถว)`}
        >
          {reports.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <ActionButton variant="success" onClick={handleExportExcel}>
                Excel
              </ActionButton>
              <ActionButton variant="primary" onClick={handleExportCSV}>
                CSV
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => void handleExportPDF().catch((e) => console.error(e))}
              >
                PDF
              </ActionButton>
            </div>
          )}
          {loading ? (
            <LoadingState message="กำลังโหลดข้อมูล…" />
          ) : reports.length === 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[960px] table-auto text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-50 dark:border-gray-300 dark:bg-gray-800/80">
                    {STOCK_CARD_TABLE_HEADERS.map((h, hi) => (
                      <th
                        key={h}
                        className={`px-2 py-2 font-medium sm:px-3 sm:py-3 ${hi >= 8 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td
                      colSpan={STOCK_CARD_TABLE_HEADERS.length}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-10">
              {stockCardGroups.map((group) => (
                <div
                  key={group.materialId}
                  className="w-full rounded-sm border-2 border-gray-800 bg-white p-4 font-mono text-sm text-gray-900 shadow-sm dark:border-gray-300 dark:bg-gray-950 dark:text-gray-100 sm:p-5"
                >
                  <div className="mb-3 w-full border-t-2 border-gray-800 dark:border-gray-300" />
                  <div className="border-b-2 border-gray-800 pb-3 text-center text-base font-semibold tracking-tight dark:border-gray-300">
                    Stock Card : {group.materialCode}
                  </div>
                  <div className="mb-3 mt-2 break-words text-center text-xs text-gray-600 dark:text-gray-400">
                    {group.materialName}
                  </div>
                  <div className="mb-3 w-full border-t border-gray-800 dark:border-gray-300" />

                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[960px] table-auto text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-50 dark:border-gray-300 dark:bg-gray-800/80">
                          {STOCK_CARD_TABLE_HEADERS.map((h, hi) => (
                            <th
                              key={h}
                              className={`px-2 py-2 font-medium sm:px-3 sm:py-3 ${hi >= 8 ? "text-right" : "text-left"}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {group.rows.map((report, index) => (
                          <tr
                            key={`${report.materialId}-${report.receivingNo}-${report.transactionId ?? (Number(report.issued) > 0 ? "issue" : "recv")}-${index}`}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/60 ${isIssueRow(report) ? "" : "bg-gray-50/50 dark:bg-gray-800/40"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-medium sm:px-3 sm:py-3">
                              {report.receivingNo || "-"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                              {formatReportYmd(report.receivingDate, "th-TH")}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                              {formatReportYmd(report.issueDate ?? undefined, "th-TH")}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                              {report.referenceNo ?? "-"}
                            </td>
                            <td
                              className="max-w-[120px] truncate px-2 py-2 font-mono text-[11px] sm:max-w-[140px] sm:px-3 sm:py-3 sm:text-xs"
                              title={report.transactionNo ?? ""}
                            >
                              {report.transactionNo ?? "-"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                              {displayMovementType(report)}
                            </td>
                            <td className="px-2 py-2 font-medium sm:px-3 sm:py-3">
                              {report.materialCode}
                            </td>
                            <td className="px-2 py-2 sm:px-3 sm:py-3">
                              {report.materialName}
                            </td>
                            <td className="px-2 py-2 text-right font-medium text-green-700 dark:text-green-400 sm:px-3 sm:py-3">
                              {parseFloat(report.received.toString()).toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-right font-medium text-red-700 dark:text-red-400 sm:px-3 sm:py-3">
                              {parseFloat(report.issued.toString()).toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-right font-medium text-blue-700 dark:text-blue-300 sm:px-3 sm:py-3">
                              {parseFloat(report.balance.toString()).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 w-full border-t border-gray-800 dark:border-gray-300" />
                  <div className="mt-3 text-right text-sm font-semibold sm:text-base">
                    Current Balance : {group.currentBalance.toLocaleString()}{" "}
                    {group.unit}
                  </div>
                  <div className="mt-3 w-full border-t-2 border-gray-800 dark:border-gray-300" />
                </div>
              ))}
            </div>
          )}
        </ContentCard>
    </PageContainer>
  );
}
