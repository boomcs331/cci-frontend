"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface PlanningRow {
  id: number;
  customerCode: string;
  customerName?: string;
  productCode: string;
  productName?: string;
  model?: string;
  saleDate: string;
  quantity: number;
}

export default function SalesPlanningDataPage() {
  const [rows, setRows] = useState<PlanningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customerFilter, setCustomerFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: "มกราคม" },
    { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" },
    { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" },
    { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" },
    { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" },
    { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" },
    { value: 12, label: "ธันวาคม" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const data = await fetchPlanningData({
      //   year: selectedYear,
      //   month: selectedMonth,
      //   customerCode: customerFilter,
      //   productCode: productFilter,
      //   skip: (page - 1) * pageSize,
      //   take: pageSize,
      // });
      setRows([]);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, customerFilter, productFilter, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExport = async () => {
    try {
      // TODO: Implement export
      console.log("Export data");
    } catch {
      setError("Export ไม่สำเร็จ");
    }
  };

  const filteredRows = rows.filter((row) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        row.customerCode.toLowerCase().includes(search) ||
        row.productCode.toLowerCase().includes(search) ||
        (row.model && row.model.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const groupedByCustomer = paginatedRows.reduce((acc, row) => {
    if (!acc[row.customerCode]) {
      acc[row.customerCode] = [];
    }
    acc[row.customerCode].push(row);
    return acc;
  }, {} as Record<string, PlanningRow[]>);

  return (
    <div>
      <PageBreadcrumb pageTitle="ข้อมูลแผนการขาย" />

      <ComponentCard
        title="ข้อมูลแผนการขายรายวัน"
        desc="ดูและจัดการข้อมูลแผนการขายสินค้า"
      >
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ปี
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={inputClass}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year + 543} (ค.ศ. {year})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              เดือน
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={inputClass}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ลูกค้า
            </label>
            <input
              type="text"
              placeholder="รหัสลูกค้า"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              สินค้า
            </label>
            <input
              type="text"
              placeholder="รหัสสินค้า"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            แสดง {paginatedRows.length} จาก {filteredRows.length} รายการ
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              📥 Export Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium">รุ่น</th>
                <th className="px-4 py-3 font-medium">วันที่</th>
                <th className="px-4 py-3 font-medium text-right">จำนวน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableEmptyRow colSpan={5} message="กำลังโหลด..." />
              ) : paginatedRows.length === 0 ? (
                <TableEmptyRow colSpan={5} message="ไม่พบข้อมูล" />
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium">{row.customerCode}</td>
                    <td className="px-4 py-3">{row.productCode}</td>
                    <td className="px-4 py-3">{row.model || "-"}</td>
                    <td className="px-4 py-3">
                      {new Date(row.saleDate).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {row.quantity.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                แสดง:
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                หน้า {page} จาก {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
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
