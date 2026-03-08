"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { getApiUrl } from "@/utils/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionReport {
  materialId: number;
  materialCode: string;
  materialName: string;
  transactionDate: string;
  received: number;
  issued: number;
  balance: number;
}

export default function PCReportPage() {
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetchMaterials();
    fetchReport();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch(getApiUrl('/materials/all'));
      const data = await res.json();
      setMaterials(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '/materials/transactions/report/transactions?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (materialId) url += `materialId=${materialId}&`;

      const res = await fetch(getApiUrl(url));
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReport();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setMaterialId('');
    setTimeout(() => fetchReport(), 100);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(r => ({
      'วันที่': new Date(r.transactionDate).toLocaleDateString('th-TH'),
      'รหัสวัตถุดิบ': r.materialCode,
      'ชื่อวัตถุดิบ': r.materialName,
      'รับเข้า': r.received,
      'จ่ายออก': r.issued,
      'คงเหลือ': r.balance
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายงาน');
    XLSX.writeFile(wb, `รายงานวัตถุดิบ_${new Date().toLocaleDateString('th-TH')}.xlsx`);
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(r => ({
      'วันที่': new Date(r.transactionDate).toLocaleDateString('th-TH'),
      'รหัสวัตถุดิบ': r.materialCode,
      'ชื่อวัตถุดิบ': r.materialName,
      'รับเข้า': r.received,
      'จ่ายออก': r.issued,
      'คงเหลือ': r.balance
    })));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `รายงานวัตถุดิบ_${new Date().toLocaleDateString('th-TH')}.csv`;
    link.click();
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    
    autoTable(doc, {
      head: [['Date', 'Code', 'Name', 'Received', 'Issued', 'Balance']],
      body: reports.map(r => [
        new Date(r.transactionDate).toLocaleDateString('en-GB'),
        r.materialCode || '',
        r.materialName || '',
        r.received?.toLocaleString() || '0',
        r.issued?.toLocaleString() || '0',
        r.balance?.toLocaleString() || '0'
      ])
    });
    doc.save(`Material_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="รายงาน" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">รายงานการรับเข้า-จ่ายออกวัตถุดิบ</h2>
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
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อวัตถุดิบ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">รับเข้า</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จ่ายออก</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report, index) => (
                    <tr key={`${report.materialId}-${report.transactionDate}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(report.transactionDate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{report.materialCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{report.materialName}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {parseFloat(report.received.toString()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {parseFloat(report.issued.toString()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
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