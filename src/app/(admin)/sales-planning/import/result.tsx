"use client";

import React, { useState } from "react";
import TableEmptyRow from "@/components/common/TableEmptyRow";

interface PlanningError {
  id: number;
  rowNumber: number;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  fieldName: string;
  fieldValue: string;
  severity: "ERROR" | "WARNING" | "INFO";
}

interface PlanningResultProps {
  batchId: number;
  status: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  onBack?: () => void;
}

export function PlanningResult({
  batchId,
  status,
  totalRows,
  successRows,
  errorRows,
  skippedRows,
  onBack,
}: PlanningResultProps) {
  const [errors, setErrors] = useState<PlanningError[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARNING">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredErrors = errors.filter((error) => {
    if (filter !== "ALL" && error.severity !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        error.errorMessage.toLowerCase().includes(search) ||
        error.fieldName.toLowerCase().includes(search) ||
        error.fieldValue.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const severityBadge = (severity: string) => {
    const map: Record<string, { label: string; className: string }> = {
      ERROR: { label: "Error", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
      WARNING: { label: "Warning", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
      INFO: { label: "Info", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    };
    return map[severity] || { label: severity, className: "bg-gray-100 text-gray-700" };
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      COMPLETED: { label: "เสร็จสมบูรณ์", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      PARTIAL: { label: "บางส่วนสำเร็จ", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
      FAILED: { label: "ล้มเหลว", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    };
    return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  };

  const handleExportErrors = () => {
    // TODO: Implement error export
    console.log("Export errors");
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            สรุปผลการ Import
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadge(status).className}`}
          >
            {statusBadge(status).label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ทั้งหมด</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {successRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">สำเร็จ</div>
          </div>
          <div className="rounded-lg bg-rose-50 p-4 text-center dark:bg-rose-900/20">
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {errorRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ผิดพลาด</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {skippedRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ข้าม</div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          {errorRows > 0 && (
            <button
              type="button"
              onClick={handleExportErrors}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              📥 Export Errors
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              กลับ
            </button>
          )}
        </div>
      </div>

      {/* Errors Table */}
      {errorRows > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                รายการผิดพลาด ({filteredErrors.length})
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    filter === "ALL"
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("ERROR")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    filter === "ERROR"
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Error
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("WARNING")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    filter === "WARNING"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Warning
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="ค้นหาข้อผิดพลาด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">แถว</th>
                  <th className="px-4 py-3 font-medium">ความรุนแรง</th>
                  <th className="px-4 py-3 font-medium">รหัส</th>
                  <th className="px-4 py-3 font-medium">ฟิลด์</th>
                  <th className="px-4 py-3 font-medium">ค่า</th>
                  <th className="px-4 py-3 font-medium">ข้อความ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableEmptyRow colSpan={6} message="กำลังโหลด..." />
                ) : filteredErrors.length === 0 ? (
                  <TableEmptyRow colSpan={6} message="ไม่พบข้อผิดพลาด" />
                ) : (
                  filteredErrors.map((error) => {
                    const badge = severityBadge(error.severity);
                    return (
                      <tr
                        key={error.id}
                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">{error.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{error.errorCode}</td>
                        <td className="px-4 py-3">{error.fieldName}</td>
                        <td className="px-4 py-3 font-mono text-xs">{error.fieldValue}</td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400">
                          {error.errorMessage}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
