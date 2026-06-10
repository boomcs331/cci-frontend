'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { salesPlanningService } from '@/services/sales/salesPlanningService';
import { PlanningBatch, PlanningRow, PlanningError } from '@/services/sales/salesPlanningService';
import {
  PageContainer,
  PageHeader,
  ContentCard,
  InfoCard,
  DataTable,
  StatusBadge,
  ActionButton,
  LoadingState,
  ErrorState,
  type Column,
} from '@/components/shared';
import PaginationFooter from '@/components/pagination/PaginationFooter';
import { createPaginationHrefBuilder } from '@/lib/pagination';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = parseInt(params.batchId as string);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const errorPage = parseInt(searchParams.get('errorPage') || '1');
  const errorLimit = parseInt(searchParams.get('errorLimit') || '10');
  const customerCodeFilter = searchParams.get('customerCode') || '';
  const productCodeFilter = searchParams.get('productCode') || '';
  const statusFilter = searchParams.get('status') || '';
  const saleDateFilter = searchParams.get('saleDate') || '';
  const errorTypeFilter = searchParams.get('errorType') || '';
  const errorCodeFilter = searchParams.get('errorCode') || '';
  const severityFilter = searchParams.get('severity') || '';
  const rowNumberFilter = searchParams.get('rowNumber') || '';
  const fieldNameFilter = searchParams.get('fieldName') || '';

  const activeTab = (searchParams.get('tab') as 'rows' | 'errors') || 'rows';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    batch: PlanningBatch;
    rows: PlanningRow[];
    errors: PlanningError[];
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rowsData, setRowsData] = useState<{
    rows: PlanningRow[];
    total: number;
    skip: number;
    take: number;
  } | null>(null);
  const [errorsData, setErrorsData] = useState<{
    errors: PlanningError[];
    total: number;
    skip: number;
    take: number;
  } | null>(null);

  const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    PARTIAL: 'pending',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };

  const rowColumns: Column<PlanningRow>[] = [
    {
      key: 'saleDate',
      title: 'วันที่',
      render: (value) => new Date(value).toLocaleDateString('th-TH'),
    },
    { key: 'customerCode', title: 'ลูกค้า' },
    { key: 'productCode', title: 'สินค้า' },
    { key: 'model', title: 'Model' },
    { key: 'quantity', title: 'จำนวน' },
    {
      key: 'status',
      title: 'สถานะ',
      render: (value) => <StatusBadge status={value === 'VALID' ? 'success' : value === 'INVALID' ? 'error' : 'warning'} />,
    },
  ];

  const errorColumns: Column<PlanningError>[] = [
    { key: 'rowNumber', title: 'Row' },
    { key: 'fieldName', title: 'ฟิลด์ที่ผิดพลาด' },
    { key: 'errorType', title: 'Error Type' },
    { key: 'errorCode', title: 'Error Code' },
    {
      key: 'errorMessage',
      title: 'Message',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.errorDetails && (
            <div className="text-xs text-gray-500 mt-1">
              {row.errorDetails.expectedTotal !== undefined && (
                <div>ค่าที่ควรจะเป็น: {row.errorDetails.expectedTotal}</div>
              )}
              {row.errorDetails.actualTotal !== undefined && (
                <div>ค่าที่กรอก: {row.errorDetails.actualTotal}</div>
              )}
              {row.errorDetails.difference !== undefined && (
                <div>ความต่าง: {row.errorDetails.difference}</div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'severity',
      title: 'Severity',
      render: (value) => <StatusBadge status={value === 'ERROR' ? 'error' : value === 'WARNING' ? 'warning' : 'info'} />,
    },
  ];

  useEffect(() => {
    loadBatchDetail();
    loadRows();
    loadErrors();
  }, [batchId, page, limit, errorPage, errorLimit, customerCodeFilter, productCodeFilter, statusFilter, saleDateFilter, errorTypeFilter, errorCodeFilter, severityFilter, rowNumberFilter, fieldNameFilter]);

  useEffect(() => {
    if (activeTab === 'errors') {
      loadErrors();
    }
  }, [activeTab]);

  const loadBatchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await salesPlanningService.getBatchDetail(batchId);
      setData(detail);
    } catch (err) {
      console.error('Failed to load batch detail:', err);
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async () => {
    try {
      const skip = (page - 1) * limit;
      const result = await salesPlanningService.getBatchRows(batchId, {
        skip,
        take: limit,
        customerCode: customerCodeFilter || undefined,
        productCode: productCodeFilter || undefined,
        status: statusFilter || undefined,
        saleDate: saleDateFilter || undefined,
      });
      setRowsData(result);
    } catch (err) {
      console.error('Failed to load rows:', err);
    }
  };

  const loadErrors = async () => {
    try {
      const skip = (errorPage - 1) * errorLimit;
      const result = await salesPlanningService.getBatchErrors(batchId, {
        skip,
        take: errorLimit,
        errorType: errorTypeFilter || undefined,
        errorCode: errorCodeFilter || undefined,
        rowNumber: rowNumberFilter ? parseInt(rowNumberFilter) : undefined,
        fieldName: fieldNameFilter || undefined,
      });
      setErrorsData(result);
    } catch (err) {
      console.error('Failed to load errors:', err);
    }
  };

  const handleDownload = async () => {
    setActionLoading('download');
    try {
      const blob = await salesPlanningService.downloadBatch(batchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${batch.batchCode}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('ดาวน์โหลดไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async () => {
    if (!confirm('ยืนยันที่จะประมวลผลใหม่?')) return;
    setActionLoading('reprocess');
    try {
      await salesPlanningService.reprocessBatch(batchId);
      alert('เริ่มประมวลผลใหม่แล้ว');
      loadBatchDetail();
    } catch (err) {
      console.error('Failed to reprocess:', err);
      alert('ประมวลผลใหม่ไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('ยืนยันที่จะลบ batch นี้?')) return;
    setActionLoading('delete');
    try {
      await salesPlanningService.deleteBatch(batchId);
      alert('ลบ batch สำเร็จ');
      router.push('/sales-planning/import');
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('ลบไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="กำลังโหลดข้อมูล..." />
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <ErrorState
          title={error || 'ไม่พบข้อมูล'}
          onRetry={() => router.back()}
        />
      </PageContainer>
    );
  }

  const { batch } = data;
  const rows = rowsData?.rows || [];
  const totalRows = rowsData?.total || 0;
  const totalPages = Math.ceil(totalRows / limit);
  const errors = errorsData?.errors || [];
  const totalErrors = errorsData?.total || 0;
  const totalErrorPages = Math.ceil(totalErrors / errorLimit);

  const setTab = (tab: 'rows' | 'errors') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`รายละเอียด Batch: ${batch.batchCode}`}
        actions={
          <div className="flex gap-2">
            <ActionButton 
              variant="secondary" 
              onClick={() => router.back()}
            >
              กลับ
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleDownload}
              loading={actionLoading === 'download'}
            >
              ดาวน์โหลด
            </ActionButton>
            <ActionButton 
              variant="warning" 
              onClick={handleReprocess}
              loading={actionLoading === 'reprocess'}
            >
              ประมวลผลใหม่
            </ActionButton>
            <ActionButton 
              variant="danger" 
              onClick={handleDelete}
              loading={actionLoading === 'delete'}
            >
              ลบ
            </ActionButton>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">ทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{batch.totalRows}</p>
          <p className="mt-1 text-xs text-gray-400">รายการ</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">สำเร็จ</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{batch.successRows}</p>
          <p className="mt-1 text-xs text-emerald-500">บันทึกแล้ว</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">ผิดพลาด</p>
          <p className="mt-2 text-3xl font-bold text-rose-700 dark:text-rose-300">{batch.errorRows}</p>
          <p className="mt-1 text-xs text-rose-500">ต้องแก้ไข</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">ข้าม</p>
          <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{batch.skippedRows}</p>
          <p className="mt-1 text-xs text-amber-500">ถูกข้าม</p>
        </div>
      </div>

      {/* Batch Info */}
      <ContentCard title="ข้อมูล Batch" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard label="Batch Code" value={batch.batchCode} />
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              สถานะ
            </p>
            <div className="mt-1">
              <StatusBadge status={statusMap[batch.status] || 'info'} />
            </div>
          </div>
          <InfoCard label="ปี/เดือน" value={`${batch.year}/${batch.month}`} />
          <InfoCard label="ชื่อไฟล์" value={batch.fileName} />
          <InfoCard
            label="Upload Date"
            value={new Date(batch.uploadedAt).toLocaleString('th-TH')}
          />
          <InfoCard
            label="Processed Date"
            value={batch.processedAt ? new Date(batch.processedAt).toLocaleString('th-TH') : '-'}
          />
        </div>
      </ContentCard>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('rows')}
          className={`relative px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rows'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          ข้อมูลที่สำเร็จ ({totalRows})
          {activeTab === 'rows' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setTab('errors')}
          className={`relative px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'errors'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          ข้อผิดพลาด
          {totalErrors > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
              {totalErrors}
            </span>
          )}
          {activeTab === 'errors' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-rose-600 dark:bg-rose-400" />
          )}
        </button>
      </div>

      {/* Planning Rows Tab */}
      {activeTab === 'rows' && (
      <ContentCard title={`ข้อมูล Planning Rows (${totalRows} รายการ)`}>
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ลูกค้า
              </label>
              <input
                type="text"
                value={customerCodeFilter}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('customerCode', e.target.value);
                  } else {
                    params.delete('customerCode');
                  }
                  params.set('page', '1');
                  router.push(`?${params.toString()}`);
                }}
                placeholder="รหัสลูกค้า"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                สินค้า
              </label>
              <input
                type="text"
                value={productCodeFilter}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('productCode', e.target.value);
                  } else {
                    params.delete('productCode');
                  }
                  params.set('page', '1');
                  router.push(`?${params.toString()}`);
                }}
                placeholder="รหัสสินค้า"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                สถานะ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('status', e.target.value);
                  } else {
                    params.delete('status');
                  }
                  params.set('page', '1');
                  router.push(`?${params.toString()}`);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
              >
                <option value="">ทั้งหมด</option>
                <option value="VALID">VALID</option>
                <option value="INVALID">INVALID</option>
                <option value="SKIPPED">SKIPPED</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={saleDateFilter ? dayjs(saleDateFilter) : null}
                  onChange={(newValue: Dayjs | null) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (newValue && newValue.isValid()) {
                      params.set('saleDate', newValue.format('YYYY-MM-DD'));
                    } else {
                      params.delete('saleDate');
                    }
                    params.set('page', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      placeholder: 'เลือกวันที่',
                    },
                    field: {
                      clearable: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('customerCode');
                  params.delete('productCode');
                  params.delete('status');
                  params.delete('saleDate');
                  params.set('page', '1');
                  router.push(`?${params.toString()}`);
                }}
                className="mb-0.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:border-blue-400"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>
        <DataTable
          columns={rowColumns}
          data={rows}
          emptyMessage="ไม่พบข้อมูล planning rows"
          rowKey="id"
        />
        {totalRows > 0 && (
          <PaginationFooter
            page={page}
            limit={limit}
            total={totalRows}
            totalPages={totalPages}
            hrefBuilder={createPaginationHrefBuilder(searchParams, limit)}
            summaryLocale="th"
          />
        )}
      </ContentCard>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <ContentCard title={`ข้อผิดพลาด (${totalErrors} รายการ)`}>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Row Number
                </label>
                <input
                  type="number"
                  value={rowNumberFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('rowNumber', e.target.value);
                    } else {
                      params.delete('rowNumber');
                    }
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  placeholder="Row Number"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Field Name
                </label>
                <input
                  type="text"
                  value={fieldNameFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('fieldName', e.target.value);
                    } else {
                      params.delete('fieldName');
                    }
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  placeholder="Field Name"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Type
                </label>
                <input
                  type="text"
                  value={errorTypeFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('errorType', e.target.value);
                    } else {
                      params.delete('errorType');
                    }
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  placeholder="Error Type"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Code
                </label>
                <input
                  type="text"
                  value={errorCodeFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('errorCode', e.target.value);
                    } else {
                      params.delete('errorCode');
                    }
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  placeholder="Error Code"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('severity', e.target.value);
                    } else {
                      params.delete('severity');
                    }
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('errorType');
                    params.delete('errorCode');
                    params.delete('severity');
                    params.delete('rowNumber');
                    params.delete('fieldName');
                    params.set('errorPage', '1');
                    router.push(`?${params.toString()}`);
                  }}
                  className="mb-0.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:border-blue-400"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>
          <DataTable
            columns={errorColumns}
            data={errors}
            emptyMessage="ไม่พบข้อมูล errors"
            rowKey="id"
          />
          {totalErrors > 0 && (
            <PaginationFooter
              page={errorPage}
              limit={errorLimit}
              total={totalErrors}
              totalPages={totalErrorPages}
              hrefBuilder={(targetPage) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('errorPage', String(targetPage));
                params.set('errorLimit', String(errorLimit));
                return `?${params.toString()}`;
              }}
              summaryLocale="th"
            />
          )}
        </ContentCard>
      )}
    </PageContainer>
  );
}
