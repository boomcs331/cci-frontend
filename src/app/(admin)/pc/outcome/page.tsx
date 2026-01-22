"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import QRScannerModal from "@/components/qr/QRScannerModal";

export default function PCOutcomePage() {
  const searchParams = useSearchParams();
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [workOrderNo, setWorkOrderNo] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [showScanner, setShowScanner] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [outRes, matsRes] = await Promise.all([
          fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`),
          fetch('http://localhost:3006/materials/all')
        ]);
        const outData = await outRes.json();
        const matsData = await matsRes.json();
        if (outData.success) {
          setOutcomes(outData.data || []);
          setPagination(outData.pagination);
        }
        setMaterials(matsData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const session = localStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed.user?.username || 'admin');
      } catch (e) {}
    }
  }, [page, limit]);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!materialId) {
      alert('กรุณาเลือกวัตถุดิบ');
      return;
    }

    if (quantity === 0) {
      alert('กรุณาระบุจำนวน');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: any = {
        materialId,
        quantity,
        createBy: currentUser
      };

      if (department.trim()) payload.department = department.trim();
      if (workOrderNo.trim()) payload.workOrderNo = workOrderNo.trim();
      if (remark.trim()) payload.remark = remark.trim();

      const response = await fetch('http://localhost:3006/materials/transactions/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`จ่ายออกสำเร็จ! เลขที่ใบจ่าย: ${result.data.issueNo}`);
        setShowAddModal(false);
        resetForm();
        const outRes = await fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`);
        const outData = await outRes.json();
        if (outData.success) {
          setOutcomes(outData.data || []);
          setPagination(outData.pagination);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialId(null);
    setQuantity(0);
    setRemark('');
    setDepartment('');
    setWorkOrderNo('');
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายการจ่ายออก" />
        <ComponentCard title="รายการจ่ายออก">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายการจ่ายออก" />
      <div className="space-y-6">
        <ComponentCard title={`รายการจ่ายออก (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                ตรวจสอบ QR
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                จ่ายออก (FIFO)
              </button>
            </div>
          </div>

          {outcomes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบจ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่จ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">แผนก</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Work Order</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {outcomes.map((out) => (
                    <tr key={out.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{out.issueNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(out.issueDate).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{out.material?.matCode}</div>
                        <div className="text-xs text-gray-500">{out.material?.itemsName?.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {out.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {out.workOrderNo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{parseFloat(out.totalQuantity || 0).toLocaleString()} {out.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลรายการจ่ายออก</div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center">
                <a href={`?page=${Math.max(1, page - 1)}&limit=${limit}`} className={`mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  Previous
                </a>
                <div className="flex items-center gap-2">
                  {page > 3 && <span className="px-2">...</span>}
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(page - 1, 1);
                    return (
                      <a key={pageNum} href={`?page=${pageNum}&limit=${limit}`} className={`px-4 py-2 rounded ${
                        page === pageNum
                          ? "bg-brand-500 text-white"
                          : "text-gray-700 dark:text-gray-400"
                      } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}>
                        {pageNum}
                      </a>
                    );
                  })}
                  {page < pagination.totalPages - 2 && <span className="px-2">...</span>}
                </div>
                <a href={`?page=${Math.min(pagination.totalPages, page + 1)}&limit=${limit}`} className={`ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  Next
                </a>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">จ่ายวัตถุดิบออก (FIFO)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ *</label>
                    <select value={materialId ?? ''} onChange={(e) => setMaterialId(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required>
                      <option value="">-- เลือกวัตถุดิบ --</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.matCode} - {m.itemsName?.name || 'ไม่มีชื่อ'}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">จำนวน *</label>
                    <input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required min="0" step="0.01" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">แผนก</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลขที่ Work Order</label>
                    <input type="text" value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">หมายเหตุ</label>
                  <textarea value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows={3} />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" disabled={submitLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded">
                    {submitLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded">ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </div>
  );
}
