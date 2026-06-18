"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import Alert from "@/components/ui/alert/Alert";
import { apiFetch } from "@/utils/api";
import { formatMaterialIssuedByDisplay } from "@/utils/resolveStoredUserLabel";
import { getSession } from "@/utils/session";
import {
  syncPlanItemsFromProductionQrGeneration,
  type PlanDetailForLots,
} from "@/utils/ensureProductionLotsAfterReserve";
import type { GenerateProductQrOrdersResponse } from "@/services/productionPlanQrService";
import TimePicker from "@/components/ui/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: "reserved" | "confirmed";
  materialIssuedBy?: string[];
  items?: {
    product?: { productName: string };
    quantity: number;
    unit: string;
  }[];
}

function statusBadgeClass(status: ProductionPlan["status"]) {
  if (status === "reserved") {
    return "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25";
  }
  return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25";
}

function statusLabel(status: ProductionPlan["status"]) {
  return status === "reserved" ? "จองแล้ว" : "ยืนยันแล้ว";
}

export default function ScheduleReservationsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");

  const sessionUser = useMemo(() => getSession()?.user, []);

  const stats = useMemo(() => {
    const reserved = plans.filter((p) => p.status === "reserved").length;
    const confirmed = plans.filter((p) => p.status === "confirmed").length;
    return { total: plans.length, reserved, confirmed };
  }, [plans]);

  const fetchPlans = useCallback(async (options?: { showInitialSpinner?: boolean }) => {
    const showSpinner = options?.showInitialSpinner ?? true;
    if (showSpinner) setLoading(true);
    try {
      const res = await apiFetch("/production-plans");
      if (res.ok) {
        const data = await res.json();
        const allPlans = Array.isArray(data) ? data : data.data || [];
        const reservedPlans = allPlans
          .filter(
            (plan: ProductionPlan) =>
              plan.status === "reserved" || plan.status === "confirmed",
          )
          .map((plan: ProductionPlan & { material_issued_by?: string[] }) => ({
            ...plan,
            materialIssuedBy: Array.isArray(plan.materialIssuedBy)
              ? plan.materialIssuedBy
              : Array.isArray(plan.material_issued_by)
                ? plan.material_issued_by
                : [],
          }));
        setPlans(reservedPlans);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans({ showInitialSpinner: true });
  }, [fetchPlans]);

  const applyFilters = useCallback(() => {
    let filtered = [...plans];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p: ProductionPlan) =>
          p.planCode?.toLowerCase().includes(q) ||
          p.planName?.toLowerCase().includes(q),
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(
        (p: ProductionPlan) =>
          p.status.toLowerCase() === filterStatus.toLowerCase(),
      );
    }
    if (filterDateFrom) {
      filtered = filtered.filter(
        (p: ProductionPlan) => new Date(p.planDate) >= new Date(filterDateFrom),
      );
    }
    if (filterDateTo) {
      filtered = filtered.filter(
        (p: ProductionPlan) => new Date(p.planDate) <= new Date(filterDateTo),
      );
    }
    if (filterTimeFrom) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return planTime >= filterTimeFrom;
      });
    }
    if (filterTimeTo) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return planTime <= filterTimeTo;
      });
    }

    setFilteredPlans(filtered);
  }, [
    plans,
    searchTerm,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterTimeFrom,
    filterTimeTo,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlans({ showInitialSpinner: false });
    } finally {
      setRefreshing(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const plan = plans.find((p) => p.planCode === barcode.trim());
    if (!plan) {
      setMessage({ type: "error", text: "ไม่พบรหัสแผนนี้" });
      setBarcode("");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (plan.status === "confirmed") {
      setMessage({ type: "error", text: "แผนนี้ยืนยันแล้ว" });
      setBarcode("");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const res = await apiFetch(`/production-plans/${plan.id}/confirm-and-issue`, {
        method: "POST",
      });
      if (res.ok) {
        const body = (await res.json()) as {
          productionQrGeneration?: GenerateProductQrOrdersResponse | null;
        };
        try {
          const dRes = await apiFetch(`/production-plans/${plan.id}/details`);
          if (dRes.ok) {
            const detail = (await dRes.json()) as {
              id?: number;
              planId?: number;
              planCode: string;
              status?: string;
              items: Array<{
                id?: number;
                planItemId?: number;
                productId: number;
                productName: string;
                quantity: number;
                unit: string;
              }>;
            };
            const lotPlan: PlanDetailForLots = {
              id: detail.id,
              planId: detail.planId,
              planCode: detail.planCode,
              status: detail.status,
              items: detail.items.map((it) => ({
                planItemId: it.planItemId,
                id: it.id,
                productId: it.productId,
                productName: it.productName,
                quantity: it.quantity,
                unit: it.unit,
              })),
            };
            await syncPlanItemsFromProductionQrGeneration(
              lotPlan,
              body.productionQrGeneration,
            );
          }
        } catch (e) {
          console.warn("sync production QR after barcode confirm failed", e);
        }
        setMessage({
          type: "success",
          text: `ยืนยันแผน ${plan.planCode} และจ่ายออกวัตถุดิบสำเร็จ — สร้าง QR ล็อตผลิตแล้ว`,
        });
        setBarcode("");
        await fetchPlans({ showInitialSpinner: false });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ message: "ไม่สามารถยืนยันแผนได้" }));
        setMessage({
          type: "error",
          text: errorData.message || "ไม่สามารถยืนยันแผนได้",
        });
        setBarcode("");
        setTimeout(() => setMessage(null), 5000);
      }
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setBarcode("");
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTimeFrom("");
    setFilterTimeTo("");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh]">
        <PageBreadcrumb pageTitle="แผนผลิตที่จองสำเร็จแล้ว" />
        <div className="space-y-6 px-0">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-8 dark:border-gray-700 dark:from-gray-900 dark:to-emerald-950/30 animate-pulse">
            <div className="h-8 w-2/3 max-w-md rounded-lg bg-gray-200/80 dark:bg-gray-700" />
            <div className="mt-3 h-4 w-full max-w-lg rounded bg-gray-200/60 dark:bg-gray-700/80" />
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="h-20 rounded-xl bg-white/60 dark:bg-gray-800/60" />
              <div className="h-20 rounded-xl bg-white/60 dark:bg-gray-800/60" />
              <div className="h-20 rounded-xl bg-white/60 dark:bg-gray-800/60" />
            </div>
          </div>
          <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800/80 animate-pulse" />
          <ComponentCard title="รายการแผน">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="แผนผลิตที่จองสำเร็จแล้ว" />
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/60 p-6 shadow-sm dark:border-emerald-900/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/25 sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90 dark:text-emerald-400/90">
                Production · Reserved
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                แผนผลิตที่จองสำเร็จแล้ว
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                แสดงเฉพาะแผนที่<strong className="font-medium text-gray-800 dark:text-gray-200">
                  จองวัตถุดิบแล้ว
                </strong>
                หรือ<strong className="font-medium text-gray-800 dark:text-gray-200">
                  ยืนยันและจ่ายออกแล้ว
                </strong>
                — สแกนรหัสแผนเพื่อยืนยันรวดเร็ว หรือเปิดรายละเอียดเพื่อจ่ายทีละบรรทัด
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/90 px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? "กำลังรีเฟรช…" : "รีเฟรชข้อมูล"}
            </button>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-gray-600/60 dark:bg-gray-900/50">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                แผนทั้งหมดในหน้านี้
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 shadow-sm dark:border-blue-800/50 dark:bg-blue-950/30">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                รอจ่ายออก (จองแล้ว)
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-200">
                {stats.reserved.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                ยืนยันแล้ว
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
                {stats.confirmed.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <Alert
            variant={message.type}
            title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}
            message={message.text}
          />
        )}

        {/* Quick scan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                ยืนยันด้วยสแกนรหัสแผน
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                กรอกหรือสแกนค่าเท่ากับ <span className="font-mono font-medium text-gray-700 dark:text-gray-300">รหัสแผน</span>{" "}
                แล้วกดยืนยัน — ระบบจะจ่ายออกวัตถุดิบทั้งแผน (เทียบเท่ายืนยันแบบรวม)
              </p>
            </div>
          </div>
          <form
            onSubmit={handleBarcodeSubmit}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="plan-barcode" className="sr-only">
                รหัสแผนสำหรับสแกน
              </label>
              <input
                id="plan-barcode"
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="สแกนหรือพิมพ์รหัสแผน (Plan code) เพื่อยืนยันและจ่ายออกวัตถุดิบ"
                className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50/80 px-4 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white dark:placeholder:text-gray-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              ยืนยันและจ่ายออก
            </button>
          </form>
        </div>

        {/* Shortcuts */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              router.push("/pc/schedule/reservations/picking-slip")
            }
            className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            ใบจัดสินค้า (ตามออเดอร์)
          </button>
          <button
            type="button"
            onClick={() => router.push("/pc/reservations")}
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-900/50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            รายการจอง Material
          </button>
          <button
            type="button"
            onClick={() => router.push("/pc/schedule")}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            จัดงานล่วงหน้า
          </button>
        </div>

        <ComponentCard
          title={`รายการแผน (แสดง ${filteredPlans.length.toLocaleString()} รายการ)`}
        >
          <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/80 dark:bg-gray-900/40">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              ตัวกรอง
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="ค้นหา รหัสแผน / ชื่อแผน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="reserved">จองแล้ว</option>
                <option value="confirmed">ยืนยันแล้ว</option>
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4"
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
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  วันที่เริ่มต้น
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
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', height: '44px' } },
                      },
                      popper: { sx: { zIndex: 999999 } },
                      dialog: { sx: { zIndex: 999999 } },
                    }}
                  />
                </LocalizationProvider>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  วันที่สิ้นสุด
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
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', height: '44px' } },
                      },
                      popper: { sx: { zIndex: 999999 } },
                      dialog: { sx: { zIndex: 999999 } },
                    }}
                  />
                </LocalizationProvider>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  เวลาเริ่มต้น
                </label>
                <TimePicker
                  value={filterTimeFrom}
                  onChange={(time) => setFilterTimeFrom(time)}
                  placeholder="เลือกเวลา"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  เวลาสิ้นสุด
                </label>
                <TimePicker
                  value={filterTimeTo}
                  onChange={(time) => setFilterTimeTo(time)}
                  placeholder="เลือกเวลา"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] table-auto text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 dark:border-gray-700 dark:from-gray-800/90 dark:to-gray-800/60">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      รหัสแผน
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      ชื่อแผน
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      วัน / เวลา
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      สถานะ
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      บรรทัดสินค้า
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      จ่ายออกโดย
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      การทำงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900/40">
                  {filteredPlans.length === 0 ? (
                    <TableEmptyRow
                      colSpan={7}
                      message="ไม่มีแผนที่ตรงกับตัวกรอง"
                    />
                  ) : (
                    filteredPlans.map((plan) => {
                      const issuedByLabel = formatMaterialIssuedByDisplay(
                        {
                          status: plan.status,
                          materialIssuedBy: plan.materialIssuedBy ?? [],
                        },
                        sessionUser,
                      );
                      return (
                      <tr
                        key={plan.id}
                        className="transition hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {plan.planCode}
                          </span>
                        </td>
                        <td className="max-w-[220px] px-4 py-3.5">
                          <span
                            className="line-clamp-2 text-sm text-gray-800 dark:text-gray-200"
                            title={plan.planName}
                          >
                            {plan.planName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">
                            {new Date(plan.planDate).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {plan.planTime
                              ? `${plan.planTime.substring(0, 5)} น.`
                              : "00:00 น."}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(plan.status)}`}
                          >
                            {statusLabel(plan.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium tabular-nums text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {plan.items?.length ?? 0}
                          </span>
                        </td>
                        <td className="max-w-[160px] px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {issuedByLabel != null ? (
                            <span
                              className="line-clamp-2"
                              title={issuedByLabel}
                            >
                              {issuedByLabel}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/pc/schedule/reservations/${plan.id}`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
                          >
                            รายละเอียด
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
