"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, FormField, ActionButton, StatusBadge, DataTable, type Column } from "@/components/shared";
import { salesPlanningService, type PlanningBatch } from "@/services/sales/salesPlanningService";
import Link from "next/link";

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

  const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    PARTIAL: 'pending',
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
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'yearMonth',
      title: 'ปี/เดือน',
      render: (_, row) => `${row.year}/${String(row.month).padStart(2, '0')}`,
    },
    { key: 'fileName', title: 'ไฟล์' },
    {
      key: 'uploadedAt',
      title: 'วันที่อัปโหลด',
      render: (value) => new Date(value).toLocaleDateString('th-TH'),
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
          <span>ทั้งหมด: {row.totalRows}</span>
          <span className="text-green-600 dark:text-green-400">สำเร็จ: {row.successRows}</span>
          <span className="text-red-600 dark:text-red-400">ผิดพลาด: {row.errorRows}</span>
          <span className="text-gray-500 dark:text-gray-400">ข้าม: {row.skippedRows}</span>
        </div>
      ),
    },
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
    <PageContainer>
      <PageHeader
        title="นำเข้าแผนการขาย (Excel)"
        description="อัปโหลดไฟล์ Excel เพื่อนำเข้าแผนการขายรายวัน"
      />

      <ContentCard title="อัปโหลดไฟล์ Excel">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <FormField
            label="ปี"
            name="year"
            type="select"
            value={selectedYear}
            onChange={(value: string | number) => setSelectedYear(Number(value))}
            options={years.map((year) => ({
              value: year,
              label: `${year + 543} (ค.ศ. ${year})`,
            }))}
          />
          <FormField
            label="เดือน"
            name="month"
            type="select"
            value={selectedMonth}
            onChange={(value: string | number) => setSelectedMonth(Number(value))}
            options={months}
          />
          <div className="flex items-end">
            <ActionButton
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              📥 ดาวน์โหลด Excel Template
            </ActionButton>
          </div>
          <FormField
            label="อัปโหลดไฟล์"
            name="file"
            type="text"
            placeholder="เลือกไฟล์ Excel"
            onChange={() => {}}
          />
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              ไฟล์ที่เลือก: <span className="font-medium">{selectedFile.name}</span>
              <span className="ml-2 text-gray-500">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <ActionButton
              variant="primary"
              onClick={handleUpload}
              loading={uploading}
            >
              อัปโหลดและประมวลผล
            </ActionButton>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </ContentCard>

      <ContentCard title="ประวัติการ Import">
        <DataTable
          columns={columns}
          data={batches}
          loading={loading}
          emptyMessage="ไม่พบรายการ import"
          rowKey="id"
        />
      </ContentCard>
    </PageContainer>
  );
}
