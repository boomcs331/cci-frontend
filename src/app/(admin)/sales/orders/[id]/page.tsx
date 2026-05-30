"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  advanceSalesOrderStatus,
  approveSalesOrder,
  cancelSalesOrder,
  fetchSalesOrder,
  rejectSalesOrder,
  submitSalesOrder,
  type SalesOrderDetail,
  type SalesOrderStatus,
} from "@/services/sales/salesOrderService";
import {
  baht,
  formatDate,
  formatDateTime,
  statusBadge,
} from "@/app/(admin)/sales/_components/salesOrderUi";
import { PERMISSIONS, hasPermission } from "@/constants/permissions";
import { getUserPermissions } from "@/utils/session";

const btnPrimary =
  "rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";
const btnOutline =
  "rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 disabled:opacity-50";
const btnDanger =
  "rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50";

export default function SalesOrderDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const permissions = getUserPermissions();

  const [order, setOrder] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await fetchSalesOrder(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (fn: () => Promise<SalesOrderDetail>) => {
    setBusy(true);
    setError(null);
    try {
      setOrder(await fn());
      setShowReject(false);
      setRejectReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายละเอียดออเดอร์" />
        <p className="text-sm text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายละเอียดออเดอร์" />
        <p className="text-rose-600">{error ?? "ไม่พบออเดอร์"}</p>
        <Link href="/sales/orders" className="mt-4 inline-block text-sm text-brand-500">
          ← กลับรายการ
        </Link>
      </div>
    );
  }

  const badge = statusBadge(order.status);
  const canApprove = hasPermission(permissions, PERMISSIONS.SALES_ORDER_APPROVE);
  const canUpdate = hasPermission(permissions, PERMISSIONS.SALES_ORDER_UPDATE);
  const canCreate = hasPermission(permissions, PERMISSIONS.SALES_ORDER_CREATE);

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {order.status === "DRAFT" && canCreate && (
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() => void runAction(() => submitSalesOrder(id))}
        >
          ส่งคำขอขาย
        </button>
      )}
      {order.status === "PENDING" && canApprove && (
        <>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy}
            onClick={() => void runAction(() => approveSalesOrder(id))}
          >
            อนุมัติ
          </button>
          <button
            type="button"
            className={btnDanger}
            disabled={busy}
            onClick={() => setShowReject((v) => !v)}
          >
            ปฏิเสธ
          </button>
        </>
      )}
      {order.status === "APPROVED" && canUpdate && (
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() =>
            void runAction(() => advanceSalesOrderStatus(id, "PROCESSING"))
          }
        >
          เริ่มจัดสินค้า
        </button>
      )}
      {order.status === "PROCESSING" && canUpdate && (
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() =>
            void runAction(() => advanceSalesOrderStatus(id, "SHIPPING"))
          }
        >
          ตัดสต็อก / จัดส่ง
        </button>
      )}
      {order.status === "SHIPPING" && canUpdate && (
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() =>
            void runAction(() => advanceSalesOrderStatus(id, "COMPLETED"))
          }
        >
          ยืนยันส่งสำเร็จ
        </button>
      )}
      {["DRAFT", "PENDING", "APPROVED", "PROCESSING"].includes(order.status) &&
        canUpdate && (
          <button
            type="button"
            className={btnOutline}
            disabled={busy}
            onClick={() => {
              const reason = window.prompt("เหตุผลการยกเลิก (ถ้ามี)") ?? "";
              void runAction(() => cancelSalesOrder(id, reason || undefined));
            }}
          >
            ยกเลิกออเดอร์
          </button>
        )}
    </div>
  );

  return (
    <div>
      <PageBreadcrumb pageTitle={`ออเดอร์ ${order.orderNo}`} />

      <div className="mb-4">
        <Link
          href="/sales/orders"
          className="text-sm text-brand-500 hover:underline"
        >
          ← กลับรายการออเดอร์
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <ComponentCard title="ข้อมูลออเดอร์">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">เลขออเดอร์</p>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {order.orderNo}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">สถานะ</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">ลูกค้า</p>
            <p className="font-medium">{order.customer?.name ?? order.customerId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ยอดรวม</p>
            <p className="font-medium tabular-nums">
              {baht.format(Number(order.grandTotal) || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">วันที่สร้าง</p>
            <p>{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">วันจัดส่ง</p>
            <p>{formatDate(order.deliveryDate)}</p>
          </div>
          {order.salesChannel && (
            <div>
              <p className="text-xs text-gray-500">ช่องทางขาย</p>
              <p>{order.salesChannel}</p>
            </div>
          )}
          {order.note && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">หมายเหตุ</p>
              <p>{order.note}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          {actionButtons}
          {showReject && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  เหตุผลการปฏิเสธ (บังคับ)
                </label>
                <input
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={btnDanger}
                disabled={busy || !rejectReason.trim()}
                onClick={() =>
                  void runAction(() => rejectSalesOrder(id, rejectReason.trim()))
                }
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          )}
        </div>
      </ComponentCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ComponentCard title="รายการสินค้า">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">สินค้า</th>
                  <th className="px-3 py-2 text-right">จำนวน</th>
                  <th className="px-3 py-2 text-right">ราคา</th>
                  <th className="px-3 py-2 text-right">ส่วนลด</th>
                  <th className="px-3 py-2 text-right">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      {item.product?.productName ?? `#${item.productId}`}
                      {item.product?.productCode && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({item.product.productCode})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {baht.format(Number(item.unitPrice) || 0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {baht.format(Number(item.discount) || 0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {baht.format(Number(item.lineTotal) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>

        <ComponentCard title="ประวัติสถานะ">
          <ul className="space-y-3">
            {order.history?.map((h) => (
              <li
                key={h.id}
                className="border-l-2 border-brand-300 pl-3 text-sm dark:border-brand-500/50"
              >
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {h.fromStatus ? `${h.fromStatus} → ` : ""}
                  {h.toStatus}
                </p>
                {h.reason && (
                  <p className="text-gray-600 dark:text-gray-400">{h.reason}</p>
                )}
                <p className="text-xs text-gray-400">
                  {formatDateTime(h.changedAt)}
                  {h.changedBy ? ` · ${h.changedBy}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </ComponentCard>
      </div>

      {order.stockMovements && order.stockMovements.length > 0 && (
        <div className="mt-6">
          <ComponentCard title="การเคลื่อนไหวสต็อก">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-right">จำนวน</th>
                  <th className="px-3 py-2 text-left">หมายเหตุ</th>
                  <th className="px-3 py-2 text-left">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.stockMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-medium">{m.movement}</td>
                    <td className="px-3 py-2 text-right">{m.quantity}</td>
                    <td className="px-3 py-2">{m.note ?? "-"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDateTime(m.createDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
