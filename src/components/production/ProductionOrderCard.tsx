"use client";

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBox, faClipboardList, faQrcode } from "@fortawesome/free-solid-svg-icons";
import type { ProductionOrderDetail } from "@/types/production";

interface ProductionOrderCardProps {
  order: ProductionOrderDetail;
  showDeptBacklog?: boolean;
}

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

export function ProductionOrderCard({ order, showDeptBacklog = false }: ProductionOrderCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-700">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <FontAwesomeIcon icon={faBox} className="text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                {order.orderNo}
              </p>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                {order.product?.productCode}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                {order.product?.productName ?? `#${order.productId}`}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faClipboardList} className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-[10px] uppercase text-gray-500 dark:text-gray-500">จำนวน</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {order.orderQuantity.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faQrcode} className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-[10px] uppercase text-gray-500 dark:text-gray-500">ล็อต/QR</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {order.totalLots}
              </p>
            </div>
          </div>
        </div>

        {showDeptBacklog && (order.deptBacklogLotCount !== undefined || order.deptBacklogProcessCodes) ? (
          <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400">ล็อตคงค้าง</p>
                <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                  {order.deptBacklogLotCount ?? 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400">กระบวนการ</p>
                <p className="text-xs font-mono text-indigo-800 dark:text-indigo-200">
                  {(order.deptBacklogProcessCodes ?? []).join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Link
          href={`/production/production-orders/${order.id}`}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
        >
          <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          ดู / พิมพ์ QR
        </Link>
      </div>
    </div>
  );
}
