"use client";

import React from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/30">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
          เกิดข้อผิดพลาดในหน้านี้
        </h2>
        <p className="mt-2 break-all text-sm text-red-600 dark:text-red-200">
          {error.message || "Something went wrong"}
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-red-500/80 dark:text-red-300/70">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ลองใหม่
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    </div>
  );
}
