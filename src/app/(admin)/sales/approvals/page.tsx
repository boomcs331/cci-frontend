"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader, ContentCard, BaseModal, ActionButton, LoadingState } from "@/components/shared";
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
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);

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
    setRejectModal({ id, reason: "" });
  };

  const confirmReject = async () => {
    if (!rejectModal?.reason?.trim()) return;
    setBusyId(rejectModal.id);
    try {
      await rejectSalesOrder(rejectModal.id, rejectModal.reason.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ปฏิเสธไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setRejectModal(null);
    }
  };

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="รออนุมัติออเดอร์"
        description={`ทั้งหมด ${items.length} รายการ`}
      />

      <ContentCard title="คิวอนุมัติ">
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีออเดอร์รออนุมัติ
                  </td>
                </tr>
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
                          <ActionButton
                            variant="primary"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleApprove(order.id)}
                          >
                            อนุมัติ
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleReject(order.id)}
                          >
                            ปฏิเสธ
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {rejectModal && (
        <BaseModal
          isOpen={rejectModal !== null}
          onClose={() => setRejectModal(null)}
          title="ปฏิเสธออเดอร์"
          size="sm"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เหตุผลการปฏิเสธ
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full h-24 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="ระบุเหตุผล..."
            />
          </div>
          <div className="flex gap-3">
            <ActionButton
              variant="danger"
              onClick={confirmReject}
              disabled={!rejectModal.reason.trim()}
              className="flex-1"
            >
              ยืนยันปฏิเสธ
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setRejectModal(null)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </BaseModal>
      )}
    </PageContainer>
  );
}
