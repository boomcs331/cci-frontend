"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import { salesPlanningService, type PlanningBatch } from "@/services/sales/salesPlanningService";
import Link from "next/link";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

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

export default function SalesPlanningImportPage() {
  const [batches, setBatches] = useState<PlanningBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: "มกราคม" },
    { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" },
    { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" },
    { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" },
    { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" },
    { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" },
    { value: 12, label: "ธันวาคม" },
  ];

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesPlanningService.getImportHistory({ skip: 0, take: 20 });
      console.log('Import history response:', data);
      if (!data) {
        throw new Error('No data returned from API');
      }
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
      setError("โหลดรายการ import ไม่สำเร็จ");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await salesPlanningService.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-planning-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("ดาวน์โหลด template ไม่สำเร็จ");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("กรุณาเลือกไฟล์");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await salesPlanningService.uploadFile(selectedFile, selectedYear, selectedMonth);
      setSelectedFile(null);
      await loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="นำเข้าแผนการขาย (Excel)" />

      <ComponentCard
        title="นำเข้าแผนการขายจาก Excel"
        desc="อัปโหลดไฟล์ Excel เพื่อนำเข้าแผนการขายรายวัน"
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ปี
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={inputClass}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year + 543} (ค.ศ. {year})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              เดือน
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={inputClass}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              ดาวน์โหลด Template
            </label>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              📥 ดาวน์โหลด Excel Template
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              อัปโหลดไฟล์
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className={inputClass}
            />
          </div>
        </div>

        {selectedFile && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              ไฟล์ที่เลือก: <span className="font-medium">{selectedFile.name}</span>
              <span className="ml-2 text-gray-500">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดและประมวลผล"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
          <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            ประวัติการ Import
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Batch Code</th>
                  <th className="px-4 py-3 font-medium">ปี/เดือน</th>
                  <th className="px-4 py-3 font-medium">ไฟล์</th>
                  <th className="px-4 py-3 font-medium">วันที่อัปโหลด</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">สรุป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableEmptyRow colSpan={6} message="กำลังโหลด..." />
                ) : batches.length === 0 ? (
                  <TableEmptyRow colSpan={6} message="ไม่พบรายการ" />
                ) : (
                  batches.map((batch) => {
                    const badge = statusBadge(batch.status);
                    return (
                      <tr
                        key={batch.id}
                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/sales-planning/import/${batch.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {batch.batchCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {batch.year}/{String(batch.month).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">{batch.fileName}</td>
                        <td className="px-4 py-3">
                          {new Date(batch.uploadedAt).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-3">
                            <span>ทั้งหมด: {batch.totalRows}</span>
                            <span className="text-green-600 dark:text-green-400">
                              สำเร็จ: {batch.successRows}
                            </span>
                            <span className="text-rose-600 dark:text-rose-400">
                              ผิดพลาด: {batch.errorRows}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              ข้าม: {batch.skippedRows}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}
