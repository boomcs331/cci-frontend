"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import {
  approveSalesOrder,
  fetchPendingApprovals,
  rejectSalesOrder,
  type SalesOrderListItem,
} from "@/services/sales/salesOrderService";
import {
  baht,
  formatDate,
  statusBadge,
} from "@/app/(admin)/sales/_components/salesOrderUi";

export default function SalesApprovalsPage() {
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingApprovals({ page: 1, pageSize: 50 });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveSalesOrder(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อนุมัติไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("เหตุผลการปฏิเสธ");
    if (!reason?.trim()) return;
    setBusyId(id);
    try {
      await rejectSalesOrder(id, reason.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ปฏิเสธไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="รออนุมัติออเดอร์" />

      <ComponentCard
        title="คิวอนุมัติ"
        desc="ออเดอร์ที่ส่งคำขอแล้ว รอหัวหน้าอนุมัติ"
      >
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">เลขออเดอร์</th>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3 text-right">ยอดรวม</th>
                <th className="px-4 py-3">วันจัดส่ง</th>
                <th className="px-4 py-3">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableEmptyRow colSpan={5} message="กำลังโหลด..." />
              ) : items.length === 0 ? (
                <TableEmptyRow colSpan={5} message="ไม่มีออเดอร์รออนุมัติ" />
              ) : (
                items.map((order) => {
                  const badge = statusBadge(order.status);
                  const busy = busyId === order.id;
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/sales/orders/${order.id}`}
                          className="font-medium text-brand-500 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.customer?.name ?? order.customerId}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {baht.format(Number(order.grandTotal) || 0)}
                      </td>
                      <td className="px-4 py-3">{formatDate(order.deliveryDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleApprove(order.id)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs text-white hover:bg-brand-600 disabled:opacity-50"
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleReject(order.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
}
