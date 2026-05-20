"use client";

import React, { useState } from "react";
import { workpieceImageUrl } from "@/utils/workpieceImage";

type WorkpieceImageSize = "sm" | "md" | "lg";

const sizeClass: Record<WorkpieceImageSize, string> = {
  sm: "h-12 w-12",
  md: "h-24 w-24",
  lg: "h-40 w-40 max-w-full",
};

export interface WorkpieceImageProps {
  path?: string | null;
  /** Direct URL (e.g. blob preview) — takes priority over path */
  src?: string | null;
  alt?: string;
  size?: WorkpieceImageSize;
  className?: string;
  /** คลิกเพื่อดูรูปใหญ่ */
  onPreview?: (src: string) => void;
}

export default function WorkpieceImage({
  path,
  src: srcOverride,
  alt = "รูปชิ้นงาน",
  size = "sm",
  className = "",
  onPreview,
}: WorkpieceImageProps) {
  const src = srcOverride ?? workpieceImageUrl(path);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-500 ${sizeClass[size]} ${className}`}
        title="ไม่มีรูป"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const img = (
    <img
      src={src}
      alt={alt}
      className={`rounded-lg border border-gray-200 object-cover dark:border-gray-600 ${sizeClass[size]} ${className}`}
      onError={() => setFailed(true)}
    />
  );

  if (!onPreview) {
    return img;
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(src)}
      className="group relative inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      title="คลิกเพื่อดูรูปขยาย"
    >
      {img}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </span>
    </button>
  );
}
