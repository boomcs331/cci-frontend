"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, BaseModal, ActionButton, LoadingState } from "@/components/shared";
import {
  downloadImportTemplate,
  uploadImportFile,
  fetchImportBatches,
  fetchImportBatch,
  commitImportBatch,
  type ImportBatch,
  type ImportRow,
  type ImportBatchStatus,
  type Pagination,
} from "@/services/sales/salesImportService";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const statusBadge = (status: ImportBatchStatus) => {
  const map: Record<ImportBatchStatus, { label: string; className: string }> = {
    PENDING: { label: "รอตรวจสอบ", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    VALIDATED: { label: "ตรวจสอบแล้ว", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    COMMITTED: { label: "นำเข้าสำเร็จ", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    FAILED: { label: "ล้มเหลว", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  };
  return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
};

const rowStatusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "รอตรวจ", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    VALID: { label: "ถูกต้อง", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    ERROR: { label: "ผิดพลาด", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    COMMITTED: { label: "นำเข้าแล้ว", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  };
  return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
};

export default function SalesImportPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [viewingRows, setViewingRows] = useState(false);
  const [committing, setCommitting] = useState(false);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImportBatches({ page: 1, pageSize: 20 });
      setBatches(data.items);
      setPagination(data.pagination);
    } catch {
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
      const blob = await downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-import-template.xlsx";
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
      const batch = await uploadImportFile(selectedFile);
      setSelectedFile(null);
      await loadBatches();
      setSelectedBatch(batch);
      setViewingRows(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleViewRows = async (batch: ImportBatch) => {
    setLoading(true);
    try {
      const fullBatch = await fetchImportBatch(batch.id);
      setSelectedBatch(fullBatch);
      setViewingRows(true);
    } catch {
      setError("โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedBatch) return;

    setCommitting(true);
    setError(null);
    try {
      await commitImportBatch(selectedBatch.id);
      await loadBatches();
      const updated = await fetchImportBatch(selectedBatch.id);
      setSelectedBatch(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "นำเข้าข้อมูลไม่สำเร็จ");
    } finally {
      setCommitting(false);
    }
  };

  const handleBack = () => {
    setSelectedBatch(null);
    setViewingRows(false);
  };

  if (viewingRows && selectedBatch) {
    return (
      <PageContainer>
        <PageHeader
          title={`Batch: ${selectedBatch.batchCode}`}
          description={`ไฟล์: ${selectedBatch.fileName}`}
          actions={
            <ActionButton variant="secondary" onClick={handleBack}>
              ← กลับ
            </ActionButton>
          }
        />

        <ContentCard>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              สถานะ:
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(selectedBatch.status).className}`}
            >
              {statusBadge(selectedBatch.status).label}
            </span>
          </div>
          <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>ทั้งหมด: {selectedBatch.totalRows}</span>
            <span className="text-green-600 dark:text-green-400">
              ถูกต้อง: {selectedBatch.validRows}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              ผิดพลาด: {selectedBatch.errorRows}
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              นำเข้าแล้ว: {selectedBatch.committedRows}
            </span>
          </div>
          {selectedBatch.status === "VALIDATED" && selectedBatch.validRows > 0 && (
            <ActionButton
              variant="primary"
              onClick={handleCommit}
              disabled={committing}
            >
              {committing ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
            </ActionButton>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">แถว</th>
                  <th className="px-4 py-3 font-medium">กลุ่มออเดอร์</th>
                  <th className="px-4 py-3 font-medium">รหัสลูกค้า</th>
                  <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
                  <th className="px-4 py-3 font-medium">จำนวน</th>
                  <th className="px-4 py-3 font-medium">ราคา</th>
                  <th className="px-4 py-3 font-medium">ส่วนลด</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">ข้อผิดพลาด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {!selectedBatch.rows || selectedBatch.rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      ไม่พบรายการ
                    </td>
                  </tr>
                ) : (
                  selectedBatch.rows.map((row) => {
                    const badge = rowStatusBadge(row.status);
                    return (
                      <tr
                        key={row.id}
                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">{row.rowNumber}</td>
                        <td className="px-4 py-3">{row.orderGroup || "-"}</td>
                        <td className="px-4 py-3">{row.customerCode || "-"}</td>
                        <td className="px-4 py-3">{row.productCode || "-"}</td>
                        <td className="px-4 py-3">{row.quantity || "-"}</td>
                        <td className="px-4 py-3">{row.unitPrice || "-"}</td>
                        <td className="px-4 py-3">{row.discount || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400">
                          {row.errorMessage || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </PageContainer>
    );
  }

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="นำเข้าออเดอร์ (Excel)"
        description="อัปโหลดไฟล์ Excel เพื่อนำเข้าออเดอร์ขายแบบรวดเร็ว"
      />

      <ContentCard>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดและตรวจสอบ"}
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
                  <th className="px-4 py-3 font-medium">ไฟล์</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">สรุป</th>
                  <th className="px-4 py-3 font-medium">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batches.map((batch) => {
                    const badge = statusBadge(batch.status);
                    return (
                      <tr
                        key={batch.id}
                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">{batch.batchCode}</td>
                        <td className="px-4 py-3">{batch.fileName}</td>
                        <td className="px-4 py-3">
                          {new Date(batch.createdAt).toLocaleDateString("th-TH")}
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
                              ถูกต้อง: {batch.validRows}
                            </span>
                            <span className="text-rose-600 dark:text-rose-400">
                              ผิดพลาด: {batch.errorRows}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleViewRows(batch)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
