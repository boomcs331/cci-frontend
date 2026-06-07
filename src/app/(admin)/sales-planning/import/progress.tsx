"use client";

import React, { useEffect, useState } from "react";
import { salesPlanningService } from "@/services/sales/salesPlanningService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faExclamationCircle, faClock } from "@fortawesome/free-solid-svg-icons";

interface PlanningProgressProps {
  batchId: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function PlanningProgress({ batchId, onComplete, onError }: PlanningProgressProps) {
  const [status, setStatus] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const data = await salesPlanningService.getBatchStatus(batchId);
        setStatus(data);
        
        // Calculate progress
        if (data.totalRows > 0) {
          const processed = data.successRows + data.errorRows + data.skippedRows;
          setProgress((processed / data.totalRows) * 100);
        }

        // Check if completed
        if (data.status === "COMPLETED" || data.status === "PARTIAL" || data.status === "FAILED" || data.status === "CANCELLED") {
          setLoading(false);
          if (onComplete) onComplete();
        }
      } catch (err) {
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(interval);
  }, [batchId, onComplete, onError]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-red-500" />
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-2xl text-brand-500 animate-spin" />
        <div className="text-sm text-gray-500 dark:text-gray-400">กำลังเริ่มประมวลผล...</div>
      </div>
    );
  }

  const statusConfig = (status: string) => {
    const map: Record<string, { label: string; icon: any; className: string; bgColor: string }> = {
      PENDING: { 
        label: "รอประมวลผล", 
        icon: faClock, 
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-800"
      },
      PROCESSING: { 
        label: "กำลังประมวลผล", 
        icon: faSpinner, 
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-900/20"
      },
      COMPLETED: { 
        label: "เสร็จสมบูรณ์", 
        icon: faCheckCircle, 
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-900/20"
      },
      PARTIAL: { 
        label: "บางส่วนสำเร็จ", 
        icon: faExclamationCircle, 
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
      },
      FAILED: { 
        label: "ล้มเหลว", 
        icon: faExclamationCircle, 
        className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        bgColor: "bg-rose-50 dark:bg-rose-900/20"
      },
      CANCELLED: { 
        label: "ยกเลิก", 
        icon: faClock, 
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-800"
      },
    };
    return map[status] || { label: status, icon: faClock, className: "bg-gray-100 text-gray-700", bgColor: "bg-gray-50" };
  };

  const config = statusConfig(status.status);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <FontAwesomeIcon 
              icon={config.icon} 
              className={`text-xl ${status.status === 'PROCESSING' ? 'animate-spin' : ''} ${
                status.status === 'COMPLETED' ? 'text-green-600' :
                status.status === 'FAILED' ? 'text-red-600' :
                status.status === 'PROCESSING' ? 'text-blue-600' :
                'text-gray-600'
              }`}
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">สถานะ</div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">ความคืบหน้า</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {status.totalRows}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ทั้งหมด</div>
        </div>
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {status.successRows}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">สำเร็จ</div>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {status.errorRows}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ผิดพลาด</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
            {status.skippedRows}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ข้าม</div>
        </div>
      </div>

      {/* Processing Duration */}
      {status.processingDurationMs && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FontAwesomeIcon icon={faClock} />
          <span>เวลาประมวลผล: {(status.processingDurationMs / 1000).toFixed(2)} วินาที</span>
        </div>
      )}

      {/* Batch Info */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Batch Code:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{status.batchCode}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Batch ID:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{status.batchId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
