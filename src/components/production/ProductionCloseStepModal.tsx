"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { processStepDisplayName } from "@/utils/productionProcessDisplay";
import type { LotStationPayload } from "@/types/productionLotStation";
import type { ProductionOrderLot } from "@/types/production";

type ProductionCloseStepModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void | Promise<void>;
  lot: ProductionOrderLot;
  station: LotStationPayload;
  stepLabel: string;
  busy?: boolean;
};

export default function ProductionCloseStepModal({
  isOpen,
  onClose,
  onConfirm,
  lot,
  station,
  stepLabel,
  busy = false,
}: ProductionCloseStepModalProps) {
  const [remarks, setRemarks] = useState("");

  const isStartAndComplete = station.nextAction === "start";

  useEffect(() => {
    if (isOpen) setRemarks("");
  }, [isOpen]);

  const activeProcess =
    station.nextAction === "complete" && station.inProgress
      ? station.inProgress
      : station.expectedProcess;

  const processDisplay = activeProcess
    ? processStepDisplayName(
        activeProcess.processCode,
        activeProcess.processName,
      )
    : stepLabel;

  const title = isStartAndComplete
    ? "เริ่มและปิดขั้นตอน"
    : "ยืนยันปิดขั้นตอน";

  const handleConfirm = () => {
    void onConfirm(remarks.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      showCloseButton={!busy}
      className="!max-w-lg !p-0 overflow-hidden"
    >
      <div className="shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white">
        <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
          ปิดขั้นตอนผลิต
        </p>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-white/90 mt-0.5 font-mono">{lot.lotNo}</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/50 px-4 py-3 text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">ขั้นตอน</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right">
              {processDisplay}
            </span>
          </div>
          {activeProcess?.processCode ? (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">รหัสขั้น</span>
              <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                {activeProcess.processCode}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">ใบสั่งผลิต</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {station.orderNo || lot.orderLotLabel || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">สินค้า</span>
            <span className="text-right text-gray-900 dark:text-white">
              {station.productCode}
              {station.productName ? ` — ${station.productName}` : ""}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">จำนวนล็อต</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {lot.quantity}
            </span>
          </div>
          {station.inProgress?.startTime ? (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">เริ่มเมื่อ</span>
              <span className="text-xs text-gray-800 dark:text-gray-200">
                {new Date(station.inProgress.startTime).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          ) : null}
        </div>

        {isStartAndComplete ? (
          <p className="text-sm text-amber-800 dark:text-amber-200 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
            ระบบจะเริ่มขั้นตอน <strong>{processDisplay}</strong> แล้วปิดทันทีในครั้งเดียว
          </p>
        ) : null}

        {station.denyReason && !station.canComplete && station.nextAction === "complete" ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">{station.denyReason}</p>
        ) : null}

        <div>
          <label
            htmlFor="close-step-remarks"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
          >
            หมายเหตุ (ถ้ามี)
          </label>
          <textarea
            id="close-step-remarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={busy}
            placeholder="บันทึกหมายเหตุเพิ่มเติม..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
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
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 shadow-sm"
        >
          {busy ? "กำลังบันทึก..." : isStartAndComplete ? "เริ่มและปิดขั้นตอน" : "ยืนยันปิดขั้นตอน"}
        </button>
      </div>
    </Modal>
  );
}
