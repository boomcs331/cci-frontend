"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { ProductionOrderDetail, ProductionOrderLot } from "@/types/production";

type ProductionSplitLotModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (releasedQuantity: number, reason: string) => void | Promise<void>;
  lot: ProductionOrderLot;
  order: ProductionOrderDetail;
  isFirstProcessStep: boolean;
  busy?: boolean;
  externalError?: string | null;
};

export default function ProductionSplitLotModal({
  isOpen,
  onClose,
  onConfirm,
  lot,
  order,
  isFirstProcessStep,
  busy = false,
  externalError = null,
}: ProductionSplitLotModalProps) {
  const [splitQty, setSplitQty] = useState("");
  const [splitReason, setSplitReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const lotQty = Number(lot.quantity);

  useEffect(() => {
    if (isOpen) {
      setSplitQty("");
      setSplitReason("");
      setValidationError(null);
    }
  }, [isOpen]);

  const releasedNum = Number(splitQty);
  const remainingPreview = useMemo(() => {
    if (!Number.isFinite(releasedNum) || releasedNum <= 0) return null;
    if (releasedNum >= lotQty) return null;
    return lotQty - releasedNum;
  }, [releasedNum, lotQty]);

  const handleConfirm = () => {
    const qty = Number(splitQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setValidationError("กรุณากรอกจำนวนที่ปล่อยไปขั้นถัดไป (มากกว่า 0)");
      return;
    }
    if (qty >= lotQty) {
      setValidationError("จำนวนที่ปล่อยต้องน้อยกว่าจำนวนล็อตทั้งหมด");
      return;
    }
    const reason = splitReason.trim();
    if (!reason) {
      setValidationError("กรุณากรอกหมายเหตุ (บังคับ)");
      return;
    }
    setValidationError(null);
    void onConfirm(qty, reason);
  };

  const displayError = validationError || externalError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      showCloseButton={!busy}
      className="!max-w-lg !p-0 overflow-hidden"
    >
      <div className="shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white">
        <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
          แบ่งล็อต
        </p>
        <h3 className="text-lg font-bold">ยืนยันแบ่งล็อต</h3>
        <p className="text-sm text-white/90 mt-0.5 font-mono">{lot.lotNo}</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/50 px-4 py-3 text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">ใบสั่งผลิต</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {order.orderNo}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">สินค้า</span>
            <span className="text-right text-gray-900 dark:text-white">
              {order.product?.productCode}
              {order.product?.productName
                ? ` — ${order.product.productName}`
                : ""}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">จำนวนล็อตปัจจุบัน</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {lotQty.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">สถานะ</span>
            <span className="text-gray-900 dark:text-white">{lot.status}</span>
          </div>
        </div>

        <p className="text-sm text-violet-900 dark:text-violet-100 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3 py-2 leading-relaxed">
          แบ่งเป็น 2 ล็อตย่อย — จำนวนที่กรอกจะปิดขั้นปัจจุบันแล้วส่งไป
          <strong>ขั้นถัดไป</strong> ส่วนที่เหลือ<strong>คงขั้นปัจจุบัน</strong>
          <br />
          {isFirstProcessStep ? (
            <>
              <strong>ขั้นตอนแรก:</strong> ส่วนที่ไปขั้นถัดไปใช้ <strong>QR เดิม</strong>
              — ส่วนคงเหลือได้ <strong>QR ใหม่</strong> (รอเริ่มที่ขั้นแรก)
            </>
          ) : (
            <>
              <strong>ขั้นตอนทั่วไป:</strong> <strong>ยกเลิก QR เดิม</strong> ของล็อตแม่
              — ล็อตย่อยทั้งคู่ได้ QR ใหม่
            </>
          )}
          <br />
          ขั้นตอนที่ปิดงานแล้วก่อนหน้าจะถูก<strong>สืบทอด</strong>ไปทั้ง 2 ล็อตย่อย
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="split-lot-qty"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
            >
              จำนวนที่ปล่อยไปขั้นถัดไป <span className="text-red-500">*</span>
            </label>
            <input
              id="split-lot-qty"
              type="number"
              min={0}
              step="any"
              max={Math.max(lotQty - 0.0001, 0)}
              value={splitQty}
              onChange={(e) => {
                setSplitQty(e.target.value);
                setValidationError(null);
              }}
              disabled={busy}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="split-lot-reason"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
            >
              หมายเหตุ <span className="text-red-500">*</span>
            </label>
            <input
              id="split-lot-reason"
              type="text"
              value={splitReason}
              onChange={(e) => {
                setSplitReason(e.target.value);
                setValidationError(null);
              }}
              disabled={busy}
              placeholder="ระบุเหตุผลการแบ่งล็อต"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
        </div>

        {remainingPreview != null ? (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            คงเหลือในล็อตนี้หลังแบ่ง:{" "}
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {remainingPreview.toLocaleString()}
            </span>
          </p>
        ) : null}

        {displayError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 justify-end border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 shadow-sm"
        >
          {busy ? "กำลังแบ่งล็อต..." : "ยืนยันแบ่งล็อต"}
        </button>
      </div>
    </Modal>
  );
}
