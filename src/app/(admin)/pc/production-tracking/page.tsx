"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import TimePicker from "@/components/ui/TimePicker";
import { apiFetch } from "@/utils/api";

type PlanStatus = "draft" | "reserved" | "confirmed" | "cancelled";

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: PlanStatus;
  remarks?: string;
  createDate?: string;
  items?: {
    product?: { productName: string };
    quantity: number;
    unit: string;
    bom?: unknown[];
  }[];
}

const statusConfig: Record<
  PlanStatus,
  { label: string; short: string; en: string }
> = {
  draft: { label: "ร่าง", short: "ร่าง", en: "Draft" },
  reserved: { label: "จองแล้ว", short: "จอง", en: "Reserved" },
  confirmed: { label: "ยืนยันแล้ว", short: "ยืนยัน", en: "Confirmed" },
  cancelled: { label: "ยกเลิก", short: "ยกเลิก", en: "Cancelled" },
};

function normalizeStatus(s: string | undefined): PlanStatus {
  const v = (s || "draft").toLowerCase();
  if (v === "reserved" || v === "confirmed" || v === "cancelled" || v === "draft") {
    return v;
  }
  return "draft";
}

function normalizePlansPayload(raw: unknown): ProductionPlan[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) list = d;
  }
  return list.map((p) => {
    const x = p as ProductionPlan;
    return { ...x, status: normalizeStatus(x.status as string) };
  });
}

type FlatpickrApi = ReturnType<typeof flatpickr>;

function clearFlatpickr(fp: FlatpickrApi | undefined) {
  if (fp && !Array.isArray(fp)) fp.clear();
}

function detailHref(plan: ProductionPlan): string {
  if (plan.status === "reserved" || plan.status === "confirmed") {
    return `/pc/schedule/reservations/${plan.id}`;
  }
  return `/pc/schedule/${plan.id}`;
}

export default function ProductionTrackingPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  const [allPlans, setAllPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTimeFrom, setFilterTimeFrom] = useState("");
  const [filterTimeTo, setFilterTimeTo] = useState("");

  const dateFromPickerRef = useRef<HTMLInputElement>(null);
  const dateToPickerRef = useRef<HTMLInputElement>(null);
  const flatpickrRefs = useRef<{ from?: FlatpickrApi; to?: FlatpickrApi }>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/production-plans");
      if (!res.ok) throw new Error("โหลดแผนการผลิตไม่สำเร็จ");
      const raw = await res.json();
      setAllPlans(normalizePlansPayload(raw));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setAllPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && dateFromPickerRef.current) {
      const fp1 = flatpickr(dateFromPickerRef.current, {
        dateFormat: "Y-m-d",
        onChange: (_d, dateStr) => setFilterDateFrom(dateStr),
      });
      const fp2 = flatpickr(dateToPickerRef.current!, {
        dateFormat: "Y-m-d",
        onChange: (_d, dateStr) => setFilterDateTo(dateStr),
      });
      flatpickrRefs.current = { from: fp1, to: fp2 };
      return () => {
        fp1.destroy();
        fp2.destroy();
        flatpickrRefs.current = {};
      };
    }
  }, [loading]);

  const stats = useMemo(() => {
    const s = { draft: 0, reserved: 0, confirmed: 0, cancelled: 0 };
    for (const p of allPlans) {
      if (p.status in s) s[p.status]++;
    }
    return { ...s, total: allPlans.length };
  }, [allPlans]);

  const filteredPlans = useMemo(() => {
    let list = [...allPlans];
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.planCode?.toLowerCase().includes(q) ||
          p.planName?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) {
      list = list.filter(
        (p) => p.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    if (filterDateFrom) {
      list = list.filter(
        (p) => p.planDate && new Date(p.planDate) >= new Date(filterDateFrom)
      );
    }
    if (filterDateTo) {
      list = list.filter(
        (p) => p.planDate && new Date(p.planDate) <= new Date(filterDateTo)
      );
    }
    if (filterTimeFrom) {
      list = list.filter((p) => {
        const t = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return t >= filterTimeFrom;
      });
    }
    if (filterTimeTo) {
      list = list.filter((p) => {
        const t = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return t <= filterTimeTo;
      });
    }
    list.sort((a, b) => {
      const da = new Date(a.planDate).getTime();
      const db = new Date(b.planDate).getTime();
      if (da !== db) return db - da;
      return (b.planCode || "").localeCompare(a.planCode || "", "th");
    });
    return list;
  }, [
    allPlans,
    searchTerm,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterTimeFrom,
    filterTimeTo,
  ]);

  const pagination = useMemo(() => {
    const total = filteredPlans.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;
    const slice = filteredPlans.slice(start, start + limit);
    return { total, totalPages, safePage, slice, start };
  }, [filteredPlans, page, limit]);

  const statusBadgeClass = (st: PlanStatus) => {
    if (st === "draft")
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400";
    if (st === "reserved")
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400";
    if (st === "confirmed")
      return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400";
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
  };

  const statCard = (label: string, value: number, accent: string) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );

  if (loading && allPlans.length === 0) {
    return (
      <div>
        <PageBreadcrumb pageTitle="ติดตามสถานะการผลิต" />
        <ComponentCard title="ติดตามสถานะการผลิต">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            กำลังโหลด...
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="ติดตามสถานะการผลิต" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                ติดตามสถานะการผลิต
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                สรุปและกรองแผนการผลิตทั้งหมด — ลำดับงานโดยทั่วไป:{" "}
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  ร่าง → จองแล้ว → ยืนยันแล้ว
                </span>
                {" "}
                แผนที่ยืนยันและจ่ายออกแล้ว เปิดจาก “ดูรายละเอียด” เพื่อติดตามล็อตผลิตตาม{" "}
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  ลำดับขั้นตอนผลิตของสินค้า
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCard("ทั้งหมด", stats.total, "text-gray-900 dark:text-white")}
          {statCard("ร่าง", stats.draft, "text-gray-700 dark:text-gray-300")}
          {statCard("จองแล้ว", stats.reserved, "text-orange-700 dark:text-orange-300")}
          {statCard(
            "ยืนยันแล้ว",
            stats.confirmed,
            "text-green-700 dark:text-green-300"
          )}
          {statCard("ยกเลิก", stats.cancelled, "text-red-700 dark:text-red-300")}
        </div>

        <ComponentCard
          title={`แผนการผลิต (แสดง ${pagination.total.toLocaleString()} จากทั้งหมด ${stats.total.toLocaleString()} แผน)`}
        >
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="ค้นหา (รหัสแผน, ชื่อแผน)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="draft">ร่าง</option>
                <option value="reserved">จองแล้ว</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterTimeFrom("");
                  setFilterTimeTo("");
                  clearFlatpickr(flatpickrRefs.current.from);
                  clearFlatpickr(flatpickrRefs.current.to);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center gap-2"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                ล้างตัวกรอง
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  วันที่เริ่มต้น
                </label>
                <div className="relative">
                  <input
                    ref={dateFromPickerRef}
                    type="text"
                    readOnly
                    value={filterDateFrom}
                    placeholder="เลือกวันที่"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  วันที่สิ้นสุด
                </label>
                <div className="relative">
                  <input
                    ref={dateToPickerRef}
                    type="text"
                    readOnly
                    value={filterDateTo}
                    placeholder="เลือกวันที่"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  เวลาเริ่มต้น
                </label>
                <TimePicker
                  value={filterTimeFrom}
                  onChange={(t) => setFilterTimeFrom(t)}
                  placeholder="เลือกเวลา"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  เวลาสิ้นสุด
                </label>
                <TimePicker
                  value={filterTimeTo}
                  onChange={(t) => setFilterTimeTo(t)}
                  placeholder="เลือกเวลา"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/pc/schedule"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                จัดงานล่วงหน้า
              </Link>
              <Link
                href="/pc/schedule/reservations"
                className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                แผนที่จองแล้ว
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                    รหัสแผน
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                    ชื่อแผน
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                    วันที่ / เวลา
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                    สินค้า
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pagination.slice.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    message="ไม่มีแผนที่ตรงกับตัวกรอง"
                  />
                ) : (
                  pagination.slice.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {plan.planCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {plan.planName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(plan.planDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.planTime
                            ? plan.planTime.substring(0, 5)
                            : "00:00"}{" "}
                          น.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(plan.status)}`}
                        >
                          {statusConfig[plan.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                        {plan.items?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={detailHref(plan)}
                          className="inline-flex px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded"
                        >
                          ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <PaginationFooter
              page={pagination.safePage}
              limit={limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              summaryLocale="th"
              summaryRange={{
                from: pagination.start + 1,
                to: Math.min(pagination.start + limit, pagination.total),
              }}
              hrefBuilder={paginationHref}
            />
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
