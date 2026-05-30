'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { salesPlanningService } from '@/services/sales/salesPlanningService';
import { PlanningBatch, PlanningRow, PlanningError } from '@/services/sales/salesPlanningService';
import PaginationFooter from '@/components/pagination/PaginationFooter';
import { createPaginationHrefBuilder } from '@/lib/pagination';

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
  const errorTypeFilter = searchParams.get('errorType') || '';
  const errorCodeFilter = searchParams.get('errorCode') || '';
  const severityFilter = searchParams.get('severity') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    batch: PlanningBatch;
    rows: PlanningRow[];
    errors: PlanningError[];
  } | null>(null);
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

  useEffect(() => {
    loadBatchDetail();
    loadRows();
    loadErrors();
  }, [batchId, page, limit, errorPage, errorLimit, customerCodeFilter, productCodeFilter, statusFilter, errorTypeFilter, errorCodeFilter, severityFilter]);

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
      });
      setErrorsData(result);
    } catch (err) {
      console.error('Failed to load errors:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'ไม่พบข้อมูล'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          กลับ
        </button>
      </div>
    );
  }

  const { batch } = data;
  const rows = rowsData?.rows || [];
  const totalRows = rowsData?.total || 0;
  const totalPages = Math.ceil(totalRows / limit);
  const errors = errorsData?.errors || [];
  const totalErrors = errorsData?.total || 0;
  const totalErrorPages = Math.ceil(totalErrors / errorLimit);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          รายละเอียด Batch: {batch.batchCode}
        </h1>
      </div>

      {/* Batch Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ข้อมูล Batch</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Batch Code:</span>
            <span className="ml-2 font-medium">{batch.batchCode}</span>
          </div>
          <div>
            <span className="text-gray-600">สถานะ:</span>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              batch.status === 'FAILED' ? 'bg-red-100 text-red-800' :
              batch.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {batch.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">ปี/เดือน:</span>
            <span className="ml-2 font-medium">{batch.year}/{batch.month}</span>
          </div>
          <div>
            <span className="text-gray-600">ชื่อไฟล์:</span>
            <span className="ml-2 font-medium">{batch.fileName}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Rows:</span>
            <span className="ml-2 font-medium">{batch.totalRows}</span>
          </div>
          <div>
            <span className="text-gray-600">Success Rows:</span>
            <span className="ml-2 font-medium text-green-600">{batch.successRows}</span>
          </div>
          <div>
            <span className="text-gray-600">Error Rows:</span>
            <span className="ml-2 font-medium text-red-600">{batch.errorRows}</span>
          </div>
          <div>
            <span className="text-gray-600">Skipped Rows:</span>
            <span className="ml-2 font-medium text-yellow-600">{batch.skippedRows}</span>
          </div>
          <div>
            <span className="text-gray-600">Upload Date:</span>
            <span className="ml-2 font-medium">
              {new Date(batch.uploadedAt).toLocaleString('th-TH')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Processed Date:</span>
            <span className="ml-2 font-medium">
              {batch.processedAt ? new Date(batch.processedAt).toLocaleString('th-TH') : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Planning Rows */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          ข้อมูล Planning Rows ({totalRows} รายการ)
        </h2>
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">สินค้า</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="VALID">VALID</option>
              <option value="INVALID">INVALID</option>
              <option value="SKIPPED">SKIPPED</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('customerCode');
                params.delete('productCode');
                params.delete('status');
                params.set('page', '1');
                router.push(`?${params.toString()}`);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(row.saleDate).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.customerCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.productCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.model || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.status === 'VALID' ? 'bg-green-100 text-green-800' :
                      row.status === 'INVALID' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </div>

      {/* Errors */}
      {totalErrors > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            ข้อผิดพลาด ({totalErrors} รายการ)
          </h2>
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Type</label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Code</label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  params.set('errorPage', '1');
                  router.push(`?${params.toString()}`);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errors.map((error) => (
                  <tr key={error.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {error.rowNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {error.errorType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {error.errorCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {error.errorMessage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        error.severity === 'ERROR' ? 'bg-red-100 text-red-800' :
                        error.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {error.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  );
}
