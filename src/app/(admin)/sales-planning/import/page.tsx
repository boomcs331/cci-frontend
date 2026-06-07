"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, ActionButton, StatusBadge, DataTable, type Column } from "@/components/shared";
import { salesPlanningService, type PlanningBatch } from "@/services/sales/salesPlanningService";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faCloudArrowUp, faDownload, faTrash, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import MonthYearPicker from "@/components/form/month-year-picker";
import AlertModal from "@/components/common/AlertModal";

export default function SalesPlanningImportPage() {
  const [batches, setBatches] = useState<PlanningBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; variant: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>({
    show: false,
    variant: 'info',
    title: '',
    message: ''
  });

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'warning'> = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    PARTIAL: 'warning',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };

  const columns: Column<PlanningBatch>[] = [
    {
      key: 'batchCode',
      title: 'Batch Code',
      render: (value, row) => (
        <Link
          href={`/sales-planning/import/${row.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'yearMonth',
      title: 'ปี/เดือน',
      render: (_, row) => (
        <span className="inline-flex items-center gap-1">
          <span className="font-medium">{row.year + 543}</span>
          <span className="text-gray-400">/</span>
          <span>{String(row.month).padStart(2, '0')}</span>
        </span>
      ),
    },
    { 
      key: 'fileName', 
      title: 'ไฟล์',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
          <span className="truncate max-w-[200px]">{value}</span>
        </div>
      ),
    },
    {
      key: 'uploadedAt',
      title: 'วันที่อัปโหลด',
      render: (value) => new Date(value).toLocaleDateString('th-TH', {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      key: 'status',
      title: 'สถานะ',
      render: (value) => <StatusBadge status={statusMap[value] || 'info'} />,
    },
    {
      key: 'summary',
      title: 'สรุป',
      render: (_, row) => (
        <div className="flex gap-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400">ทั้งหมด: <span className="font-semibold">{row.totalRows}</span></span>
          <span className="text-green-600 dark:text-green-400">สำเร็จ: <span className="font-semibold">{row.successRows}</span></span>
          {row.errorRows > 0 && (
            <span className="text-red-600 dark:text-red-400">ผิดพลาด: <span className="font-semibold">{row.errorRows}</span></span>
          )}
          {row.skippedRows > 0 && (
            <span className="text-gray-500 dark:text-gray-400">ข้าม: <span className="font-semibold">{row.skippedRows}</span></span>
          )}
        </div>
      ),
    },
  ];

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesPlanningService.getImportHistory({ skip: 0, take: 20 });
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
      setSuccessMessage("ดาวน์โหลด template สำเร็จ");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError("ดาวน์โหลด template ไม่สำเร็จ");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("กรุณาเลือกไฟล์");
      return;
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      setError("กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      console.log('Uploading file:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        year: selectedYear,
        month: selectedMonth,
      });
      
      await salesPlanningService.uploadFile(selectedFile, selectedYear, selectedMonth);
      setSelectedFile(null);
      setSuccessMessage("อัปโหลดไฟล์สำเร็จ กำลังประมวลผล...");
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadBatches();
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ";
      setError(errorMessage);
      setAlertModal({
        show: true,
        variant: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="นำเข้าแผนการขาย"
        description="อัปโหลดไฟล์ Excel เพื่อนำเข้าแผนการขายรายวัน"
      />

      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faCheck} className="text-green-600" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faXmark} className="text-red-600" />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <ContentCard className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ภาพรวมการนำเข้า
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {batches.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">จำนวน Import</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-900/20">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {batches.reduce((sum, b) => sum + b.totalRows, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">แถวทั้งหมด</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {batches.reduce((sum, b) => sum + b.successRows, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">สำเร็จ</div>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center dark:border-purple-800 dark:bg-purple-900/20">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {batches.length > 0 
                ? ((batches.reduce((sum, b) => sum + b.successRows, 0) / batches.reduce((sum, b) => sum + b.totalRows, 0)) * 100).toFixed(1)
                : 0}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">อัตราสำเร็จ</div>
          </div>
        </div>
      </ContentCard>

      {/* Upload Section */}
      <ContentCard className="mb-6">
        <div className="space-y-6">
          {/* Period Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              เลือกงวดบัญชี
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MonthYearPicker
                  id="period-picker"
                  label="เลือกเดือน/ปี"
                  defaultDate={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                />
              </div>
            </div>
            <div className="mt-4">
              <ActionButton
                variant="secondary"
                onClick={handleDownloadTemplate}
                className="w-full h-11"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                ดาวน์โหลด Excel Template
              </ActionButton>
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              อัปโหลดไฟล์
            </h3>
            
            {!selectedFile ? (
              <div
                className={`relative group border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 shadow-lg shadow-brand-500/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-5">
                  <div className={`relative transition-all duration-300 ${
                    dragActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-30 transition-all ${
                      dragActive ? 'bg-brand-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`relative p-6 rounded-2xl ${
                      dragActive 
                        ? 'bg-gradient-to-br from-brand-500 to-blue-600' 
                        : 'bg-gradient-to-br from-blue-500 to-brand-600'
                    } shadow-lg`}>
                      <FontAwesomeIcon 
                        icon={faCloudArrowUp} 
                        className="text-5xl text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      ลากไฟล์มาวางที่นี่
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      หรือ <span className="text-brand-600 dark:text-brand-400 font-medium">คลิกเพื่อเลือกไฟล์</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
                        .xlsx
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
                        .xls
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>สูงสุด 10MB</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-xl blur-lg opacity-20"></div>
                      <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <FontAwesomeIcon icon={faFileExcel} className="text-2xl text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-base">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ พร้อมอัปโหลด
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ActionButton
                      variant="primary"
                      onClick={handleUpload}
                      loading={uploading}
                      disabled={uploading}
                      className="px-6 py-3 font-medium"
                    >
                      <FontAwesomeIcon icon={faCloudArrowUp} className="mr-2" />
                      อัปโหลดและประมวลผล
                    </ActionButton>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={uploading}
                      className="p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ContentCard>

      {/* History Table - Full Width */}
      <ContentCard title="ประวัติการ Import">
        <DataTable
          columns={columns}
          data={batches}
          loading={loading}
          emptyMessage="ไม่พบรายการ import"
          rowKey="id"
        />
      </ContentCard>

      <AlertModal
        show={alertModal.show}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
      />
    </PageContainer>
  );
}
