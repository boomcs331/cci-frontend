"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/master-data/PaginationFooter";

export default function MaterialIssuesPage() {
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    documentNo: '',
    documentFile: '',
    remarks: '',
    items: [] as Array<{materialId: number; quantity: number; unit: string; fromLocationId: number; remarks: string}>
  });
  const [productionFormData, setProductionFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    productionOrderNo: '',
    productId: null as number | null,
    productionQuantity: null as number | null,
    documentFile: '',
    fromLocationId: null as number | null,
    remarks: ''
  });
  const [materials, setMaterials] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<any[]>([]);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  useEffect(() => {
    fetchIssues();
    fetchMaterials();
    fetchLocations();
    fetchProducts();
  }, [page, limit]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/materials/all`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/products/locations/all`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/all`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material-issues?page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.data || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBomItems = async (productId?: number, quantity?: number) => {
    const pid = productId || productionFormData.productId;
    const qty = quantity || productionFormData.productionQuantity || 1;
    if (!pid) {
      setBomItems([]);
      return;
    }
    console.log('Fetching BOM for productId:', pid, 'quantity:', qty);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material-issues/production/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: pid,
          productionQuantity: qty
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setBomItems(result.data?.requiredMaterials || []);
      }
    } catch (error) {
      console.error('Error fetching BOM:', error);
      setBomItems([]);
    }
  };

  const handlePreview = async () => {
    if (!productionFormData.productId || !productionFormData.productionQuantity) {
      alert('กรุณาเลือกสินค้าและระบุจำนวนผลิต');
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material-issues/production/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productionFormData.productId,
          productionQuantity: productionFormData.productionQuantity
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setPreviewData(result.data);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualFormData),
      });
      if (response.ok) {
        setShowManualModal(false);
        setManualFormData({ issueDate: new Date().toISOString().split('T')[0], documentNo: '', documentFile: '', remarks: '', items: [] });
        fetchIssues();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material-issues/production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productionFormData),
      });
      if (response.ok) {
        setShowProductionModal(false);
        setProductionFormData({ issueDate: new Date().toISOString().split('T')[0], productionOrderNo: '', productId: null, productionQuantity: null, documentFile: '', fromLocationId: null, remarks: '' });
        fetchIssues();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="จ่ายวัตถุดิบออก" />
        <ComponentCard title="จ่ายวัตถุดิบออก">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="จ่ายวัตถุดิบออก" />
      <div className="space-y-6">
        <ComponentCard title={`รายการจ่ายวัตถุดิบออก (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex gap-2">
              <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">จ่ายแบบ Manual</button>
              <button onClick={() => setShowProductionModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">จ่ายตาม BOM</button>
            </div>
          </div>

          {issues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่จ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ประเภท</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">หมายเหตุ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{issue.issueNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(issue.issueDate).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{issue.issueType}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{issue.remarks || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${issue.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {issue.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูล</div>
          )}
          {pagination && <PaginationFooter page={pagination.page} limit={pagination.limit} total={pagination.total} totalPages={pagination.totalPages} />}
        </ComponentCard>
      </div>

      {showManualModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">จ่ายวัตถุดิบแบบ Manual</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 140px)'}}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">วันที่ *</label>
                  <input type="date" value={manualFormData.issueDate} onChange={(e) => setManualFormData({...manualFormData, issueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">เลขที่เอกสาร *</label>
                  <input type="text" value={manualFormData.documentNo} onChange={(e) => setManualFormData({...manualFormData, documentNo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ไฟล์เอกสาร (URL)</label>
                <input type="text" value={manualFormData.documentFile} onChange={(e) => setManualFormData({...manualFormData, documentFile: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หมายเหตุ</label>
                <textarea value={manualFormData.remarks} onChange={(e) => setManualFormData({...manualFormData, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">รายการวัตถุดิบ</h4>
                  <button type="button" onClick={() => setManualFormData({...manualFormData, items: [...manualFormData.items, {materialId: 0, quantity: 0, unit: 'PCS', fromLocationId: 0, remarks: ''}]})} className="text-sm text-blue-600 hover:text-blue-800">+ เพิ่มวัตถุดิบ</button>
                </div>
                {manualFormData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <select value={item.materialId} onChange={(e) => { const newItems = [...manualFormData.items]; newItems[idx].materialId = parseInt(e.target.value); setManualFormData({...manualFormData, items: newItems}); }} className="col-span-3 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                      <option value="0">เลือกวัตถุดิบ</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.matCode} - {m.matName}</option>)}
                    </select>
                    <input type="number" step="0.01" value={item.quantity || ''} onChange={(e) => { const newItems = [...manualFormData.items]; newItems[idx].quantity = parseFloat(e.target.value) || 0; setManualFormData({...manualFormData, items: newItems}); }} placeholder="จำนวน" className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                    <select value={item.unit} onChange={(e) => { const newItems = [...manualFormData.items]; newItems[idx].unit = e.target.value; setManualFormData({...manualFormData, items: newItems}); }} className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                      <option value="PCS">PCS</option>
                      <option value="KG">KG</option>
                      <option value="L">L</option>
                      <option value="M">M</option>
                    </select>
                    <select value={item.fromLocationId} onChange={(e) => { const newItems = [...manualFormData.items]; newItems[idx].fromLocationId = parseInt(e.target.value); setManualFormData({...manualFormData, items: newItems}); }} className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                      <option value="0">สถานที่</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="text" value={item.remarks || ''} onChange={(e) => { const newItems = [...manualFormData.items]; newItems[idx].remarks = e.target.value; setManualFormData({...manualFormData, items: newItems}); }} placeholder="หมายเหตุ" className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                    <button type="button" onClick={() => setManualFormData({...manualFormData, items: manualFormData.items.filter((_, i) => i !== idx)})} className="col-span-1 text-red-600 hover:text-red-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">จ่ายวัตถุดิบตาม BOM</h3>
              <button onClick={() => setShowProductionModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleProductionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">วันที่ *</label>
                  <input type="date" value={productionFormData.issueDate} onChange={(e) => setProductionFormData({...productionFormData, issueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">เลขที่ใบสั่งผลิต *</label>
                  <input type="text" value={productionFormData.productionOrderNo} onChange={(e) => setProductionFormData({...productionFormData, productionOrderNo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สินค้า *</label>
                  <select value={productionFormData.productId || ''} onChange={(e) => { const pid = e.target.value ? parseInt(e.target.value) : null; setProductionFormData({...productionFormData, productId: pid, productionQuantity: 1}); if (pid) fetchBomItems(pid, 1); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required>
                    <option value="">เลือกสินค้า</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">จำนวนผลิต *</label>
                  <input type="number" min="1" value={productionFormData.productionQuantity || ''} onChange={(e) => { const qty = e.target.value ? parseInt(e.target.value) : null; setProductionFormData({...productionFormData, productionQuantity: qty}); if (productionFormData.productId && qty) fetchBomItems(productionFormData.productId, qty); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สถานที่จ่าย *</label>
                <select value={productionFormData.fromLocationId || ''} onChange={(e) => setProductionFormData({...productionFormData, fromLocationId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required>
                  <option value="">เลือกสถานที่</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ไฟล์เอกสาร (URL)</label>
                <input type="text" value={productionFormData.documentFile} onChange={(e) => setProductionFormData({...productionFormData, documentFile: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หมายเหตุ</label>
                <textarea value={productionFormData.remarks} onChange={(e) => setProductionFormData({...productionFormData, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              {productionFormData.productId && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">รายการวัตถุดิบที่จะจ่าย ({bomItems.length})</h4>
                  {bomItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white border-b">รหัส</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white border-b">วัตถุดิบ</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white border-b">จำนวน</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-900 dark:text-white border-b">หน่วย</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {bomItems.map((item: any, idx: number) => (
                            <tr key={idx} className={!item.isAvailable ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{item.materialCode}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{item.materialName}</td>
                              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{item.requiredQuantity}</td>
                              <td className="px-3 py-2 text-center text-gray-900 dark:text-white">{item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">ไม่พบรายการวัตถุดิบสำหรับสินค้านี้</p>
                  )}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handlePreview} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md">ดูตัวอย่าง</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                <button type="button" onClick={() => setShowProductionModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ตัวอย่างการจ่ายวัตถุดิบ</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">สินค้า: {previewData.product?.productName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนผลิต: {previewData.productionQuantity}</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">วัตถุดิบ</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวนต่อหน่วย</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวนที่ต้องจ่าย</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {previewData.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.material?.matCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.material?.matName}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{item.quantityPerUnit}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{item.issuedQuantity}</td>
                      <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-white">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6">
                <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
