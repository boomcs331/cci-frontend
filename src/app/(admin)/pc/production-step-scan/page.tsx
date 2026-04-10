"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  PRODUCTION_CLOSE_STEP_BARCODES,
  advanceLotStep,
  decodeProductionLotQr,
  getLotRecord,
  isProductionCloseStepBarcode,
  labelsForRecord,
  maxStepForRecord,
  stepLabelForRecord,
  type ProductionLotRecord,
} from "@/utils/productionLotTracking";

type ScanStatus = "idle" | "ok" | "err";

export default function ProductionStepScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [line, setLine] = useState("");
  const [pending, setPending] = useState<ProductionLotRecord | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const setFeedback = useCallback((kind: ScanStatus, msg: string | null) => {
    setStatus(kind);
    setMessage(msg);
  }, []);

  const handleSubmit = useCallback(() => {
    const raw = line.trim();
    setLine("");
    if (!raw) return;

    if (isProductionCloseStepBarcode(raw)) {
      if (!pending) {
        setFeedback("err", "ยังไม่ได้สแกน QR ล็อตผลิต (CCI:PL:...) — สแกนล็อตก่อน แล้วค่อยยิงบาร์โค้ดปิดงาน");
        focusInput();
        return;
      }
      const before = pending.stepIndex;
      const after = advanceLotStep(pending.qrPayload);
      if (!after) {
        setFeedback("err", "ไม่สามารถอัปเดตขั้นตอนได้");
        focusInput();
        return;
      }
      setPending(after);
      if (after.stepIndex > before) {
        setFeedback(
          "ok",
          `ปิดงานแล้ว — เลื่อนเป็น: ${stepLabelForRecord(after, after.stepIndex)} (ขั้นที่ ${after.stepIndex + 1}/${labelsForRecord(after).length})`
        );
      } else {
        setFeedback(
          "err",
          `อยู่ขั้นสุดแล้ว — ${stepLabelForRecord(after, after.stepIndex)}`
        );
      }
      focusInput();
      return;
    }

    const decoded = decodeProductionLotQr(raw);
    if (decoded) {
      const rec = getLotRecord(raw);
      if (!rec) {
        setPending(null);
        setFeedback(
          "err",
          "ไม่พบข้อมูลล็อตในเครื่องนี้ — ให้สร้าง QR ล็อตจากแผนที่ยืนยันและจ่ายออกแล้วก่อน"
        );
        focusInput();
        return;
      }
      setPending(rec);
      setFeedback(
        "ok",
        `เลือกล็อตแล้ว — ขั้นปัจจุบัน: ${stepLabelForRecord(rec, rec.stepIndex)} (ขั้นที่ ${rec.stepIndex + 1}/${labelsForRecord(rec).length}) — ยิงบาร์โค้ดปิดงานเพื่อไปขั้นถัดไป`
      );
      focusInput();
      return;
    }

    setFeedback(
      "err",
      "ไม่รู้จักรูปแบบ — ใช้ QR ล็อต CCI:PL:แผน:รายการ:ลำดับล็อต หรือบาร์โค้ดปิดงานตามรายการด้านล่าง"
    );
    focusInput();
  }, [line, pending, focusInput, setFeedback]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="ยิงบาร์โค้ด — ปิดงานขั้นตอนผลิต" />
      <div className="space-y-6">
        <ComponentCard title="ยิงบาร์โค้ด (สายงานผลิต)">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            ขั้นตอน: (1) สแกน <span className="font-mono text-gray-800 dark:text-gray-200">QR ล็อตผลิต</span>{" "}
            รูปแบบ <span className="font-mono">CCI:PL:แผน:รายการสินค้า:ลำดับล็อต</span> — (2) เมื่อขั้นปัจจุบันทำเสร็จ ให้ยิง{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">บาร์โค้ดปิดงาน</span> เพื่อเลื่อนไปขั้นถัดไป
          </p>

          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            สแกนที่นี่ (Scanner ส่ง Enter อัตโนมัติ)
          </label>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="QR ล็อต หรือ บาร์โค้ดปิดงาน..."
            className="w-full h-14 rounded-lg border-2 border-emerald-600 dark:border-emerald-500 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg font-mono"
          />

          {message && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                status === "ok"
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800"
                  : status === "err"
                    ? "bg-red-50 text-red-900 dark:bg-red-900/25 dark:text-red-100 border border-red-200 dark:border-red-800"
                    : "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {message}
            </div>
          )}

          {pending && (
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ล็อตที่เลือก</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {pending.planCode} · {pending.productName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    ลำดับล็อต {pending.lotIndex + 1} · {pending.quantity.toLocaleString()} {pending.unit}
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-2 break-all">
                    {pending.qrPayload}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setFeedback("idle", null);
                    focusInput();
                  }}
                  className="shrink-0 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ล้างล็อตที่เลือก
                </button>
              </div>
              <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900/50 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">ขั้นตอน</p>
                <div className="flex flex-wrap gap-1">
                  {labelsForRecord(pending).map((label, idx) => (
                    <span
                      key={`${idx}-${label}`}
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        idx === pending.stepIndex
                          ? "bg-emerald-600 text-white"
                          : idx < pending.stepIndex
                            ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-100"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}. {label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  ปัจจุบัน: {stepLabelForRecord(pending, pending.stepIndex)}
                  {pending.stepIndex >= maxStepForRecord(pending) && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">(ขั้นสุดท้าย)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-white/50 dark:bg-gray-900/30">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              บาร์โค้ดปิดงาน (พิมพ์ติดสถานีงานได้)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              สแกนค่าตรงตัว (ไม่มีช่องว่างหน้า-หลัง) — ใช้หลังสแกน QR ล็อตแล้ว
            </p>
            <ul className="space-y-2 font-mono text-sm text-gray-800 dark:text-gray-200">
              {PRODUCTION_CLOSE_STEP_BARCODES.map((b) => (
                <li
                  key={b}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
