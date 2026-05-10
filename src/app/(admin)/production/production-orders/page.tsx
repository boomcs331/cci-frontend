"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { fetchProductionOrders } from "@/services/productionOrdersService";
import type { ProductionOrderDetail } from "@/types/production";
import { exportPdf, exportXlsx, type ExportColumn } from "@/utils/export";

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("closed") || s.includes("เสร็จ")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (s.includes("cancel") || s.includes("ยกเลิก")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  if (s.includes("progress") || s.includes("active") || s.includes("open") || s.includes("กำลัง")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}

function ProductionOrdersPageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const statusFilter = (searchParams.get("status") || "").toLowerCase();

  const [data, setData] = useState<{
    orders: ProductionOrderDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchProductionOrders(page, limit);
        if (!cancelled) {
          // backend คืน { orders, total, page, limit, totalPages }
          // ถ้า key ไม่ตรงให้ fallback เป็น array ว่าง
          const normalized: typeof r = {
            orders: Array.isArray(r.orders) ? r.orders : Array.isArray((r as any).data) ? (r as any).data : [],
            total: r.total ?? 0,
            page: r.page ?? page,
            limit: r.limit ?? limit,
            totalPages: r.totalPages ?? 1,
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
  }, [page, limit]);

  const filteredOrders = useMemo<ProductionOrderDetail[]>(() => {
    const orders = data?.orders ?? [];
    if (!statusFilter) return orders;
    return orders.filter((o) => (o.status || "").toLowerCase() === statusFilter);
  }, [data?.orders, statusFilter]);

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
    exportPdf({
      filename: `production-orders_${new Date().toISOString().slice(0, 10)}`,
      columns: exportColumns,
      rows: filteredOrders,
    });
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="คำสั่งผลิต / QR ล็อต" />
        <ComponentCard title="รายการคำสั่งผลิต">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="คำสั่งผลิต / QR ล็อต" />
      <div className="space-y-6">
        <ComponentCard title={`รายการคำสั่งผลิต (${data?.total ?? 0})`}>
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex flex-wrap items-center gap-2">
              {statusFilter ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  กรองสถานะ: {statusFilter}
                  <Link
                    href="/production/production-orders"
                    className="text-[10px] underline text-blue-700 hover:text-blue-900 dark:text-blue-300"
                  >
                    ล้าง
                  </Link>
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleExportXlsx}
                disabled={filteredOrders.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/60"
              >
                Export XLSX
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={filteredOrders.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/60"
              >
                Export PDF
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            ค่าใน QR ล็อตใช้รูปแบบเดียวกับวัตถุดิบ:{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              QR-{"{"}lotNo{"}"}-{"{"}timestamp{"}"}-{"{"}สุ่ม6ตัว{"}"}
            </code>
          </p>

          {error && <div className="py-4 text-red-600 dark:text-red-400">{error}</div>}

          {!error && data && filteredOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-max w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        เลขที่
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        สินค้า
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        จำนวน
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        ล็อต/QR
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-800">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white whitespace-nowrap">
                          {o.orderNo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <span className="whitespace-nowrap font-medium">{o.product?.productCode}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {" "}
                            — {o.product?.productName ?? `#${o.productId}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white whitespace-nowrap">
                          {o.orderQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white whitespace-nowrap">
                          {o.totalLots}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${statusBadgeClass(o.status)}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-gray-900">
                          <Link
                            href={`/production/production-orders/${o.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ดู / พิมพ์ QR
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                page={data.page}
                limit={data.limit}
                total={data.total}
                totalPages={data.totalPages}
              />
            </>
          ) : !error ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">ไม่พบคำสั่งผลิต</div>
          ) : null}
        </ComponentCard>
      </div>
    </div>
  );
}

export default function ProductionOrdersListPage() {
  return (
    <Suspense
      fallback={
        <div>
          <PageBreadcrumb pageTitle="คำสั่งผลิต / QR ล็อต" />
          <ComponentCard title="รายการคำสั่งผลิต">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
          </ComponentCard>
        </div>
      }
    >
      <ProductionOrdersPageContent />
    </Suspense>
  );
}
