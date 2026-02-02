"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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
    fetchProducts();
  }, [page, limit]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ productCode: '', productName: '', description: '', unit: 'ชิ้น', isActive: true });
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      description: product.description || '',
      unit: product.unit,
      isActive: product.isActive
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบสินค้านี้หรือไม่?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายการสินค้า" />
        <ComponentCard title="รายการสินค้า">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายการสินค้า" />
      <div className="space-y-6">
        <ComponentCard title={`รายการสินค้า (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มสินค้า
            </button>
          </div>

          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">คำอธิบาย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{prod.productCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{prod.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{prod.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{prod.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${prod.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {prod.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEditModal(prod)} className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่มสินค้าใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
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
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">แก้ไขสินค้า</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
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
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
