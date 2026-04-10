"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { fetchProductionOrders } from "@/services/productionOrdersService";
import type { ProductionOrderDetail } from "@/types/production";

export default function ProductionOrdersListPage() {
  const [data, setData] = useState<{
    orders: ProductionOrderDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchProductionOrders(page, limit);
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div>
      <PageBreadcrumb pageTitle="คำสั่งผลิต / QR ล็อต" />
      <ComponentCard title="รายการคำสั่งผลิต">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ค่าใน QR ล็อตใช้รูปแบบเดียวกับวัตถุดิบ:{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            QR-{"{"}lotNo{"}"}-{"{"}timestamp{"}"}-{"{"}สุ่ม6ตัว{"}"}
          </code>
        </p>
        {loading && <div className="py-8 text-center text-gray-500">กำลังโหลด...</div>}
        {error && <div className="py-4 text-red-600 dark:text-red-400">{error}</div>}
        {!loading && data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left">เลขที่</th>
                    <th className="px-3 py-2 text-left">สินค้า</th>
                    <th className="px-3 py-2 text-right">จำนวน</th>
                    <th className="px-3 py-2 text-center">ล็อต/QR</th>
                    <th className="px-3 py-2 text-center">สถานะ</th>
                    <th className="px-3 py-2 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 font-mono">{o.orderNo}</td>
                      <td className="px-3 py-2">
                        {o.product?.productCode} — {o.product?.productName ?? `#${o.productId}`}
                      </td>
                      <td className="px-3 py-2 text-right">{o.orderQuantity}</td>
                      <td className="px-3 py-2 text-center">{o.totalLots}</td>
                      <td className="px-3 py-2 text-center">{o.status}</td>
                      <td className="px-3 py-2 text-center">
                        <Link
                          href={`/production/production-orders/${o.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          ดู / พิมพ์ QR
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  ทั้งหมด {data.total} รายการ
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="px-2 py-1">
                    {page} / {data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ComponentCard>
    </div>
  );
}
