"use client";

import React, { useEffect, useRef, useState } from "react";
import WorkpieceImage from "@/components/pc/shared/WorkpieceImage";
import { productImageUrl } from "@/utils/productImage";

type Props = {
  label?: string;
  /** Path จาก API หลังบันทึกแล้ว */
  savedPath?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** ลบรูปที่บันทึกแล้ว (ส่ง null ตอน PATCH) */
  onClearSaved?: () => void;
  required?: boolean;
};

export default function ProductImageField({
  label = "รูปภาพสินค้า",
  savedPath,
  file,
  onFileChange,
  onClearSaved,
  required = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpenSrc, setPreviewOpenSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displaySrc = previewUrl ?? productImageUrl(savedPath);
  const hasImage = Boolean(displaySrc);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="flex flex-wrap items-start gap-4">
        <WorkpieceImage
          path={previewUrl ? null : savedPath}
          src={previewUrl}
          alt="รูปสินค้า"
          size="lg"
          onPreview={hasImage ? (src) => setPreviewOpenSrc(src) : undefined}
        />
        <div className="flex flex-col gap-2 min-w-[200px]">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onFileChange(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
          >
            {hasImage ? "เปลี่ยนรูป" : "เลือกรูป"}
          </button>
          {(file || savedPath) && (
            <button
              type="button"
              onClick={() => {
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
                onClearSaved?.();
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            >
              ลบรูป
            </button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPEG, PNG, WebP — ไม่เกิน 5 MB
          </p>
        </div>
      </div>
      {previewOpenSrc && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpenSrc(null)}
          role="presentation"
        >
          <img
            src={previewOpenSrc}
            alt="รูปสินค้าขยาย"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
