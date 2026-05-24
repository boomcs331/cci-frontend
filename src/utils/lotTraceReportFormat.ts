import type {
  LotStepQuantitiesPayload,
  LotStepQuantityRow,
} from "@/types/productionLotStepQuantities";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";

export const LOT_TRACE_TABLE_HEADERS = [
  "#",
  "ขั้นตอน",
  "รหัสขั้น",
  "สถานะ",
  "เริ่ม",
  "ปิด",
  "รับเข้า",
  "จ่ายออก",
  "ผู้ทำ",
  "หมายเหตุ",
] as const;

export function formatLotTraceDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatLotTraceYmd(
  ymd: string | null | undefined,
): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
  const d = new Date(`${ymd}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" });
}

function stepStatusLabel(status: LotStepQuantityRow["status"]): string {
  if (status === "completed") return "เสร็จแล้ว";
  if (status === "in_progress") return "กำลังทำ";
  if (status === "rejected") return "ปฏิเสธ";
  return "รอ";
}

function fmtQty(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const n = Number(value);
  const text = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("th-TH", { maximumFractionDigits: 4 });
  return `${text} ${unit}`;
}

export function lotTraceStepRowCells(
  step: LotStepQuantityRow,
  unit: string,
  useProcessDisplayName = true,
): string[] {
  const name = useProcessDisplayName
    ? processStepDisplayName(step.processCode, step.processName)
    : step.stepName || step.processName || step.processCode;
  return [
    String(step.stepOrder),
    name,
    step.processCode,
    stepStatusLabel(step.status),
    formatLotTraceDateTime(step.startTime),
    formatLotTraceDateTime(step.endTime),
    fmtQty(step.quantityIn, unit),
    fmtQty(step.quantityOut, unit),
    step.operator?.trim() || "-",
    step.remarks?.trim() || "-",
  ];
}

export function fgLotStatusLabelTh(status: string): string {
  const s = status.toUpperCase();
  if (s === "AVAILABLE") return "พร้อมขาย";
  if (s === "PARTIAL_USED") return "จ่ายออกบางส่วน";
  if (s === "USED_UP") return "จ่ายออกครบแล้ว";
  return lotStatusLabelTh(status);
}

export function lotStatusLabelTh(status: string): string {
  const s = status.toUpperCase();
  if (s === "PENDING") return "รอเริ่ม";
  if (s === "IN_PROGRESS") return "กำลังผลิต";
  if (s === "COMPLETED") return "ปิดงานแล้ว";
  if (s === "REJECTED") return "ปฏิเสธ";
  if (s === "SPLIT") return "แยกล็อตแล้ว (QR เก่า)";
  return status;
}

export type LotTraceProductGroup = {
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  lots: LotStepQuantitiesPayload[];
  lotCount: number;
  totalLotQuantity: number;
};

/** จัดกลุ่มล็อตตามรหัสสินค้า (ลำดับสินค้าตามที่ปรากฏในหน้านั้น) */
export function buildLotTraceProductGroups(
  lots: LotStepQuantitiesPayload[],
): LotTraceProductGroup[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const byProduct = new Map<number, LotStepQuantitiesPayload[]>();

  for (const lot of lots) {
    const pid = lot.productId ?? 0;
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(lot);
    if (!seen.has(pid)) {
      seen.add(pid);
      order.push(pid);
    }
  }

  return order.map((pid) => {
    const productLots = byProduct.get(pid)!;
    const first = productLots[0];
    return {
      productId: pid,
      productCode: first.productCode ?? "—",
      productName: first.productName ?? "—",
      unit: first.unit,
      lots: productLots,
      lotCount: productLots.length,
      totalLotQuantity: productLots.reduce((s, l) => s + l.lotQuantity, 0),
    };
  });
}

function appendLotTraceLotToAoA(
  aoa: (string | number)[][],
  g: LotStepQuantitiesPayload,
) {
  aoa.push([`Lot Trace : ${g.lotNo}`]);
  aoa.push([
    `ใบสั่ง ${g.orderNo} · ${g.productCode ?? ""} ${g.productName ?? ""}`.trim(),
  ]);
  aoa.push([
    `จำนวนล็อต ${g.lotQuantity.toLocaleString()} ${g.unit} · สถานะ ${lotStatusLabelTh(g.lotStatus)}`,
  ]);
  if (g.lotCreatedAt) {
    aoa.push([`สร้างเมื่อ ${formatLotTraceDateTime(g.lotCreatedAt)}`]);
  }
  aoa.push([]);
  aoa.push([...LOT_TRACE_TABLE_HEADERS]);
  for (const step of g.steps) {
    aoa.push(lotTraceStepRowCells(step, g.unit));
  }
  if (g.splitChildren.length > 0) {
    aoa.push([]);
    aoa.push(["ล็อตย่อยจาก Split"]);
    for (const c of g.splitChildren) {
      aoa.push([
        c.lotNo,
        c.qrCode,
        `${c.quantity} ${g.unit}`,
        c.status,
        c.splitReason ?? "",
      ]);
    }
  }
  aoa.push([]);
}

export function buildLotTraceProductGroupedExportAoA(
  productGroups: LotTraceProductGroup[],
): (string | number)[][] {
  const aoa: (string | number)[][] = [];
  for (const pg of productGroups) {
    aoa.push([`รหัสสินค้า : ${pg.productCode}`]);
    aoa.push([pg.productName]);
    aoa.push([
      `${pg.lotCount} ล็อต · รวมจำนวน ${pg.totalLotQuantity.toLocaleString()} ${pg.unit}`,
    ]);
    aoa.push([]);
    for (const lot of pg.lots) {
      appendLotTraceLotToAoA(aoa, lot);
    }
    aoa.push([]);
  }
  return aoa;
}

export function buildLotTraceProductGroupedCsv(
  productGroups: LotTraceProductGroup[],
): string {
  const escape = (val: string) => {
    if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };
  const lines: string[] = [];
  for (const pg of productGroups) {
    lines.push(escape(`รหัสสินค้า : ${pg.productCode}`));
    lines.push(escape(pg.productName));
    lines.push(
      escape(
        `${pg.lotCount} ล็อต · รวมจำนวน ${pg.totalLotQuantity.toLocaleString()} ${pg.unit}`,
      ),
    );
    lines.push("");
    for (const g of pg.lots) {
      lines.push(escape(`Lot Trace : ${g.lotNo}`));
      lines.push(escape(`ใบสั่ง ${g.orderNo}`));
      lines.push("");
      lines.push(LOT_TRACE_TABLE_HEADERS.map(escape).join(","));
      for (const step of g.steps) {
        lines.push(lotTraceStepRowCells(step, g.unit).map(escape).join(","));
      }
      lines.push("");
    }
    lines.push("");
  }
  return lines.join("\r\n");
}

export function buildLotTraceExportAoA(
  groups: LotStepQuantitiesPayload[],
): (string | number)[][] {
  const aoa: (string | number)[][] = [];
  for (const g of groups) {
    appendLotTraceLotToAoA(aoa, g);
  }
  return aoa;
}

export function buildLotTraceCsv(groups: LotStepQuantitiesPayload[]): string {
  const escape = (val: string) => {
    if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };
  const lines: string[] = [];
  for (const g of groups) {
    lines.push(escape(`Lot Trace : ${g.lotNo}`));
    lines.push(escape(`ใบสั่ง ${g.orderNo}`));
    lines.push("");
    lines.push(LOT_TRACE_TABLE_HEADERS.map(escape).join(","));
    for (const step of g.steps) {
      lines.push(lotTraceStepRowCells(step, g.unit).map(escape).join(","));
    }
    lines.push("");
  }
  return lines.join("\r\n");
}
