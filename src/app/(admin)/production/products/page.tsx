"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";

/** FK จากฟอร์ม → ตัวเลขบวก หรือ null (ส่ง JSON ให้ backend ชัดเจน) */
function normalizeFk(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(Number(v))) return null;
  const n = Math.trunc(Number(v));
  return n > 0 ? n : null;
}

function normalizeOptionalNonNegInt(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(Number(v))) return null;
  return Math.trunc(Number(v));
}

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
    productTypeId: null as number | null,
    defaultLocationId: null as number | null,
    lr: '',
    lotSize: null as number | null,
    minStock: null as number | null,
    customerId: null as number | null,
    modelId: null as number | null,
    deliveryTypeId: null as number | null,
    unitId: null as number | null,
    scale: '',
    loadingPointId: null as number | null,
    processLineId: null as number | null,
    isActive: true,
    bom: [] as Array<{materialId: number; quantityPerUnit: number; unit: string; remarks?: string}>
  });
  const [materials, setMaterials] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loadingPoints, setLoadingPoints] = useState<any[]>([]);
  const [processLines, setProcessLines] = useState<any[]>([]);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/products?page=${page}&limit=${limit}`);
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
  }, [page, limit]);

  useEffect(() => {
    void fetchProducts();
    fetchMaterials();
    fetchLocations();
    fetchCustomers();
    fetchProductTypes();
    fetchModels();
    fetchDeliveryTypes();
    fetchUnits();
    fetchLoadingPoints();
    fetchProcessLines();
  }, [fetchProducts]);

  const fetchMaterials = async () => {
    try {
      const response = await apiFetch(`/materials/all`);
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
      const response = await apiFetch(`/masters/products/locations/all`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiFetch(`/masters/products/customers/all`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await apiFetch(`/masters/products/types/all`);
      if (response.ok) {
        const data = await response.json();
        setProductTypes(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await apiFetch(`/masters/products/models/all`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryTypes = async () => {
    try {
      const response = await apiFetch(`/masters/products/delivery-types/all`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryTypes(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await apiFetch(`/masters/products/units/all`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLoadingPoints = async () => {
    try {
      const response = await apiFetch(`/masters/products/loading-points/all`);
      if (response.ok) {
        const data = await response.json();
        setLoadingPoints(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProcessLines = async () => {
    try {
      const response = await apiFetch(`/masters/products/process-lines/all`);
      if (response.ok) {
        const data = await response.json();
        setProcessLines(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { bom, ...rest } = formData;
      const productData = {
        ...rest,
        productTypeId: normalizeFk(rest.productTypeId),
        defaultLocationId: normalizeFk(rest.defaultLocationId),
        lotSize: normalizeOptionalNonNegInt(rest.lotSize),
        minStock: normalizeOptionalNonNegInt(rest.minStock),
        customerId: normalizeFk(rest.customerId),
        modelId: normalizeFk(rest.modelId),
        deliveryTypeId: normalizeFk(rest.deliveryTypeId),
        unitId: normalizeFk(rest.unitId),
        loadingPointId: normalizeFk(rest.loadingPointId),
        processLineId: normalizeFk(rest.processLineId),
      };
      const response = await apiFetch(`/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (response.ok && result.data?.id) {
        if (bom.length > 0) {
          const bomResponse = await apiFetch(`/products/${result.data.id}/bom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: bom }),
          });
          if (bomResponse.ok) {
            const bomResult = await bomResponse.json();
            alert(bomResult.message || result.message || 'เพิ่ลสินค้าสำเร็จ');
          } else {
            const bomResult = await bomResponse.json();
            alert('เกิดข้อผิดพลาด: ' + (bomResult.message || JSON.stringify(bomResult)));
            setSaving(false);
            return;
          }
        } else {
          alert(result.message || 'เพิ่มสินค้าสำเร็จ');
        }
        setShowAddModal(false);
        setFormData({ productCode: '', productName: '', description: '', productTypeId: null, defaultLocationId: null, lr: '', lotSize: null, minStock: null, customerId: null, modelId: null, deliveryTypeId: null, unitId: null, scale: '', loadingPointId: null, processLineId: null, isActive: true, bom: [] });
        fetchProducts();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || JSON.stringify(result)));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { bom, ...rest } = formData;
      const productData = {
        ...rest,
        productTypeId: normalizeFk(rest.productTypeId),
        defaultLocationId: normalizeFk(rest.defaultLocationId),
        lotSize: normalizeOptionalNonNegInt(rest.lotSize),
        minStock: normalizeOptionalNonNegInt(rest.minStock),
        customerId: normalizeFk(rest.customerId),
        modelId: normalizeFk(rest.modelId),
        deliveryTypeId: normalizeFk(rest.deliveryTypeId),
        unitId: normalizeFk(rest.unitId),
        loadingPointId: normalizeFk(rest.loadingPointId),
        processLineId: normalizeFk(rest.processLineId),
      };
      const response = await apiFetch(`/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (response.ok) {
        if (bom.length > 0) {
          const bomResponse = await apiFetch(`/products/${selectedProduct.id}/bom`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bom),
          });
          if (bomResponse.ok) {
            const bomResult = await bomResponse.json();
            alert(bomResult.message || result.message || 'อัพเดทสินค้าสำเร็จ');
          } else {
            const bomResult = await bomResponse.json();
            alert('เกิดข้อผิดพลาด: ' + (bomResult.message || JSON.stringify(bomResult)));
            setSaving(false);
            return;
          }
        } else {
          alert(result.message || 'อัพเดทสินค้าสำเร็จ');
        }
        setShowEditModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || JSON.stringify(result)));
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
      productTypeId: product.productTypeId,
      defaultLocationId: product.defaultLocationId,
      lr: product.lr || '',
      lotSize: product.lotSize,
      minStock: product.minStock,
      customerId: product.customerId,
      modelId: product.modelId,
      deliveryTypeId: product.deliveryTypeId,
      unitId: product.unitId != null ? normalizeFk(product.unitId) : null,
      scale: product.scale || '',
      loadingPointId: product.loadingPointId,
      processLineId: product.processLineId,
      isActive: product.isActive,
      bom: []
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบสินค้านี้หรือไม่?')) return;
    try {
      const response = await apiFetch(`/products/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'ลบสินค้าสำเร็จ');
        fetchProducts();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || JSON.stringify(result)));
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
              <table className="min-w-max w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">รหัสสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">ชื่อสินค้า</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">คำอธิบาย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">LR</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Lot Size</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Min Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Scale</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">BOMs</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">สถานะ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-800">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{prod.productCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{prod.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.lr || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.lotSize || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.minStock || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.scale || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{prod.boms?.length || 0}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${prod.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {prod.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-gray-900">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => router.push(`/production/products/${prod.id}/bom`)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400" title="จัดการ BOM">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </button>
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
          {pagination && <PaginationFooter page={pagination.page} limit={pagination.limit} total={pagination.total} totalPages={pagination.totalPages} />}
        </ComponentCard>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่มสินค้าใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 140px)'}}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">รหัสสินค้า <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.productCode} onChange={(e) => setFormData({...formData, productCode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">คำอธิบาย</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">LR</label>
                  <input type="text" value={formData.lr} onChange={(e) => setFormData({...formData, lr: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ขนาดล็อต</label>
                  <input type="number" value={formData.lotSize || ''} onChange={(e) => setFormData({...formData, lotSize: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สต็อกขั้นต่ำ</label>
                  <input type="number" value={formData.minStock || ''} onChange={(e) => setFormData({...formData, minStock: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สเกล</label>
                  <input type="text" value={formData.scale} onChange={(e) => setFormData({...formData, scale: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ประเภทสินค้า</label>
                  <select value={formData.productTypeId || ''} onChange={(e) => setFormData({...formData, productTypeId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หน่วย</label>
                  <select value={formData.unitId || ''} onChange={(e) => setFormData({...formData, unitId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ลูกค้า</label>
                  <select value={formData.customerId || ''} onChange={(e) => setFormData({...formData, customerId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">โมเดล</label>
                  <select value={formData.modelId || ''} onChange={(e) => setFormData({...formData, modelId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ประเภทการส่ง</label>
                  <select value={formData.deliveryTypeId || ''} onChange={(e) => setFormData({...formData, deliveryTypeId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {deliveryTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">จุดขนถ่าย</label>
                  <select value={formData.loadingPointId || ''} onChange={(e) => setFormData({...formData, loadingPointId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {loadingPoints.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สายการผลิต</label>
                  <select value={formData.processLineId || ''} onChange={(e) => setFormData({...formData, processLineId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {processLines.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สถานที่เริ่มต้น</label>
                  <select value={formData.defaultLocationId || ''} onChange={(e) => setFormData({...formData, defaultLocationId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">ใช้งาน</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">รายการวัตถุดิบ (BOM)</h4>
                  <button type="button" onClick={() => setFormData({...formData, bom: [...formData.bom, {materialId: 0, quantityPerUnit: 0, unit: 'PCS', remarks: ''}]})} className="text-sm text-blue-600 hover:text-blue-800">+ เพิ่มวัตถุดิบ</button>
                </div>
                {formData.bom.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <select value={item.materialId} onChange={(e) => { const newBom = [...formData.bom]; newBom[idx].materialId = parseInt(e.target.value); setFormData({...formData, bom: newBom}); }} className="col-span-4 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                      <option value="0">เลือกวัตถุดิบ</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.matCode} - {m.matName}</option>)}
                    </select>
                    <input type="number" step="0.01" value={item.quantityPerUnit || ''} onChange={(e) => { const newBom = [...formData.bom]; newBom[idx].quantityPerUnit = parseFloat(e.target.value) || 0; setFormData({...formData, bom: newBom}); }} placeholder="จำนวน" className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                    <select value={item.unit} onChange={(e) => { const newBom = [...formData.bom]; newBom[idx].unit = e.target.value; setFormData({...formData, bom: newBom}); }} className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                      <option value="PCS">PCS</option>
                      <option value="KG">KG</option>
                      <option value="L">L</option>
                      <option value="M">M</option>
                    </select>
                    <input type="text" value={item.remarks || ''} onChange={(e) => { const newBom = [...formData.bom]; newBom[idx].remarks = e.target.value; setFormData({...formData, bom: newBom}); }} placeholder="หมายเหตุ" className="col-span-3 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                    <button type="button" onClick={() => setFormData({...formData, bom: formData.bom.filter((_, i) => i !== idx)})} className="col-span-1 text-red-600 hover:text-red-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
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
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">แก้ไขสินค้า</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 140px)'}}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">รหัสสินค้า <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.productCode} onChange={(e) => setFormData({...formData, productCode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">คำอธิบาย</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">LR</label>
                  <input type="text" value={formData.lr} onChange={(e) => setFormData({...formData, lr: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ขนาดล็อต</label>
                  <input type="number" value={formData.lotSize || ''} onChange={(e) => setFormData({...formData, lotSize: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สต็อกขั้นต่ำ</label>
                  <input type="number" value={formData.minStock || ''} onChange={(e) => setFormData({...formData, minStock: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สเกล</label>
                  <input type="text" value={formData.scale} onChange={(e) => setFormData({...formData, scale: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ประเภทสินค้า</label>
                  <select value={formData.productTypeId || ''} onChange={(e) => setFormData({...formData, productTypeId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หน่วย</label>
                  <select value={formData.unitId || ''} onChange={(e) => setFormData({...formData, unitId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ลูกค้า</label>
                  <select value={formData.customerId || ''} onChange={(e) => setFormData({...formData, customerId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">โมเดล</label>
                  <select value={formData.modelId || ''} onChange={(e) => setFormData({...formData, modelId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">ประเภทการส่ง</label>
                  <select value={formData.deliveryTypeId || ''} onChange={(e) => setFormData({...formData, deliveryTypeId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {deliveryTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">จุดขนถ่าย</label>
                  <select value={formData.loadingPointId || ''} onChange={(e) => setFormData({...formData, loadingPointId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {loadingPoints.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สายการผลิต</label>
                  <select value={formData.processLineId || ''} onChange={(e) => setFormData({...formData, processLineId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {processLines.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">สถานที่เริ่มต้น</label>
                  <select value={formData.defaultLocationId || ''} onChange={(e) => setFormData({...formData, defaultLocationId: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    <option value="">ไม่ระบุ</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
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
