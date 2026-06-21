"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faFileExcel,
  faFilePdf,
  faIndustry,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import { PcTransactionPageHeader } from "@/components/pc/transactions/PcTransactionPageHeader";
import { PcTransactionActionButton } from "@/components/pc/transactions/PcTransactionActionButton";
import {
  PcTransactionFilterCard,
  PcFilterField,
  PcFilterSearchInput,
  INPUT_CLS,
} from "@/components/pc/transactions/PcTransactionFilterCard";
import { PcTransactionDataCard } from "@/components/pc/transactions/PcTransactionDataCard";
import { PcTransactionLoading } from "@/components/pc/transactions/PcTransactionLoading";
import { ProductionOrderCard } from "@/components/production/ProductionOrderCard";
import { fetchProductionOrders } from "@/services/productionOrdersService";
import { useClientHydrated } from "@/hooks/useClientHydrated";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getActiveDepartmentId,
  getUserDepartmentCode,
  isAdmin,
  SESSION_UPDATED_EVENT,
} from "@/utils/session";
import type { ProductionOrderDetail, ProductionOrderDeptBacklog } from "@/types/production";
import { exportPdf, exportXlsx, type ExportColumn } from "@/utils/export";

type StatusCategory = "inProgress" | "completed" | "cancelled";

function classifyStatus(status: string): StatusCategory {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("closed") || s.includes("เสร็จ")) {
    return "completed";
  }
  if (s.includes("cancel") || s.includes("ยกเลิก")) {
    return "cancelled";
  }
  return "inProgress";
}

function statusBadgeClass(status: string): string {
  const category = classifyStatus(status);
  if (category === "completed") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (category === "cancelled") {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
}

function ProductionOrdersPageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const statusFilter = (searchParams.get("status") || "").toLowerCase();
  const router = useRouter();

  const [data, setData] = useState<{
    orders: ProductionOrderDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    departmentScope?: ProductionOrderDeptBacklog | null;
  } | null>(null);
  const hydrated = useClientHydrated();
  const userDeptCode = hydrated ? getUserDepartmentCode() : null;
  const activeDeptId = hydrated ? getActiveDepartmentId() : null;
  const showAdminAll = hydrated ? isAdmin() : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listTick, setListTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  useEffect(() => {
    const onSessionUpdate = () => setListTick((t) => t + 1);
    window.addEventListener(SESSION_UPDATED_EVENT, onSessionUpdate);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, onSessionUpdate);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchProductionOrders(page, limit);
        if (!cancelled) {
          const normalized: typeof r = {
            orders: Array.isArray(r.orders) ? r.orders : Array.isArray((r as any).data) ? (r as any).data : [],
            total: r.total ?? 0,
            page: r.page ?? page,
            limit: r.limit ?? limit,
            totalPages: r.totalPages ?? 1,
            departmentScope: r.departmentScope ?? null,
          };
          setData(normalized);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, limit, hydrated, activeDeptId, listTick]);

  const filteredOrders = useMemo<ProductionOrderDetail[]>(() => {
    let orders = data?.orders ?? [];
    if (statusFilter) {
      orders = orders.filter((o) => (o.status || "").toLowerCase() === statusFilter);
    }
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(term) ||
          (o.product?.productCode ?? "").toLowerCase().includes(term) ||
          (o.product?.productName ?? "").toLowerCase().includes(term),
      );
    }
    return orders;
  }, [data?.orders, statusFilter, debouncedSearch]);

  const stats = useMemo(() => {
    const orders = data?.orders ?? [];
    return {
      total: orders.length,
      inProgress: orders.filter((o) => classifyStatus(o.status) === "inProgress").length,
      completed: orders.filter((o) => classifyStatus(o.status) === "completed").length,
      cancelled: orders.filter((o) => classifyStatus(o.status) === "cancelled").length,
    };
  }, [data?.orders]);

  const exportColumns = useMemo<ExportColumn<ProductionOrderDetail>[]>(
    () => [
      { header: "เลขที่", accessor: (o) => o.orderNo },
      { header: "รหัสสินค้า", accessor: (o) => o.product?.productCode ?? "" },
      {
        header: "ชื่อสินค้า",
        accessor: (o) => o.product?.productName ?? `#${o.productId}`,
      },
      { header: "จำนวน", accessor: (o) => o.orderQuantity },
      { header: "ล็อต/QR", accessor: (o) => o.totalLots },
      {
        header: "ล็อตค้าง (แผนก)",
        accessor: (o) => o.deptBacklogLotCount ?? "",
      },
      {
        header: "กระบวนการ",
        accessor: (o) => (o.deptBacklogProcessCodes ?? []).join(", "),
      },
      { header: "สถานะ", accessor: (o) => o.status },
    ],
    [],
  );

  const handleExportXlsx = () => {
    exportXlsx({
      filename: `production-orders_${new Date().toISOString().slice(0, 10)}`,
      columns: exportColumns,
      rows: filteredOrders,
    });
  };

  const handleExportPdf = () => {
    void exportPdf({
      filename: `production-orders_${new Date().toISOString().slice(0, 10)}`,
      columns: exportColumns,
      rows: filteredOrders,
    }).catch((e) => console.error(e));
  };

  const handleRefresh = () => {
    setListTick((t) => t + 1);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/production/production-orders?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(searchTerm || statusFilter || filterDateFrom || filterDateTo);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterDateFrom("");
    setFilterDateTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.set("page", "1");
    router.push(`/production/production-orders?${params.toString()}`);
  };

  if (loading) {
    return <PcTransactionLoading pageTitle="คำสั่งผลิต / QR ล็อต" variant="production" />;
  }

  return (
    <div className="w-full space-y-6 px-3 pb-8 sm:px-4 lg:px-6">
      <PcTransactionPageHeader
        variant="production"
        pageTitle="คำสั่งผลิต / QR ล็อต"
        description="ติดตามคำสั่งผลิต สถานะล็อต และ QR สำหรับแต่ละสินค้า"
        icon={<FontAwesomeIcon icon={faIndustry} />}
        stats={[
          { label: "ทั้งหมด", value: (data?.total ?? 0).toLocaleString() },
          { label: "กำลังผลิต", value: stats.inProgress.toLocaleString() },
          { label: "เสร็จสิ้น", value: stats.completed.toLocaleString() },
          { label: "ยกเลิก", value: stats.cancelled.toLocaleString() },
        ]}
        actions={
          <>
            <PcTransactionActionButton variant="production" tone="secondary" onClick={handleRefresh}>
              <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
              รีเฟรช
            </PcTransactionActionButton>
            <PcTransactionActionButton
              variant="production"
              tone="secondary"
              onClick={handleExportXlsx}
              disabled={filteredOrders.length === 0}
            >
              <FontAwesomeIcon icon={faFileExcel} className="h-4 w-4" />
              Export XLSX
            </PcTransactionActionButton>
            <PcTransactionActionButton
              variant="production"
              tone="secondary"
              onClick={handleExportPdf}
              disabled={filteredOrders.length === 0}
            >
              <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4" />
              Export PDF
            </PcTransactionActionButton>
          </>
        }
      />

      <PcTransactionFilterCard
        variant="production"
        hasActiveFilters={hasActiveFilters}
        onReset={hasActiveFilters ? clearFilters : undefined}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PcFilterField label="ค้นหา" className="sm:col-span-2 lg:col-span-1">
            <PcFilterSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="เลขที่คำสั่งผลิต, รหัสสินค้า, ชื่อสินค้า"
            />
          </PcFilterField>
          <PcFilterField label="สถานะ">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">ทุกสถานะ</option>
              <option value="inprogress">กำลังผลิต</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </PcFilterField>
          <PcFilterField label="วันที่เริ่ม">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={filterDateFrom ? dayjs(filterDateFrom) : null}
                onChange={(newValue) => setFilterDateFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.375rem', height: '40px' } },
                  },
                  popper: { sx: { zIndex: 999999 } },
                  dialog: { sx: { zIndex: 999999 } },
                }}
              />
            </LocalizationProvider>
          </PcFilterField>
          <PcFilterField label="วันที่สิ้นสุด">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={filterDateTo ? dayjs(filterDateTo) : null}
                onChange={(newValue) => setFilterDateTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.375rem', height: '40px' } },
                  },
                  popper: { sx: { zIndex: 999999 } },
                  dialog: { sx: { zIndex: 999999 } },
                }}
              />
            </LocalizationProvider>
          </PcFilterField>
        </div>
      </PcTransactionFilterCard>

      <PcTransactionDataCard
        variant="production"
        title={`รายการคำสั่งผลิต (${data?.total ?? 0})`}
        description="ค่าใน QR ล็อตใช้รูปแบบเดียวกับวัตถุดิบ: QR-{lotNo}-{timestamp}-{สุ่ม6ตัว}"
        toolbar={<PaginationSelector currentLimit={limit} />}
        footer={
          data ? (
            <PaginationFooter
              page={data.page}
              limit={data.limit}
              total={data.total}
              totalPages={data.totalPages}
              hrefBuilder={paginationHref}
              summaryLocale="th"
            />
          ) : null
        }
      >
        {data?.departmentScope?.filtered ? (
          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100">
            <p className="font-medium">
              {data.departmentScope.message ??
                `แสดงเฉพาะงานคงค้างของแผนก ${data.departmentScope.departmentCode ?? userDeptCode ?? "—"}`}
            </p>
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
              แสดงเฉพาะแผนกที่เลือกใช้งานตอน login
              {userDeptCode ? ` (${userDeptCode})` : ""}
              — ล็อตคงค้างในขั้นที่แผนกนี้รับผิดชอบ
            </p>
          </div>
        ) : showAdminAll ? (
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            
          </p>
        ) : null}

        {error && <div className="py-4 text-red-600 dark:text-red-400">{error}</div>}

        {!error && data ? (
          <>
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faClipboardList} className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">ไม่พบคำสั่งผลิต</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOrders.map((o) => (
                  <ProductionOrderCard
                    key={o.id}
                    order={o}
                    showDeptBacklog={data.departmentScope?.filtered}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </PcTransactionDataCard>
    </div>
  );
}

export default function ProductionOrdersListPage() {
  return (
    <Suspense
      fallback={
        <PcTransactionLoading pageTitle="คำสั่งผลิต / QR ล็อต" variant="production" />
      }
    >
      <ProductionOrdersPageContent />
    </Suspense>
  );
}
