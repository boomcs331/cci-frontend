'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { salesPlanningService } from '@/services/sales/salesPlanningService';
import { PlanningBatch, PlanningRow, PlanningError } from '@/services/sales/salesPlanningService';
import { ROUTES } from '@/constants/routes';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faCheckCircle, faXmarkCircle, faBan } from '@fortawesome/free-solid-svg-icons';

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
      router.push(ROUTES.SALES_PLANNING_IMPORT);
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

  const successRate = totalRows > 0 ? Math.round((batch.successRows / totalRows) * 100) : 0;

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
          <div className="flex gap-3">
            <ActionButton 
              variant="secondary" 
              onClick={() => router.back()}
              className="px-4"
            >
              กลับ
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleDownload}
              loading={actionLoading === 'download'}
              className="px-4"
            >
              ดาวน์โหลด
            </ActionButton>
            <ActionButton 
              variant="warning" 
              onClick={handleReprocess}
              loading={actionLoading === 'reprocess'}
              className="px-4"
            >
              ประมวลผลใหม่
            </ActionButton>
            <ActionButton 
              variant="danger" 
              onClick={handleDelete}
              loading={actionLoading === 'delete'}
              className="px-4"
            >
              ลบ
            </ActionButton>
          </div>
        }
      />

      {/* Modern Dashboard */}
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">ทั้งหมด</p>
                <p className="text-3xl font-light text-slate-900 dark:text-white">{batch.totalRows}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <FontAwesomeIcon icon={faFileLines} className="text-slate-600 dark:text-slate-300 text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">สำเร็จ</p>
                <p className="text-3xl font-light text-emerald-700 dark:text-emerald-300">{batch.successRows}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-emerald-800 flex items-center justify-center shadow-sm">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 dark:text-emerald-300 text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-900/30 rounded-2xl p-5 border border-rose-200 dark:border-rose-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-2">ผิดพลาด</p>
                <p className="text-3xl font-light text-rose-700 dark:text-rose-300">{batch.errorRows}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-rose-800 flex items-center justify-center shadow-sm">
                <FontAwesomeIcon icon={faXmarkCircle} className="text-rose-600 dark:text-rose-300 text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">ข้าม</p>
                <p className="text-3xl font-light text-amber-700 dark:text-amber-300">{batch.skippedRows}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-amber-800 flex items-center justify-center shadow-sm">
                <FontAwesomeIcon icon={faBan} className="text-amber-600 dark:text-amber-300 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress & Batch Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">อัตราความสำเร็จ</h3>
                <span className="text-2xl font-light text-slate-900 dark:text-white">{successRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    successRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                    successRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                    'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  สำเร็จ {batch.successRows}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  ผิดพลาด {batch.errorRows}
                </span>
              </div>
            </div>

            {/* Batch Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">ข้อมูล Batch</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Batch Code</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{batch.batchCode}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">สถานะ</span>
                  <StatusBadge status={statusMap[batch.status] || 'info'} />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">ปี/เดือน</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{batch.year}/{batch.month}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Upload</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(batch.uploadedAt).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Processed</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{batch.processedAt ? new Date(batch.processedAt).toLocaleDateString('th-TH') : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setTab('rows')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'rows'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  ข้อมูลที่สำเร็จ ({totalRows})
                </button>
                <button
                  onClick={() => setTab('errors')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'errors'
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20 border-b-2 border-rose-500'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  ข้อผิดพลาด
                  {totalErrors > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs">
                      {totalErrors}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'rows' ? (
                  <div>
                    {/* Filters */}
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">ลูกค้า</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">สินค้า</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">สถานะ</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="VALID">VALID</option>
                            <option value="INVALID">INVALID</option>
                            <option value="SKIPPED">SKIPPED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">วันที่</label>
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
                                  className: 'rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm'
                                },
                                field: {
                                  clearable: true,
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
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
                          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          รีเซ็ตตัวกรอง
                        </button>
                      </div>
                    </div>
                    <DataTable
                      columns={rowColumns}
                      data={rows}
                      emptyMessage="ไม่พบข้อมูล planning rows"
                      rowKey="id"
                    />
                    {totalRows > 0 && (
                      <div className="mt-4">
                        <PaginationFooter
                          page={page}
                          limit={limit}
                          total={totalRows}
                          totalPages={totalPages}
                          hrefBuilder={createPaginationHrefBuilder(searchParams, limit)}
                          summaryLocale="th"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Error Filters */}
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Row Number</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Error Type</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Severity</label>
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
                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-500/40 dark:focus:border-emerald-500 outline-none transition-all"
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="ERROR">ERROR</option>
                            <option value="WARNING">WARNING</option>
                            <option value="INFO">INFO</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
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
                          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          รีเซ็ตตัวกรอง
                        </button>
                      </div>
                    </div>
                    <DataTable
                      columns={errorColumns}
                      data={errors}
                      emptyMessage="ไม่พบข้อมูล errors"
                      rowKey="id"
                    />
                    {totalErrors > 0 && (
                      <div className="mt-4">
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
