"use client";
import React, { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionReport {
  materialId: number;
  materialCode: string;
  materialName: string;
  receivingNo: string;
  receivingDate: string;
  issueDate: string | null;
  transactionId: number | null;
  transactionNo: string | null;
  referenceNo: string | null;
  transactionType: string | null;
  lotNo: string | null;
  received: number;
  issued: number;
  balance: number;
}

/** YYYY-MM-DD จาก API = วันปฏิทินไทย — parse ที่เที่ยง UTC+7 แล้วแสดงใน Asia/Bangkok */
function formatReportYmd(
  ymd: string | null | undefined,
  locale: 'th-TH' | 'en-GB' = 'th-TH',
): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '-';
  const d = new Date(`${ymd}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale, { timeZone: 'Asia/Bangkok' });
}

function isIssueRow(r: TransactionReport): boolean {
  return r.transactionId != null;
}

export default function PCReportPage() {
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch('/materials/all');
      const data = await res.json();
      setMaterials(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/materials/transactions/report/transactions?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (materialId) url += `materialId=${materialId}&`;

      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, materialId]);

  useEffect(() => {
    fetchMaterials();
    fetchReport();
  }, [fetchReport]);

  const handleSearch = () => {
    fetchReport();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setMaterialId('');
    setTimeout(() => fetchReport(), 100);
  };

  const rowToExport = (r: TransactionReport) => ({
    'เลขที่ใบรับ': r.receivingNo || '-',
    'วันที่รับเข้า': formatReportYmd(r.receivingDate, 'th-TH'),
    'วันที่จ่ายออก': formatReportYmd(r.issueDate ?? undefined, 'th-TH'),
    'เลขที่ใบจ่าย': r.referenceNo ?? '-',
    'เลขที่รายการ (TXN)': r.transactionNo ?? '-',
    'Lot': r.lotNo ?? '-',
    'ประเภท': r.transactionType ?? '-',
    'รหัสวัตถุดิบ': r.materialCode,
    'ชื่อวัตถุดิบ': r.materialName,
    'รับเข้า': r.received,
    'จ่ายออก': r.issued,
    'คงเหลือ': r.balance
  });

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(rowToExport));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายงาน');
    XLSX.writeFile(wb, `รายงานวัตถุดิบ_${new Date().toLocaleDateString('th-TH')}.xlsx`);
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(rowToExport));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `รายงานวัตถุดิบ_${new Date().toLocaleDateString('th-TH')}.csv`;
    link.click();
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    autoTable(doc, {
      head: [[
        'Recv.No', 'Recv.D', 'Iss.D', 'Iss.doc', 'TXN', 'Lot', 'Typ', 'Code', 'Name', 'In', 'Out', 'Bal'
      ]],
      body: reports.map(r => [
        r.receivingNo || '-',
        formatReportYmd(r.receivingDate, 'en-GB'),
        formatReportYmd(r.issueDate ?? undefined, 'en-GB'),
        r.referenceNo || '-',
        r.transactionNo || '-',
        r.lotNo || '-',
        r.transactionType || '-',
        r.materialCode || '',
        r.materialName || '',
        r.received?.toLocaleString() || '0',
        r.issued?.toLocaleString() || '0',
        r.balance?.toLocaleString() || '0'
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [55, 65, 81] },
    });
    doc.save(`Material_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="รายงาน" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">รายงานการรับเข้า-จ่ายออกวัตถุดิบ</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            รับเข้าสรุปต่อใบรับ — จ่ายออกแยกรายการตาม material_transactions (แต่ละครั้งจ่ายจาก lot) — คงเหลือสะสมต่อใบรับตามลำดับเวลา
          </p>
        </div>

        <ComponentCard title="ค้นหา">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ</label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">ทั้งหมด</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.matCode} - {m.matName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                ค้นหา
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-11 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title={`รายงาน (${reports.length})`}>
          {reports.length > 0 && (
            <div className="mb-4 flex gap-2">
              <button onClick={handleExportExcel} className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                Excel
              </button>
              <button onClick={handleExportCSV} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                CSV
              </button>
              <button onClick={handleExportPDF} className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                PDF
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบรับ</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่รับเข้า</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่จ่าย</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบจ่าย</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลข TXN</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Lot</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ประเภท</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัส วัตถุดิบ</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อ วัตถุดิบ</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">รับเข้า</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จ่ายออก</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report, index) => (
                    <tr
                      key={`${report.materialId}-${report.receivingNo}-${report.transactionId ?? 'recv'}-${index}`}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isIssueRow(report) ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}
                    >
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {report.receivingNo || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatReportYmd(report.receivingDate, 'th-TH')}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatReportYmd(report.issueDate ?? undefined, 'th-TH')}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {report.referenceNo ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-gray-800 dark:text-gray-200 max-w-[140px] truncate" title={report.transactionNo ?? ''}>
                        {report.transactionNo ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {report.lotNo ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {report.transactionType ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{report.materialCode}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{report.materialName}</td>
                      <td className="px-3 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {parseFloat(report.received.toString()).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {parseFloat(report.issued.toString()).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                        {parseFloat(report.balance.toString()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
