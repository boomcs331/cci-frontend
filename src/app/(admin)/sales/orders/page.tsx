"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  SearchCard,
  FormField,
  DataTable,
  ActionButton,
  LoadingState,
  ErrorState,
  type Column,
} from "@/components/shared";
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

  const columns: Column<SalesOrderListItem>[] = [
    {
      key: 'orderNo',
      title: `เลขออเดอร์${sortIndicator('orderNo')}`,
      render: (value, row) => (
        <Link href={`/sales/orders/${row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
          {value}
        </Link>
      ),
    },
    {
      key: 'orderDate',
      title: `วันที่ออเดอร์${sortIndicator('orderDate')}`,
      render: (value) => formatDate(value),
    },
    {
      key: 'customerName',
      title: 'ลูกค้า',
    },
    {
      key: 'deliveryDate',
      title: `วันที่ส่ง${sortIndicator('deliveryDate')}`,
      render: (value) => value ? formatDate(value) : '-',
    },
    {
      key: 'grandTotal',
      title: `ยอดรวม${sortIndicator('grandTotal')}`,
      render: (value) => baht.format(Number(value) || 0),
    },
    {
      key: 'status',
      title: `สถานะ${sortIndicator('status')}`,
      render: (value) => {
        const badge = statusBadge(value);
        return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>;
      },
    },
  ];

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

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="รายการออเดอร์ขาย"
        description="ค้นหา กรอง และติดตามสถานะออเดอร์ทั้งหมด"
        actions={
          <div className="flex gap-2">
            <ActionButton variant="secondary" onClick={handleExportExcel}>
              📥 Export Excel
            </ActionButton>
            <ActionButton variant="secondary" onClick={handleExportPDF}>
              📄 Export PDF
            </ActionButton>
            <Link href="/sales/orders/new">
              <ActionButton variant="primary">
                + สร้างออเดอร์
              </ActionButton>
            </Link>
          </div>
        }
      />

      <SearchCard onReset={clearFilters}>
        <FormField
          label="ค้นหา (เลขออเดอร์ / ลูกค้า)"
          name="search"
          value={search}
          onChange={(value: string | number) => setSearch(String(value))}
          placeholder="เช่น SO-202605-0001"
        />
        <FormField
          label="สถานะ"
          name="status"
          type="select"
          value={status}
          onChange={(value: string | number) => setStatus(value as SalesOrderStatus | "")}
          options={STATUS_OPTIONS}
        />
        <FormField
          label="วันที่ตั้งแต่"
          name="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(value: string | number) => setDateFrom(String(value))}
        />
        <FormField
          label="ถึงวันที่"
          name="dateTo"
          type="date"
          value={dateTo}
          onChange={(value: string | number) => setDateTo(String(value))}
        />
      </SearchCard>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <ContentCard>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          พบ {pagination.total.toLocaleString("th-TH")} รายการ
        </p>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="ไม่พบออเดอร์ตามเงื่อนไข"
          rowKey="id"
        />
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              หน้า {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <ActionButton
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </ActionButton>
              <ActionButton
                variant="secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                ถัดไป
              </ActionButton>
            </div>
          </div>
        )}
      </ContentCard>
    </PageContainer>
  );
}
