"use client";

import React, { useEffect, useState } from "react";
import { salesPlanningService, type PlanningError } from "@/services/sales/salesPlanningService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faArrowLeft, faExclamationTriangle, faInfoCircle, faFilter } from "@fortawesome/free-solid-svg-icons";

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARNING" | "INFO">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadErrors = async () => {
      if (errorRows === 0) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await salesPlanningService.getBatchErrors(batchId, { skip: 0, take: 100 });
        setErrors(data.errors || []);
      } catch (err) {
        console.error('Failed to load errors:', err);
      } finally {
        setLoading(false);
      }
    };

    loadErrors();
  }, [batchId, errorRows]);

  const filteredErrors = errors.filter((error) => {
    if (filter !== "ALL" && error.severity !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        error.errorMessage.toLowerCase().includes(search) ||
        error.fieldName.toLowerCase().includes(search) ||
        error.fieldValue.toLowerCase().includes(search) ||
        error.errorCode.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const severityBadge = (severity: string) => {
    const map: Record<string, { label: string; className: string; icon: any }> = {
      ERROR: { 
        label: "Error", 
        className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        icon: faExclamationTriangle
      },
      WARNING: { 
        label: "Warning", 
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        icon: faExclamationTriangle
      },
      INFO: { 
        label: "Info", 
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        icon: faInfoCircle
      },
    };
    return map[severity] || { label: severity, className: "bg-gray-100 text-gray-700", icon: faInfoCircle };
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
    // Export errors to CSV
    const headers = ['Row', 'Severity', 'Error Code', 'Field', 'Value', 'Error Message'];
    const rows = filteredErrors.map(error => [
      error.rowNumber,
      error.severity,
      error.errorCode,
      error.fieldName,
      error.fieldValue,
      error.errorMessage
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${batchId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            สรุปผลการ Import
          </h3>
          <span
            className={`rounded-full px-4 py-2 text-sm font-medium ${statusBadge(status).className}`}
          >
            {statusBadge(status).label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ทั้งหมด</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {successRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">สำเร็จ</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {errorRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ผิดพลาด</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {skippedRows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ข้าม</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {errorRows > 0 && (
            <button
              type="button"
              onClick={handleExportErrors}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <FontAwesomeIcon icon={faDownload} />
              Export Errors
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              กลับ
            </button>
          )}
        </div>
      </div>

      {/* Errors Table */}
      {errorRows > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  รายการผิดพลาด ({filteredErrors.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === "WARNING"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Warning
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("INFO")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === "INFO"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Info
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="ค้นหาข้อผิดพลาด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
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
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : filteredErrors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      ไม่พบข้อผิดพลาด
                    </td>
                  </tr>
                ) : (
                  filteredErrors.map((error) => {
                    const badge = severityBadge(error.severity);
                    return (
                      <tr
                        key={error.id}
                        className="text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">{error.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            <FontAwesomeIcon icon={badge.icon} className="text-xs" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{error.errorCode}</td>
                        <td className="px-4 py-3">{error.fieldName}</td>
                        <td className="px-4 py-3 font-mono text-xs max-w-[150px] truncate">{error.fieldValue}</td>
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
