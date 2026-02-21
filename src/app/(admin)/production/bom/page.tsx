"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";

export default function ProductionBOMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    description: '',
    unit: 'ชิ้น',
    isActive: true
  });

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?page=${page}&limit=${limit}`);
        const result = await response.json();
        setProducts(result.data || []);
        setPagination(result.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, limit]);

  const viewBOM = (product: any) => {
    setSelectedProduct(product);
    setShowBOMModal(true);
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Production BOM" />
        <ComponentCard title="Production BOM">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Production BOM" />
      <div className="space-y-6">
        <ComponentCard title={`รายการสินค้า (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/production/bom-add')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่ม BOM
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มสินค้า
              </button>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">BOM</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{prod.productCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{prod.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{prod.unit}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{prod.boms?.length || 0} รายการ</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => viewBOM(prod)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลสินค้า</div>
          )}
        </ComponentCard>
      </div>

      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่มสินค้าใหม่</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData),
                });
                if (response.ok) {
                  setShowAddProductModal(false);
                  setFormData({ productCode: '', productName: '', description: '', unit: 'ชิ้น', isActive: true });
                  window.location.reload();
                }
              } catch (error) {
                console.error(error);
              } finally {
                setSaving(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">รหัสสินค้า <span className="text-red-500">*</span></label>
                <input type="text" value={formData.productCode} onChange={(e) => setFormData({...formData, productCode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">คำอธิบาย</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หน่วย <span className="text-red-500">*</span></label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required>
                  <option value="ชิ้น">ชิ้น</option>
                  <option value="กล่อง">กล่อง</option>
                  <option value="แพ็ค">แพ็ค</option>
                  <option value="ลัง">ลัง</option>
                  <option value="กิโลกรัม">กิโลกรัม</option>
                  <option value="ลิตร">ลิตร</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">ใช้งาน</span>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowAddProductModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBOMModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">BOM - {selectedProduct.productCode}</h3>
              <button onClick={() => setShowBOMModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{selectedProduct.productName}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">หน่วย: {selectedProduct.unit}</p>
              </div>

              {selectedProduct.boms && selectedProduct.boms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ลำดับ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ประเภท</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedProduct.boms.map((bom: any) => (
                        <tr key={bom.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{bom.sequenceOrder}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{bom.material.matCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{bom.material.materialsType?.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{parseFloat(bom.quantityPerUnit).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{bom.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล BOM</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}