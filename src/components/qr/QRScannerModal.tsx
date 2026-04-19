"use client";

import React, { useEffect } from "react";
import { QrCodeLookupPanel } from "@/components/qr/QrCodeLookupPanel";
import { useAdminOverlay } from "@/context/AdminOverlayContext";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** ข้อความเพิ่มเติมใต้หัวข้อ (เช่น หน้า /pc/outcome เน้นตรวจล็อตวัตถุดิบก่อนจ่ายออก) */
  contextHint?: string;
}

export default function QRScannerModal({ isOpen, onClose, contextHint }: QRScannerModalProps) {
  const { registerFullscreenOverlay } = useAdminOverlay();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    registerFullscreenOverlay(true);
    return () => registerFullscreenOverlay(false);
  }, [isOpen, registerFullscreenOverlay]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="max-h-[min(94vh,920px)] w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scanner-modal-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h3 id="qr-scanner-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              ตรวจสอบ QR Code
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              กรอก วาง หรือยิงจากเครื่องอ่านบาร์โค้ด — กด Enter หรือปุ่มตรวจสอบ
            </p>
            {contextHint ? (
              <p className="mt-2 rounded-lg border border-blue-light-200 bg-blue-light-50 px-3 py-2 text-xs text-blue-light-900 dark:border-blue-light-800/50 dark:bg-blue-light-950/25 dark:text-blue-light-100">
                {contextHint}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="ปิด"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "min(calc(94vh - 88px), 832px)" }}
        >
          <QrCodeLookupPanel active={isOpen} instanceId="modal" hideContextHint showUsageHint={false} />
        </div>
      </div>
    </div>
  );
}
