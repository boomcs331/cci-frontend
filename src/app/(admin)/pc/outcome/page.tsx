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
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<{id: number, quantity: number}[]>([]);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
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
        const [outRes, matsRes, prodsRes] = await Promise.all([
          fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`),
          fetch('http://localhost:3006/materials/all'),
          fetch('http://localhost:3006/products?page=1&limit=100')
        ]);
        const outData = await outRes.json();
        const matsData = await matsRes.json();
        const prodsData = await prodsRes.json();
        if (outData.success) {
          setOutcomes(outData.data || []);
          setPagination(outData.pagination);
        }
        setMaterials(matsData.data || []);
        setProducts(prodsData.data || []);
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
    
    if (selectedMaterials.length === 0) {
      alert('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ');
      return;
    }

    setSubmitLoading(true);
    try {
      for (const item of selectedMaterials) {
        const payload: any = {
          materialId: item.id,
          quantity: item.quantity,
          createBy: currentUser
        };

        if (department.trim()) payload.department = department.trim();
        if (workOrderNo.trim()) payload.workOrderNo = workOrderNo.trim();
        if (remark.trim()) payload.remark = remark.trim();

        await fetch('http://localhost:3006/materials/transactions/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      alert(`จ่ายออกสำเร็จ! จ่ายทั้งหมด ${selectedMaterials.length} รายการ`);
      setShowAddModal(false);
      resetForm();
      const outRes = await fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`);
      const outData = await outRes.json();
      if (outData.success) {
        setOutcomes(outData.data || []);
        setPagination(outData.pagination);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    materialSearch === '' || 
    m.matCode.toLowerCase().includes(materialSearch.toLowerCase()) ||
    (m.itemsName?.name || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

  const resetForm = () => {
    setMaterialId(null);
    setMaterialSearch('');
    setQuantity(0);
    setRemark('');
    setDepartment('');
    setWorkOrderNo('');
    setSelectedMaterials([]);
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">รายการจ่ายออกวัตถุดิบ</h2>
          </div>
        </div>

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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลือกสินค้า (BOM)</label>
                  <select 
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.id === Number(e.target.value));
                      setSelectedProduct(product || null);
                      if (product && product.boms) {
                        const pcBoms = product.boms.filter((b: any) => b.material.materialsType?.name === 'PC');
                        setSelectedMaterials(pcBoms.map((bom: any) => ({
                          id: bom.material.id,
                          quantity: parseFloat(bom.quantityPerUnit)
                        })));
                      } else {
                        setSelectedMaterials([]);
                      }
                    }}
                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- เลือกสินค้า --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
                    ))}
                  </select>
                </div>

                {selectedProduct && selectedProduct.boms && selectedProduct.boms.length > 0 && (
                  <div className="col-span-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">วัตถุดิบใน BOM (PC):</h4>
                      <button
                        type="button"
                        onClick={async () => {
                          const pcBoms = selectedProduct.boms.filter((b: any) => b.material.materialsType?.name === 'PC');
                          if (pcBoms.length === 0) {
                            alert('ไม่มีวัตถุดิบประเภท PC ใน BOM');
                            return;
                          }
                          if (!confirm(`ต้องการจ่ายวัตถุดิบ PC ทั้งหมด ${pcBoms.length} รายการ?`)) return;
                          
                          setSubmitLoading(true);
                          try {
                            for (const bom of pcBoms) {
                              const payload: any = {
                                materialId: bom.material.id,
                                quantity: parseFloat(bom.quantityPerUnit),
                                createBy: currentUser
                              };
                              if (department.trim()) payload.department = department.trim();
                              if (workOrderNo.trim()) payload.workOrderNo = workOrderNo.trim();
                              if (remark.trim()) payload.remark = remark.trim();
                              
                              await fetch('http://localhost:3006/materials/transactions/issue', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                              });
                            }
                            alert('จ่ายวัตถุดิบ PC ทั้งหมดสำเร็จ!');
                            setShowAddModal(false);
                            resetForm();
                            const outRes = await fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`);
                            const outData = await outRes.json();
                            if (outData.success) {
                              setOutcomes(outData.data || []);
                              setPagination(outData.pagination);
                            }
                          } catch (err) {
                            alert('เกิดข้อผิดพลาด');
                          } finally {
                            setSubmitLoading(false);
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        จ่าย PC ทั้งหมด
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedProduct.boms
                        .filter((bom: any) => bom.material.materialsType?.name === 'PC')
                        .map((bom: any) => (
                        <div key={bom.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{bom.material.matCode}</span>
                            <span className="text-xs text-gray-500 ml-2">{bom.material.materialsType?.name}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {parseFloat(bom.quantityPerUnit).toLocaleString()} {bom.unit}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMaterialId(bom.material.id);
                              setMaterialSearch(`${bom.material.matCode} - ${bom.material.materialsType?.name || 'ไม่มีชื่อ'}`);
                              setQuantity(parseFloat(bom.quantityPerUnit));
                            }}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            เลือก
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ *</label>
                    <div className="space-y-2">
                      {selectedProduct && selectedProduct.boms && selectedProduct.boms
                        .filter((bom: any) => bom.material.materialsType?.name === 'PC')
                        .map((bom: any) => {
                          const isChecked = selectedMaterials.some(m => m.id === bom.material.id);
                          const selectedItem = selectedMaterials.find(m => m.id === bom.material.id);
                          return (
                            <div key={bom.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-gray-800">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMaterials([...selectedMaterials, {id: bom.material.id, quantity: parseFloat(bom.quantityPerUnit)}]);
                                  } else {
                                    setSelectedMaterials(selectedMaterials.filter(m => m.id !== bom.material.id));
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{bom.material.matCode}</div>
                                <div className="text-xs text-gray-500">{bom.material.materialsType?.name}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={selectedItem?.quantity || parseFloat(bom.quantityPerUnit)}
                                  onChange={(e) => {
                                    const newQty = Number(e.target.value);
                                    if (isChecked) {
                                      setSelectedMaterials(selectedMaterials.map(m => 
                                        m.id === bom.material.id ? {...m, quantity: newQty} : m
                                      ));
                                    }
                                  }}
                                  disabled={!isChecked}
                                  className="w-24 h-9 rounded border px-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 disabled:opacity-50"
                                  min="0"
                                  step="0.01"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{bom.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const mat = materials.find(m => m.id === bom.material.id);
                                    if (mat && mat.lotSize) {
                                      if (isChecked) {
                                        setSelectedMaterials(selectedMaterials.map(m => 
                                          m.id === bom.material.id ? {...m, quantity: mat.lotSize} : m
                                        ));
                                      }
                                    }
                                  }}
                                  disabled={!isChecked}
                                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                                >
                                  Lot
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
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
