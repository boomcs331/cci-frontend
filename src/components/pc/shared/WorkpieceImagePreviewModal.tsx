"use client";

import React, { useEffect } from "react";

export interface WorkpieceImagePreviewModalProps {
  open: boolean;
  src: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export default function WorkpieceImagePreviewModal({
  open,
  src,
  title = "รูปชิ้นงาน",
  subtitle,
  onClose,
}: WorkpieceImagePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex animate-cci-backdrop-in items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-cci-modal-in max-h-[90vh] max-w-3xl w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-cci-popup dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center bg-gray-50 p-4 dark:bg-gray-900/50">
          <img
            src={src}
            alt={title}
            className="max-h-[min(70vh,560px)] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}
