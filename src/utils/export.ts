import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  ensureThaiPdfFontsLoaded,
  registerThaiFontOnDoc,
  THAI_PDF_FONT,
} from "@/utils/jspdf-thai-font";

export type ExportColumn<T> = {
  header: string;
  /** Value accessor. Should return primitive or formatted string. */
  accessor: (row: T) => string | number | null | undefined;
  /** Optional PDF column width (mm). */
  width?: number;
};

export interface ExportOptions<T> {
  filename: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_.]+/g, "_").slice(0, 120);
}

function toRow<T>(columns: ExportColumn<T>[], row: T): (string | number)[] {
  return columns.map((c) => {
    const v = c.accessor(row);
    if (v === null || v === undefined) return "";
    return v as string | number;
  });
}

/**
 * Export rows as XLSX file and trigger browser download.
 */
export function exportXlsx<T>({ filename, columns, rows }: ExportOptions<T>): void {
  const header = columns.map((c) => c.header);
  const body = rows.map((r) => toRow(columns, r));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${sanitizeFilename(filename)}.xlsx`);
}

/**
 * Export rows as a simple PDF table and trigger browser download (รองรับภาษาไทย).
 */
export async function exportPdf<T>({
  filename,
  columns,
  rows,
}: ExportOptions<T>): Promise<void> {
  await ensureThaiPdfFontsLoaded();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  registerThaiFontOnDoc(doc);

  const head = [columns.map((c) => c.header)];
  const body: RowInput[] = rows.map((r) => toRow(columns, r) as RowInput);

  doc.setFont(THAI_PDF_FONT, "normal");
  doc.setFontSize(10);
  doc.text(filename, 10, 10);

  autoTable(doc, {
    head,
    body,
    styles: {
      font: THAI_PDF_FONT,
      fontStyle: "normal",
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      font: THAI_PDF_FONT,
      fontStyle: "bold",
      fillColor: [55, 65, 81],
      textColor: 255,
    },
    margin: { top: 16, left: 10, right: 10 },
  });

  doc.save(`${sanitizeFilename(filename)}.pdf`);
}
