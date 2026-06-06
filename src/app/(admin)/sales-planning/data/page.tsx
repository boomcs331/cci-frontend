"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, LoadingState } from "@/components/shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";

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

  if (loading) {
    return <LoadingState message="กำลังโหลด..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="ข้อมูลแผนการขาย"
        description={`ทั้งหมด ${filteredRows.length} รายการ`}
      />
      <ContentCard>
        <div className="mb-5 space-y-4 rounded-2xl border border-indigo-100/70 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20 p-4 shadow-sm dark:border-gray-700/90 dark:from-gray-900 dark:via-gray-900/80 dark:to-indigo-950/20 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  ปี {year + 543}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="รหัสลูกค้า"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="รหัสสินค้า"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth(new Date().getMonth() + 1);
                setCustomerFilter("");
                setProductFilter("");
                setSearchTerm("");
              }}
              className="h-11 w-full rounded-xl border border-slate-600 bg-gradient-to-b from-slate-600 to-slate-700 px-4 text-sm font-medium text-white shadow-sm hover:from-slate-500 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              <FontAwesomeIcon icon={faRotateRight} className="mr-2 h-4 w-4" />
              ล้างตัวกรอง
            </button>
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
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
      </ContentCard>
    </PageContainer>
  );
}
