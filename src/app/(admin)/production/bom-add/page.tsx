"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

export default function AddBOMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [alert, setAlert] = useState<{variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string} | null>(null);
  const [bomItems, setBomItems] = useState([{
    materialId: '',
    quantityPerUnit: '',
    unit: 'ชิ้น',
    sequenceOrder: 1
  }]);
  const [selectedProductId, setSelectedProductId] = useState(productId || '');

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await apiFetch(`/materials`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const showAlert = (variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({ variant, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const addBOMItem = () => {
    setBomItems([...bomItems, {
      materialId: '',
      quantityPerUnit: '',
      unit: 'ชิ้น',
      sequenceOrder: bomItems.length + 1
    }]);
  };

  const removeBOMItem = (index: number) => {
    if (bomItems.length > 1) {
      setBomItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const updateBOMItem = (index: number, field: string, value: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showAlert('error', 'กรุณาเลือกสินค้า', 'กรุณาเลือกสินค้าที่ต้องการเพิ่ม BOM');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiFetch(`/products/${selectedProductId}/bom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boms: bomItems }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showAlert('success', 'สำเร็จ!', 'เพิ่ม BOM เรียบร้อยแล้ว');
        setTimeout(() => router.push('/production/bom'), 1500);
      } else {
        showAlert('error', 'เพิ่ม BOM ล้มเหลว', result.message || 'เกิดข้อผิดพลาดในการเพิ่ม BOM');
      }
    } catch (error) {
      console.error('Failed to create BOM:', error);
      showAlert('error', 'เชื่อมต่อล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {alert && (
        <div className="mb-6">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}
      <PageBreadcrumb pageTitle="เพิ่ม BOM" />
      <div className="space-y-6">
        <ComponentCard title="เพิ่ม BOM">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>เลือกสินค้า <span className="text-red-500">*</span></Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">เลือกสินค้า</option>
                {products.map((prod: any) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.productCode} - {prod.productName}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">รายการวัตถุดิบ</h4>
                <button
                  type="button"
                  onClick={addBOMItem}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มรายการ
                </button>
              </div>

              {bomItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="md:col-span-5">
                    <Label>วัตถุดิบ <span className="text-red-500">*</span></Label>
                    <select
                      value={item.materialId}
                      onChange={(e) => updateBOMItem(index, 'materialId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">เลือกวัตถุดิบ</option>
                      {materials.map((mat: any) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.matCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label>จำนวน <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={item.quantityPerUnit}
                      onChange={(e) => updateBOMItem(index, 'quantityPerUnit', e.target.value)}
                      placeholder="จำนวน"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label>หน่วย</Label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateBOMItem(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ชิ้น">ชิ้น</option>
                      <option value="กล่อง">กล่อง</option>
                      <option value="แพ็ค">แพ็ค</option>
                      <option value="กิโลกรัม">กิโลกรัม</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-1 flex items-end">
                    {bomItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBOMItem(index)}
                        className="w-full px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
              <Button type="button" onClick={() => router.push('/production/bom')} className="bg-gray-500 hover:bg-gray-600">
                ยกเลิก
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}
