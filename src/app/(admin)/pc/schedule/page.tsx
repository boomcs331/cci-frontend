"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

interface Product {
  id: number;
  productCode: string;
  productName: string;
  bom?: BOMItem[];
}

interface BOMItem {
  materialId: number;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
}

interface Material {
  id: number;
  matCode: string;
  matName: string;
}

interface Reservation {
  id: number;
  planId: number;
  materialId: number;
  reservedQuantity: string;
  lotNumber: string | null;
  receiveDate: string | null;
  material: Material;
}

interface PlanItem {
  id?: number;
  productId: number;
  quantity: number;
  unit: string;
  remarks?: string;
  product?: Product;
  bom?: BOMItem[];
}

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  status: "draft" | "reserved" | "confirmed" | "cancelled";
  remarks?: string;
  createDate: string;
  items?: PlanItem[];
  reservations?: Reservation[];
}

const statusConfig = {
  draft: { label: "ร่าง", color: "light" },
  reserved: { label: "จองแล้ว", color: "warning" },
  confirmed: { label: "ยืนยันแล้ว", color: "success" },
  cancelled: { label: "ยกเลิก", color: "error" },
};

export default function PCSchedulePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [form, setForm] = useState({ planName: "", planDate: "", remarks: "", items: [] as PlanItem[] });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [productSearches, setProductSearches] = useState<{[key: number]: string}>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<{[key: number]: boolean}>({});
  const datePickerRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<any>(null);

  useEffect(() => {
    fetchPlans();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showModal && datePickerRef.current && !flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(datePickerRef.current, {
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
          setForm(prev => ({ ...prev, planDate: dateStr }));
        },
        defaultDate: form.planDate || new Date(),
        clickOpens: true,
        allowInput: false
      });
    }
    
    if (!showModal && flatpickrInstance.current) {
      flatpickrInstance.current.destroy();
      flatpickrInstance.current = null;
    }
  }, [showModal]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("http://localhost:3006/production-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3006/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.planName || !form.planDate || form.items.length === 0) {
      setMessage({ type: "error", text: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }
    const invalidItem = form.items.find(item => item.productId === 0 || item.quantity <= 0);
    if (invalidItem) {
      setMessage({ type: "error", text: "กรุณาเลือกสินค้าและระบุจำนวนที่ถูกต้อง" });
      return;
    }
    try {
      const url = editingPlan ? `http://localhost:3006/production-plans/${editingPlan.id}` : "http://localhost:3006/production-plans";
      const res = await fetch(url, { method: editingPlan ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        setMessage({ type: "success", text: editingPlan ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ" });
        setShowModal(false);
        setForm({ planName: "", planDate: "", remarks: "", items: [] });
        setEditingPlan(null);
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.message || "เกิดข้อผิดพลาด" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  const handleReserve = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3006/production-plans/${id}/reserve`, { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: "จอง Material สำเร็จ" });
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ message: "ไม่สามารถจอง Material ได้" }));
        setMessage({ type: "error", text: errorData.message || "ไม่สามารถจอง Material ได้" });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3006/production-plans/${id}/confirm`, { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: "ยืนยันแผนสำเร็จ" });
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ message: "ไม่สามารถยืนยันแผนได้" }));
        setMessage({ type: "error", text: errorData.message || "ไม่สามารถยืนยันแผนได้" });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleEdit = (plan: ProductionPlan) => {
    setEditingPlan(plan);
    setForm({ planName: plan.planName, planDate: plan.planDate, remarks: plan.remarks || "", items: plan.items || [] });
    setShowModal(true);
  };

  const handleViewDetail = async (plan: ProductionPlan) => {
    try {
      const res = await fetch(`http://localhost:3006/production-plans/${plan.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPlan(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: 0, quantity: 0, unit: "ชิ้น", remarks: "", bom: [] }] });
  const updateItem = async (index: number, field: keyof PlanItem, value: any) => {
    if (field === "quantity" && value < 0) return;
    
    if (field === "productId" && value > 0) {
      try {
        const res = await fetch(`http://localhost:3006/products/${value}/bom`);
        if (res.ok) {
          const result = await res.json();
          const bomData = (result.data || []).map((item: any) => ({
            materialId: item.materialId,
            materialCode: item.material?.matCode || '',
            materialName: item.material?.matName || '',
            quantity: parseFloat(item.quantityPerUnit || 0),
            unit: item.unit || ''
          }));
          
          const newItems = [...form.items];
          newItems[index] = { 
            ...newItems[index], 
            [field]: value,
            bom: bomData
          };
          setForm({ ...form, items: newItems });
          return;
        }
      } catch (error) {
        console.error("Error fetching BOM:", error);
      }
    }
    
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };
  const removeItem = (index: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  return (
    <div>
      <PageBreadcrumb pageTitle="จัดงานล่วงหน้า" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">แผนการผลิต</h2>
          </div>
        </div>

        {message && <Alert variant={message.type} title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"} message={message.text} />}
        
        <ComponentCard title={`แผนการผลิตทั้งหมด (${plans.length})`}>
          <div className="flex justify-between mb-4">
            <button onClick={() => router.push('/pc/reservations')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ดูรายการจอง Material
            </button>
            <button onClick={() => { setShowModal(true); setEditingPlan(null); setForm({ planName: "", planDate: "", remarks: "", items: [] }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มแผนใหม่
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสแผน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อแผน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สินค้า</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{plan.planCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{plan.planName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(plan.planDate).toLocaleDateString("th-TH")}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        plan.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400" :
                        plan.status === "reserved" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                        plan.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}>{statusConfig[plan.status].label}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{plan.items?.length || 0}</td>
                    <td className="px-4 py-3 text-center">
                      {plan.status === "draft" && (
                        <>
                          <button onClick={() => handleEdit(plan)} className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded mr-1">แก้ไข</button>
                          <button onClick={() => handleReserve(plan.id)} className="px-3 py-1 text-xs text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900 rounded">จอง</button>
                        </>
                      )}
                      {plan.status === "reserved" && (
                        <>
                          <button onClick={() => router.push(`/pc/schedule/${plan.id}`)} className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded mr-1">ดูรายละเอียด</button>
                          <button onClick={() => handleConfirm(plan.id)} className="px-3 py-1 text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded">ยืนยัน</button>
                        </>
                      )}
                      {plan.status === "confirmed" && (
                        <button onClick={() => router.push(`/pc/schedule/${plan.id}`)} className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded">ดูรายละเอียด</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editingPlan ? "แก้ไข" : "เพิ่ม"}แผนการผลิต</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อแผน *</label>
                  <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วันที่ *</label>
                  <div className="relative">
                    <input 
                      ref={datePickerRef}
                      type="text" 
                      value={form.planDate} 
                      onChange={(e) => setForm({ ...form, planDate: e.target.value })} 
                      className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                      placeholder="เลือกวันที่"
                      required 
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หมายเหตุ</label>
                  <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows={3} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รายการสินค้า *</label>
                    <button type="button" onClick={addItem} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">+ เพิ่ม</button>
                  </div>
                  <div className="space-y-3">
                    {form.items.map((item, i) => {
                      const selectedProduct = products.find(p => p.id === item.productId);
                      const productSearch = productSearches[i] || '';
                      const filteredProducts = products.filter(p => 
                        productSearch === '' || 
                        p.productCode.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.productName.toLowerCase().includes(productSearch.toLowerCase())
                      );
                      
                      return (
                      <div key={`item-${i}-${item.productId}`} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <div className="flex gap-2 p-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={productSearch || (selectedProduct ? `${selectedProduct.productCode} - ${selectedProduct.productName}` : '')}
                              onChange={(e) => {
                                setProductSearches({...productSearches, [i]: e.target.value});
                                setShowProductDropdowns({...showProductDropdowns, [i]: true});
                              }}
                              onFocus={() => setShowProductDropdowns({...showProductDropdowns, [i]: true})}
                              placeholder="ค้นหารหัสหรือชื่อสินค้า"
                              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              required
                            />
                            {showProductDropdowns[i] && filteredProducts.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredProducts.slice(0, 50).map((p) => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      updateItem(i, "productId", p.id);
                                      setProductSearches({...productSearches, [i]: `${p.productCode} - ${p.productName}`});
                                      setShowProductDropdowns({...showProductDropdowns, [i]: false});
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white">{p.productCode}</div>
                                    <div className="text-xs text-gray-500">{p.productName}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <input type="number" placeholder="จำนวน" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", +e.target.value)} className="w-24 h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
                          <input type="text" placeholder="หน่วย" value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="w-20 h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                          <button type="button" onClick={() => removeItem(i)} className="px-3 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">ลบ</button>
                        </div>
                        {item.productId > 0 && (
                          <div className="px-3 pb-3">
                            {item.bom && item.bom.length > 0 ? (
                              <>
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Material ที่ต้องใช้:</div>
                                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-2 py-1 text-left text-gray-700 dark:text-gray-300">รหัส</th>
                                        <th className="px-2 py-1 text-left text-gray-700 dark:text-gray-300">ชื่อ Material</th>
                                        <th className="px-2 py-1 text-right text-gray-700 dark:text-gray-300">ต่อหน่วย</th>
                                        <th className="px-2 py-1 text-right text-gray-700 dark:text-gray-300">รวม</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {item.bom.map((bom, bi) => (
                                        <tr key={bi}>
                                          <td className="px-2 py-1 text-gray-900 dark:text-white">{bom.materialCode}</td>
                                          <td className="px-2 py-1 text-gray-900 dark:text-white">{bom.materialName}</td>
                                          <td className="px-2 py-1 text-right text-gray-900 dark:text-white">{bom.quantity} {bom.unit}</td>
                                          <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{(bom.quantity * (item.quantity || 0)).toFixed(2)} {bom.unit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded border border-amber-200 dark:border-amber-800">
                                ⚠️ สินค้านี้ยังไม่มี BOM (Bill of Materials) กรุณาเพิ่ม BOM ก่อนสร้างแผนการผลิต
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">บันทึก</button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">รายละเอียดแผนการผลิต - {selectedPlan.planCode}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ชื่อแผน</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.planName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedPlan.planDate).toLocaleDateString("th-TH")}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">รายการสินค้า</h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">สินค้า</th>
                          <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">จำนวน</th>
                          <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">หน่วย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedPlan.items?.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">{item.product?.productName || "-"}</td>
                            <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedPlan.reservations && selectedPlan.reservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Material ที่จอง (QR No.)</h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">รหัส Material</th>
                            <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">ชื่อ Material</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">จำนวนที่จอง</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Lot No.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedPlan.reservations.map((res) => (
                            <tr key={res.id}>
                              <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{res.material.matCode}</td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white">{res.material.matName}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{parseFloat(res.reservedQuantity).toFixed(2)}</td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{res.lotNumber || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
