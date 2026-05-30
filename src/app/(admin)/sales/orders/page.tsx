"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import {
  fetchSalesOrders,
  exportOrdersToExcel,
  exportOrdersToPDF,
  type OrdersQuery,
  type Pagination,
  type SalesOrderListItem,
  type SalesOrderStatus,
} from "@/services/sales/salesOrderService";
import {
  STATUS_OPTIONS,
  baht,
  formatDate,
  statusBadge,
} from "@/app/(admin)/sales/_components/salesOrderUi";

type SortKey = "orderNo" | "orderDate" | "deliveryDate" | "grandTotal" | "status" | "createDate";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SalesOrdersPage() {
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SalesOrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("createDate");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  // debounce search keyword
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo<OrdersQuery>(
    () => ({
      search: debouncedSearch,
      status,
      dateFrom,
      dateTo,
      page,
      pageSize: 20,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, status, dateFrom, dateTo, page, sortBy, sortDir],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalesOrders(query);
      setItems(data.items);
      setPagination(data.pagination);
    } catch {
      setError("โหลดรายการออเดอร์ไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  // reset to first page เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateFrom, dateTo, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(key);
      setSortDir("ASC");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortBy === key ? (sortDir === "ASC" ? " ▲" : " ▼") : "";

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportOrdersToExcel(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-orders-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("ส่งออก Excel ไม่สำเร็จ");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportOrdersToPDF(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-orders-export-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("ส่งออก PDF ไม่สำเร็จ");
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="ออเดอร์ขาย" />

      <ComponentCard
        title="รายการออเดอร์ขาย"
        desc="ค้นหา กรอง และติดตามสถานะออเดอร์ทั้งหมด"
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            📥 Export Excel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            📄 Export PDF
          </button>
          <Link
            href="/sales/orders/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + สร้างออเดอร์
          </Link>
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ค้นหา (เลขออเดอร์ / ลูกค้า)
            </label>
            <input
              className={inputClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="เช่น SO-202605-0001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              สถานะ
            </label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as SalesOrderStatus | "")}
            >
              <option value="">ทั้งหมด</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              วันที่ตั้งแต่
            </label>
            <input
              type="date"
              className={inputClass}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ถึงวันที่
            </label>
            <input
              type="date"
              className={inputClass}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            พบ {pagination.total.toLocaleString("th-TH")} รายการ
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            ล้างตัวกรอง
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 font-medium"
                  onClick={() => toggleSort("orderNo")}
                >
                  เลขออเดอร์{sortIndicator("orderNo")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium"
                  onClick={() => toggleSort("orderDate")}
                >
                  วันที่สร้าง{sortIndicator("orderDate")}
                </th>
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th
                  className="cursor-pointer px-4 py-3 text-right font-medium"
                  onClick={() => toggleSort("grandTotal")}
                >
                  ยอดรวม{sortIndicator("grandTotal")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium"
                  onClick={() => toggleSort("deliveryDate")}
                >
                  วันจัดส่ง{sortIndicator("deliveryDate")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium"
                  onClick={() => toggleSort("status")}
                >
                  สถานะ{sortIndicator("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableEmptyRow colSpan={6} message="กำลังโหลด..." />
              ) : items.length === 0 ? (
                <TableEmptyRow colSpan={6} message="ไม่พบออเดอร์ตามเงื่อนไข" />
              ) : (
                items.map((order) => {
                  const badge = statusBadge(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/sales/orders/${order.id}`}
                          className="text-brand-500 hover:underline dark:text-brand-400"
                        >
                          {order.orderNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{formatDate(order.orderDate)}</td>
                      <td className="px-4 py-3">
                        {order.customer?.name ?? `#${order.customerId}`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {baht.format(Number(order.grandTotal) || 0)}
                      </td>
                      <td className="px-4 py-3">{formatDate(order.deliveryDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              หน้า {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                ก่อนหน้า
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
