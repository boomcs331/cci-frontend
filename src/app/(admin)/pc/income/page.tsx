"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";

interface Lot {
  quantity: number;
  locationId?: number;
  expiryDate?: string;
}

export default function PCIncomePage() {
  const searchParams = useSearchParams();
  const [receivings, setReceivings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReceiving, setSelectedReceiving] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [poNo, setPoNo] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [locationId, setLocationId] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('admin');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Auto-fill supplier and location when material is selected
  const handleMaterialChange = (matId: number) => {
    setMaterialId(matId);
    const selectedMaterial = materials.find(m => m.id === matId);
    if (selectedMaterial) {
      if (selectedMaterial.supplierId) setSupplierId(selectedMaterial.supplierId);
      if (selectedMaterial.defaultLocationId) setLocationId(selectedMaterial.defaultLocationId);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rcvRes, matsRes, locsRes, suppsRes] = await Promise.all([
          fetch(`http://localhost:3006/materials/transactions/receivings?page=${page}&limit=${limit}`),
          fetch('http://localhost:3006/materials/all'),
          fetch('http://localhost:3006/materials/locations/all'),
          fetch('http://localhost:3006/materials/suppliers/all')
        ]);
        const rcvData = await rcvRes.json();
        const matsData = await matsRes.json();
        const locsData = await locsRes.json();
        const suppsData = await suppsRes.json();
        if (rcvData.success) {
          setReceivings(rcvData.data || []);
          setPagination(rcvData.pagination);
        }
        setMaterials(matsData.data || []);
        setLocations(locsData.data || []);
        setSuppliers(suppsData.data || []);
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
    if (showDetailModal || showAddModal || showQRModal || showPrintAllModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showAddModal, showQRModal, showPrintAllModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!materialId) {
      alert('กรุณาเลือกวัตถุดิบ');
      return;
    }
    
    if (quantity === 0) {
      alert('กรุณาระบุจำนวนวัตถุดิบ');
      return;
    }

    setSubmitLoading(true);
    try {
      // เตรียมข้อมูลส่ง - ส่งเฉพาะ field ที่มีค่า
      const payload: any = {
        materialId,
        totalQuantity: quantity,
        locationId,
        createBy: currentUser
      };
      
      // เพิ่ม optional fields เฉพาะที่มีค่า
      if (supplierId && supplierId > 0) payload.supplierId = supplierId;
      if (poNo && poNo.trim()) payload.poNo = poNo.trim();
      if (remark && remark.trim()) payload.remark = remark.trim();
      if (expiryDate) payload.expiryDate = expiryDate;

      console.log('Sending payload:', payload);

      const response = await fetch('http://localhost:3006/materials/transactions/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`รับวัตถุดิบสำเร็จ! เลขที่ใบรับ: ${result.data.receivingNo}`);
        setShowAddModal(false);
        setMaterialId(null);
        setSupplierId(0);
        setPoNo('');
        setRemark('');
        setLocationId(1);
        setExpiryDate('');
        setQuantity(0);
        const rcvRes = await fetch(`http://localhost:3006/materials/transactions/receivings?page=${page}&limit=${limit}`);
        const rcvData = await rcvRes.json();
        if (rcvData.success) {
          setReceivings(rcvData.data || []);
          setPagination(rcvData.pagination);
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

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      USED_UP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      PARTIAL_USED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายการรับเข้า" />
        <ComponentCard title="รายการรับเข้าวัตถุดิบ">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายการรับเข้า" />
      <div className="space-y-6">
        <ComponentCard title={`รายการรับเข้าวัตถุดิบ (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              รับเข้า
            </button>
          </div>

          {receivings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบรับ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่รับ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ซัพพลายเออร์</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">PO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {receivings.map((rcv) => (
                    <tr key={rcv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{rcv.receivingNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(rcv.receivingDate).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{rcv.material?.matCode}</div>
                        <div className="text-xs text-gray-500">{rcv.material?.itemsName?.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rcv.supplier?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{parseFloat(rcv.totalQuantity).toLocaleString()} {rcv.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rcv.poNo || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(rcv.status)}`}>{rcv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedReceiving(rcv); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400" title="รายละเอียด">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => { setSelectedReceiving(rcv); setShowPrintAllModal(true); }} className="text-green-600 hover:text-green-800 dark:text-green-400" title="พิมพ์ QR Code ทั้งหมด">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลรายการรับเข้า</div>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">รับวัตถุดิบเข้า</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ *</label>
                  <select value={materialId ?? ''} onChange={(e) => handleMaterialChange(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required>
                    <option value="">-- เลือกวัตถุดิบ --</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.matCode} - {m.itemsName?.name || 'ไม่มีชื่อ'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">จำนวน *</label>
                  <input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ซัพพลายเออร์</label>
                  <select value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <option value={0}>ไม่ระบุ</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ที่เก็บ *</label>
                  <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลขที่ PO</label>
                  <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">หมายเหตุ</label>
                  <textarea value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows={3} />
                </div>
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

      {showDetailModal && selectedReceiving && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">รายละเอียดการรับเข้า</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">เลขที่ใบรับ:</span> {selectedReceiving.receivingNo}</div>
                <div><span className="font-medium">วันที่รับ:</span> {new Date(selectedReceiving.receivingDate).toLocaleString('th-TH')}</div>
                <div><span className="font-medium">วัตถุดิบ:</span> {selectedReceiving.material?.matCode} - {selectedReceiving.material?.itemsName?.name}</div>
                <div><span className="font-medium">ซัพพลายเออร์:</span> {selectedReceiving.supplier?.name || '-'}</div>
                <div><span className="font-medium">จำนวนรวม:</span> {parseFloat(selectedReceiving.totalQuantity).toLocaleString()} {selectedReceiving.unit}</div>
                <div><span className="font-medium">PO:</span> {selectedReceiving.poNo || '-'}</div>
                <div className="col-span-2"><span className="font-medium">หมายเหตุ:</span> {selectedReceiving.remark || '-'}</div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">รายการ Lot ({selectedReceiving.lots?.length || 0})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-3 py-2 text-left">Lot No</th>
                        <th className="px-3 py-2 text-center">QR Code</th>
                        <th className="px-3 py-2 text-right">จำนวน</th>
                        <th className="px-3 py-2 text-right">คงเหลือ</th>
                        <th className="px-3 py-2 text-left">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedReceiving.lots?.map((lot: any) => (
                        <tr key={lot.id}>
                          <td className="px-3 py-2">{lot.lotNo}</td>
                          <td className="px-3 py-2 text-center">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(lot.qrCode)}`}
                              alt="QR"
                              className="w-20 h-20 mx-auto cursor-pointer hover:opacity-80"
                              onClick={() => { setSelectedLot(lot); setShowQRModal(true); }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">{parseFloat(lot.quantity).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{parseFloat(lot.remainingQuantity).toLocaleString()}</td>
                          <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(lot.status)}`}>{lot.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQRModal && selectedLot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">QR Code - {selectedLot.lotNo}</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(selectedLot.qrCode)}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">เลข Lot:</span> {selectedLot.lotNo}</div>
                <div><span className="font-medium">QR Code:</span> {selectedLot.qrCode}</div>
                <div><span className="font-medium">จำนวน:</span> {parseFloat(selectedLot.quantity).toLocaleString()} {selectedLot.unit}</div>
                <div><span className="font-medium">คงเหลือ:</span> {parseFloat(selectedLot.remainingQuantity).toLocaleString()} {selectedLot.unit}</div>
              </div>
              <button onClick={() => window.print()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                พิมพ์ QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintAllModal && selectedReceiving && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4" id="print-modal">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center print:hidden">
              <h3 className="text-xl font-semibold">พิมพ์สติ๊กเกอร์ QR Code - {selectedReceiving.receivingNo}</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  พิมพ์
                </button>
                <button onClick={() => setShowPrintAllModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}} id="print-content">
              <div className="grid grid-cols-3 gap-4" id="qr-grid">
                {selectedReceiving.lots?.map((lot: any) => (
                  <div key={lot.id} className="qr-sticker border-2 border-dashed border-gray-300 p-4 rounded-lg bg-white text-center break-inside-avoid">
                    <div className="bg-white p-2 inline-block mb-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lot.qrCode)}`}
                        alt="QR"
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-bold text-base">{selectedReceiving.material?.matCode}</div>
                      <div className="text-xs text-gray-600">{selectedReceiving.material?.itemsName?.name}</div>
                      <div className="font-semibold">Lot: {lot.lotNo}</div>
                      <div>จำนวน: {parseFloat(lot.quantity).toLocaleString()} {selectedReceiving.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Print styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      
      body * {
        visibility: hidden;
      }
      
      .print\\:hidden {
        display: none !important;
      }
      
      #print-modal,
      #print-modal *,
      #print-content,
      #print-content *,
      #qr-grid,
      #qr-grid *,
      .qr-sticker,
      .qr-sticker * {
        visibility: visible !important;
      }
      
      #print-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
      }
      
      #print-modal > div {
        position: static !important;
        max-width: 100% !important;
        max-height: 100% !important;
        overflow: visible !important;
        box-shadow: none !important;
      }
      
      #print-content {
        max-height: none !important;
        overflow: visible !important;
      }
      
      #qr-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 0.5cm !important;
      }
      
      .qr-sticker {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;
  document.head.appendChild(style);
}
