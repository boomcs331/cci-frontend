"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { apiFetch } from "@/utils/api";
import { exportPdf, exportXlsx, type ExportColumn } from "@/utils/export";

/** สถานะแผนการผลิต / การจัดงาน */
const PLAN_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "ทุกสถานะ" },
  { value: "draft", label: "ร่าง" },
  { value: "reserved", label: "จองแล้ว" },
  { value: "confirmed", label: "ยืนยันแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

function planStatusLabel(status?: string): string {
  if (!status) return "—";
  const found = PLAN_STATUS_OPTIONS.find(
    (o) => o.value && o.value === status.toLowerCase()
  );
  return found?.label ?? status;
}

function planStatusBadgeClass(status?: string): string {
  const s = (status || "").toLowerCase();
  if (s === "draft")
    return "bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300";
  if (s === "reserved")
    return "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300";
  if (s === "confirmed")
    return "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300";
  if (s === "cancelled")
    return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-400";
}

interface ReservationDetail {
  planCode: string;
}

interface MaterialReservation {
  materialId: number;
  materialName: string;
  unit: string;
  totalReserved: number;
  details: ReservationDetail[];
}

interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  requiredQuantity: number;
  availableQty: number;
  unit: string;
}

interface PlanReservationRow {
  materialId: number;
  materialCode: string;
  materialName: string;
  reservedQuantity: number;
  lotNumber?: string;
  lotPdNo?: string;
  qrCode?: string;
  receiveDate?: string;
  createDate: string;
}

interface PlanItem {
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
}

interface PlanDetail {
  id?: number;
  planId?: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: string;
  items: PlanItem[];
  reservations?: PlanReservationRow[];
}

interface ProductionPlanRow {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status?: string;
}

interface MaterialFifoGroup {
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  requiredQuantity?: number;
  rows: PlanReservationRow[];
  totalReserved: number;
}

interface PickingOrderGroup {
  planCode: string;
  planName?: string;
  planDate?: string;
  planTime?: string;
  planId?: number;
  status?: string;
  materialGroups: MaterialFifoGroup[];
}

function normalizeReservationPayload(raw: unknown): MaterialReservation[] {
  if (Array.isArray(raw)) return raw as MaterialReservation[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    return Array.isArray(d) ? (d as MaterialReservation[]) : [];
  }
  return [];
}

function normalizePlansPayload(raw: unknown): ProductionPlanRow[] {
  if (Array.isArray(raw)) return raw as ProductionPlanRow[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    return Array.isArray(d) ? (d as ProductionPlanRow[]) : [];
  }
  return [];
}

/** วันที่รับก่อน = FIFO ก่อน; ไม่มีวันที่รับใช้วันที่จอง; สุดท้ายเรียง Lot */
function parseDateMs(s?: string): number {
  if (!s) return Number.NaN;
  const t = Date.parse(s);
  return Number.isNaN(t) ? Number.NaN : t;
}

function fifoSort(a: PlanReservationRow, b: PlanReservationRow): number {
  const ra = parseDateMs(a.receiveDate);
  const rb = parseDateMs(b.receiveDate);
  if (!Number.isNaN(ra) || !Number.isNaN(rb)) {
    if (Number.isNaN(ra) && Number.isNaN(rb)) {
      /* fall through */
    } else if (Number.isNaN(ra)) return 1;
    else if (Number.isNaN(rb)) return -1;
    else if (ra !== rb) return ra - rb;
  }
  const ca = parseDateMs(a.createDate);
  const cb = parseDateMs(b.createDate);
  if (!Number.isNaN(ca) && !Number.isNaN(cb) && ca !== cb) return ca - cb;
  if (Number.isNaN(ca) && !Number.isNaN(cb)) return 1;
  if (!Number.isNaN(ca) && Number.isNaN(cb)) return -1;
  return (a.lotNumber || "").localeCompare(b.lotNumber || "", "th");
}

function aggregateRequiredByMaterial(
  items: PlanItem[]
): Map<
  number,
  { materialCode: string; materialName: string; requiredQuantity: number; unit: string }
> {
  const map = new Map<
    number,
    { materialCode: string; materialName: string; requiredQuantity: number; unit: string }
  >();
  for (const item of items || []) {
    for (const m of item.materials || []) {
      const prev = map.get(m.materialId);
      if (prev) {
        prev.requiredQuantity += m.requiredQuantity;
      } else {
        map.set(m.materialId, {
          materialCode: m.materialCode,
          materialName: m.materialName,
          requiredQuantity: m.requiredQuantity,
          unit: m.unit,
        });
      }
    }
  }
  return map;
}

function buildMaterialGroupsFromPlan(data: PlanDetail): MaterialFifoGroup[] {
  const requiredMap = aggregateRequiredByMaterial(data.items);
  const reservations = [...(data.reservations || [])];

  const byMat = new Map<number, PlanReservationRow[]>();
  for (const r of reservations) {
    if (!byMat.has(r.materialId)) byMat.set(r.materialId, []);
    byMat.get(r.materialId)!.push(r);
  }
  byMat.forEach((rows) => rows.sort(fifoSort));

  const materialIds = new Set<number>([
    ...requiredMap.keys(),
    ...byMat.keys(),
  ]);

  return [...materialIds]
    .map((mid) => {
      const req = requiredMap.get(mid);
      const rows = byMat.get(mid) || [];
      const totalReserved = rows.reduce((s, x) => s + x.reservedQuantity, 0);
      return {
        materialId: mid,
        materialCode: req?.materialCode ?? rows[0]?.materialCode ?? "—",
        materialName: req?.materialName ?? rows[0]?.materialName ?? "—",
        unit: req?.unit ?? "",
        requiredQuantity: req?.requiredQuantity,
        rows,
        totalReserved,
      };
    })
    .sort((a, b) => a.materialName.localeCompare(b.materialName, "th"));
} 

function buildPickingGroup(data: PlanDetail): PickingOrderGroup {
  const pid = data.id ?? data.planId;
  return {
    planCode: data.planCode,
    planName: data.planName,
    planDate: data.planDate,
    planTime: data.planTime,
    planId: pid != null && Number.isFinite(Number(pid)) ? Number(pid) : undefined,
    status: data.status,
    materialGroups: buildMaterialGroupsFromPlan(data),
  };
}

export default function PickingSlipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<PickingOrderGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resMat, resPlans] = await Promise.all([
        apiFetch("/production-plans/materials/reservations"),
        apiFetch("/production-plans"),
      ]);

      if (!resMat.ok) throw new Error("โหลดรายการจองวัตถุดิบไม่สำเร็จ");
      const materials = normalizeReservationPayload(await resMat.json());

      const plansList = resPlans.ok
        ? normalizePlansPayload(await resPlans.json())
        : [];
      const planByCode = new Map(plansList.map((p) => [p.planCode, p]));

      /** แผนที่ยืนยันแล้วไม่มีแถวใน materials/reservations (ถูกลบหลังจ่าย) — ต้องใช้รายการแผนทั้งหมด */
      const planCodesFromMaterials = new Set<string>();
      for (const m of materials) {
        for (const d of m.details || []) {
          if (d.planCode) planCodesFromMaterials.add(d.planCode);
        }
      }

      const idsFromMaterials = [...planCodesFromMaterials]
        .map((code) => planByCode.get(code)?.id)
        .filter((id): id is number => id != null);

      const idsFromReservedOrConfirmed = plansList
        .filter((p) => {
          const s = (p.status ?? "").toLowerCase();
          return s === "reserved" || s === "confirmed";
        })
        .map((p) => p.id);

      const ids = [...new Set([...idsFromMaterials, ...idsFromReservedOrConfirmed])];

      const detailResults = await Promise.all(
        ids.map(async (id) => {
          const r = await apiFetch(`/production-plans/${id}/details`);
          if (!r.ok) return null;
          return r.json() as Promise<PlanDetail>;
        })
      );

      const nextGroups: PickingOrderGroup[] = [];
      for (const detail of detailResults) {
        if (!detail) continue;
        const hasReservations = (detail.reservations?.length ?? 0) > 0;
        const hasItems = (detail.items?.length ?? 0) > 0;
        if (!hasReservations && !hasItems) continue;
        nextGroups.push(buildPickingGroup(detail));
      }

      nextGroups.sort((a, b) => {
        const da = a.planDate ? new Date(a.planDate).getTime() : 0;
        const db = b.planDate ? new Date(b.planDate).getTime() : 0;
        if (da !== db) return da - db;
        return a.planCode.localeCompare(b.planCode, "th");
      });

      setGroups(nextGroups);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (filterDateFrom) {
      list = list.filter(
        (g) => g.planDate && new Date(g.planDate) >= new Date(filterDateFrom)
      );
    }
    if (filterDateTo) {
      list = list.filter(
        (g) => g.planDate && new Date(g.planDate) <= new Date(filterDateTo)
      );
    }
    if (filterStatus) {
      const fs = filterStatus.toLowerCase();
      list = list.filter((g) => (g.status || "").toLowerCase() === fs);
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((g) => {
      const parts = [
        g.planCode,
        g.planName ?? "",
        ...g.materialGroups.flatMap((mg) => [
          mg.materialName,
          mg.materialCode,
          ...mg.rows.flatMap((r) => [
            r.qrCode ?? "",
            r.lotNumber ?? "",
            r.lotPdNo ?? "",
          ]),
        ]),
      ];
      return parts.join(" ").toLowerCase().includes(q);
    });
  }, [
    groups,
    filterDateFrom,
    filterDateTo,
    filterStatus,
    searchTerm,
  ]);

  const handlePrint = () => window.print();

  type PickingFlatRow = {
    planCode: string;
    planName: string;
    planDate: string;
    status: string;
    materialCode: string;
    materialName: string;
    unit: string;
    requiredQuantity: number | "";
    reservedQuantity: number;
    lotNumber: string;
    lotPdNo: string;
    qrCode: string;
    receiveDate: string;
  };

  const flatPickingRows = useMemo<PickingFlatRow[]>(() => {
    const rows: PickingFlatRow[] = [];
    for (const order of filteredGroups) {
      for (const mg of order.materialGroups) {
        if (mg.rows.length === 0) {
          rows.push({
            planCode: order.planCode,
            planName: order.planName ?? "",
            planDate: order.planDate ?? "",
            status: order.status ?? "",
            materialCode: mg.materialCode,
            materialName: mg.materialName,
            unit: mg.unit,
            requiredQuantity: mg.requiredQuantity ?? "",
            reservedQuantity: mg.totalReserved,
            lotNumber: "",
            lotPdNo: "",
            qrCode: "",
            receiveDate: "",
          });
          continue;
        }
        for (const r of mg.rows) {
          rows.push({
            planCode: order.planCode,
            planName: order.planName ?? "",
            planDate: order.planDate ?? "",
            status: order.status ?? "",
            materialCode: mg.materialCode,
            materialName: mg.materialName,
            unit: mg.unit,
            requiredQuantity: mg.requiredQuantity ?? "",
            reservedQuantity: r.reservedQuantity,
            lotNumber: r.lotNumber ?? "",
            lotPdNo: r.lotPdNo ?? "",
            qrCode: r.qrCode ?? "",
            receiveDate: r.receiveDate ?? "",
          });
        }
      }
    }
    return rows;
  }, [filteredGroups]);

  const pickingExportColumns = useMemo<ExportColumn<PickingFlatRow>[]>(
    () => [
      { header: "แผน", accessor: (r) => r.planCode },
      { header: "ชื่อแผน", accessor: (r) => r.planName },
      {
        header: "วันที่แผน",
        accessor: (r) => (r.planDate ? new Date(r.planDate).toLocaleDateString("th-TH") : ""),
      },
      { header: "สถานะ", accessor: (r) => r.status },
      { header: "รหัสวัตถุดิบ", accessor: (r) => r.materialCode },
      { header: "ชื่อวัตถุดิบ", accessor: (r) => r.materialName },
      { header: "ต้องการ", accessor: (r) => r.requiredQuantity },
      { header: "จอง", accessor: (r) => r.reservedQuantity },
      { header: "หน่วย", accessor: (r) => r.unit },
      { header: "Lot", accessor: (r) => r.lotNumber },
      { header: "Lot PD", accessor: (r) => r.lotPdNo },
      { header: "QR", accessor: (r) => r.qrCode },
      {
        header: "วันที่รับ",
        accessor: (r) => (r.receiveDate ? new Date(r.receiveDate).toLocaleDateString("th-TH") : ""),
      },
    ],
    [],
  );

  const handleExportXlsx = () => {
    exportXlsx({
      filename: `picking-slip_${new Date().toISOString().slice(0, 10)}`,
      columns: pickingExportColumns,
      rows: flatPickingRows,
    });
  };

  const handleExportPdf = () => {
    void exportPdf({
      filename: `picking-slip_${new Date().toISOString().slice(0, 10)}`,
      columns: pickingExportColumns,
      rows: flatPickingRows,
    }).catch((e) => console.error(e));
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="ใบจัดสินค้า" />
        <ComponentCard title="ใบจัดสินค้า">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            กำลังโหลด...
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="print:bg-white">
      <div className="print:hidden">
        <PageBreadcrumb pageTitle="ใบจัดสินค้า" />
      </div>

      <div className="space-y-6 print:space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                ใบจัดสินค้า
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                แสดงวัตถุดิบที่ต้องใช้ตามแผน และรายการจองแยกตาม Lot/QR เรียง{" "}
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  FIFO
                </span>{" "}
                (วันที่รับก่อน)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportXlsx}
                disabled={flatPickingRows.length === 0}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Export XLSX
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={flatPickingRows.length === 0}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                พิมพ์
              </button>
              <button
                type="button"
                onClick={() => router.push("/pc/schedule/reservations")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                กลับรายการแผน
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200 print:hidden">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 print:hidden">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
            ตัวกรอง — วันที่แผน และสถานะการจัดงาน
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                วันที่แผน ตั้งแต่
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={filterDateFrom ? dayjs(filterDateFrom) : null}
                  onChange={(newValue) => setFilterDateFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'เลือกวันที่',
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.375rem', height: '40px' } },
                    },
                    popper: { sx: { zIndex: 999999 } },
                    dialog: { sx: { zIndex: 999999 } },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                ถึงวันที่
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={filterDateTo ? dayjs(filterDateTo) : null}
                  onChange={(newValue) => setFilterDateTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'เลือกวันที่',
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.375rem', height: '40px' } },
                    },
                    popper: { sx: { zIndex: 999999 } },
                    dialog: { sx: { zIndex: 999999 } },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                สถานะการจัดงาน
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                {PLAN_STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterStatus("");
                  setSearchTerm("");
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center justify-center gap-1.5"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                ล้างตัวกรอง
              </button>
            </div>
          </div>
          <div className="mt-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา แผน วัตถุดิบ QR Lot..."
              className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        <div id="picking-slip-print-area" className="space-y-8 print:space-y-6">
          <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">ใบจัดสินค้า</h1>
            <p className="text-sm text-gray-600 mt-1">
              พิมพ์เมื่อ {new Date().toLocaleString("th-TH")} · เรียงหยิบตาม FIFO
              (วันที่รับ)
            </p>
            {(filterDateFrom ||
              filterDateTo ||
              filterStatus ||
              searchTerm.trim()) && (
              <p className="text-xs text-gray-500 mt-2">
                ตัวกรอง: วันที่ {filterDateFrom || "—"} ถึง{" "}
                {filterDateTo || "—"}
                {filterStatus
                  ? ` · สถานะ ${planStatusLabel(filterStatus)}`
                  : ""}
                {searchTerm.trim() ? ` · ค้นหา "${searchTerm.trim()}"` : ""}
              </p>
            )}
          </div>

          {filteredGroups.length === 0 ? (
            <ComponentCard title="รายการตามออเดอร์">
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {groups.length === 0
                  ? "ไม่มีรายการจองวัตถุดิบ หรือยังโหลดรายละเอียดแผนไม่ได้"
                  : "ไม่มีรายการตามตัวกรองที่เลือก — ลองปรับวันที่หรือสถานะ"}
              </div>
            </ComponentCard>
          ) : (
            filteredGroups.map((order) => (
              <section
                key={order.planCode}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border print:break-inside-avoid"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 print:bg-white">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        ออเดอร์ / แผนการผลิต
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.planCode}
                        {order.planName ? (
                          <span className="font-normal text-gray-600 dark:text-gray-300">
                            {" "}
                            — {order.planName}
                          </span>
                        ) : null}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                      {order.status ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planStatusBadgeClass(order.status)}`}
                        >
                          {planStatusLabel(order.status)}
                        </span>
                      ) : null}
                      {order.planDate ? (
                        <span>
                          วันที่{" "}
                          {new Date(order.planDate).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {order.planTime
                            ? ` · ${order.planTime.substring(0, 5)} น.`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      {order.planId ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/pc/schedule/reservations/${order.planId}`
                            )
                          }
                          className="ml-3 text-purple-600 hover:underline print:hidden"
                        >
                          ดูแผน
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <span className="inline-block w-1 h-4 bg-teal-500 rounded" />
                      สรุปวัตถุดิบที่ต้องใช้ (จาก BOM แผน)
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full table-auto text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800/80">
                            <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">
                              รหัส
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">
                              ชื่อวัตถุดิบ
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                              ต้องการ
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                              จองแล้ว
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white w-16">
                              หน่วย
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {order.materialGroups.length === 0 ? (
                            <TableEmptyRow colSpan={5} />
                          ) : (
                            order.materialGroups.map((mg) => (
                              <tr
                                key={`sum-${mg.materialId}`}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">
                                  {mg.materialCode}
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white">
                                  {mg.materialName}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-white">
                                  {mg.requiredQuantity != null
                                    ? mg.requiredQuantity.toLocaleString()
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-white">
                                  {mg.totalReserved.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                  {mg.unit || "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <span className="inline-block w-1 h-4 bg-amber-500 rounded" />
                      หยิบตามวัตถุดิบ — ลำดับ FIFO (QR / Lot)
                    </h4>
                    <div className="space-y-5">
                      {order.materialGroups.map((mg) => (
                        <div
                          key={mg.materialId}
                          className="rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                วัตถุดิบ
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {mg.materialName}
                                <span className="font-mono text-sm font-normal text-gray-600 dark:text-gray-300 ml-2">
                                  ({mg.materialCode})
                                </span>
                              </p>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                              {mg.requiredQuantity != null ? (
                                <span>
                                  ต้องการ{" "}
                                  <strong className="text-gray-900 dark:text-white">
                                    {mg.requiredQuantity.toLocaleString()}
                                  </strong>{" "}
                                  {mg.unit}
                                </span>
                              ) : null}
                              <span>
                                จองรวม{" "}
                                <strong className="text-gray-900 dark:text-white">
                                  {mg.totalReserved.toLocaleString()}
                                </strong>{" "}
                                {mg.unit || ""}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full table-auto text-sm">
                              <thead>
                                <tr className="bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200/80 dark:border-amber-800/50">
                                  <th className="px-3 py-2 text-center font-medium text-gray-800 dark:text-gray-200 w-12">
                                    ลำดับ
                                    <br />
                                    <span className="text-[10px] font-normal text-gray-500">
                                      FIFO
                                    </span>
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-800 dark:text-gray-200">
                                    QR Code
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-800 dark:text-gray-200">
                                    Lot
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-800 dark:text-gray-200">
                                    Lot PD No.
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-800 dark:text-gray-200">
                                    วันที่รับ
                                  </th>
                                  <th className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                                    จำนวนจอง
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/40">
                                {mg.rows.length === 0 ? (
                                  <TableEmptyRow
                                    colSpan={6}
                                    message="ยังไม่มีรายการจองราย Lot/QR สำหรับวัตถุดิบนี้"
                                  />
                                ) : (
                                  mg.rows.map((r, idx) => (
                                    <tr
                                      key={`${r.qrCode ?? ""}-${r.lotNumber ?? ""}-${idx}`}
                                      className="hover:bg-amber-50/40 dark:hover:bg-amber-900/10"
                                    >
                                      <td className="px-3 py-2 text-center font-medium text-amber-800 dark:text-amber-200 tabular-nums">
                                        {idx + 1}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white break-all max-w-[200px]">
                                        {r.qrCode || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-gray-900 dark:text-white">
                                        {r.lotNumber || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                        {r.lotPdNo || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-gray-800 dark:text-white whitespace-nowrap">
                                        {r.receiveDate
                                          ? new Date(
                                              r.receiveDate
                                            ).toLocaleDateString("th-TH", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })
                                          : "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                                        {r.reservedQuantity.toLocaleString()}
                                        {mg.unit ? (
                                          <span className="text-gray-500 font-normal text-xs ml-1">
                                            {mg.unit}
                                          </span>
                                        ) : null}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
