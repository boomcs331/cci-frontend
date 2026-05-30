"use client";

import React, { useEffect, useState } from "react";

interface PlanningProgressProps {
  batchId: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface BatchStatus {
  status: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  processedAt: string | null;
  processingDurationMs: number | null;
}

export function PlanningProgress({ batchId, onComplete, onError }: PlanningProgressProps) {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        // TODO: Replace with actual API call
        // const data = await fetchPlanningBatchStatus(batchId);
        const data: BatchStatus = {
          status: "PROCESSING",
          totalRows: 100,
          successRows: 45,
          errorRows: 5,
          skippedRows: 0,
          processedAt: null,
          processingDurationMs: null,
        };
        
        setStatus(data);
        
        // Calculate progress
        if (data.totalRows > 0) {
          const processed = data.successRows + data.errorRows + data.skippedRows;
          setProgress((processed / data.totalRows) * 100);
        }

        // Check if completed
        if (data.status === "COMPLETED" || data.status === "PARTIAL" || data.status === "FAILED") {
          setLoading(false);
          if (onComplete) onComplete();
        }
      } catch (err) {
        setLoading(false);
        if (onError) onError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(interval);
  }, [batchId, onComplete, onError]);

  if (!status) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500 dark:text-gray-400">กำลังเริ่มประมวลผล...</div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "รอประมวลผล", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      PROCESSING: { label: "กำลังประมวลผล", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
      COMPLETED: { label: "เสร็จสมบูรณ์", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      PARTIAL: { label: "บางส่วนสำเร็จ", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
      FAILED: { label: "ล้มเหลว", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
      CANCELLED: { label: "ยกเลิก", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    };
    return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  };

  const badge = statusBadge(status.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            สถานะ:
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {progress.toFixed(0)}%
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {status.totalRows}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด</div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {status.successRows}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">สำเร็จ</div>
        </div>
        <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-900/20">
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
            {status.errorRows}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">ผิดพลาด</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
            {status.skippedRows}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">ข้าม</div>
        </div>
      </div>

      {status.processingDurationMs && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          เวลาประมวลผล: {(status.processingDurationMs / 1000).toFixed(2)} วินาที
        </div>
      )}
    </div>
  );
}
