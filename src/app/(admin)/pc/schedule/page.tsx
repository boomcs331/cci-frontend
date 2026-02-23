"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";

interface Product {
  id: number;
  productCode: string;
  productName: string;
}

interface PlanItem {
  id?: number;
  productId: number;
  quantity: number;
  unit: string;
  remarks?: string;
  product?: Product;
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
}

const statusConfig = {
  draft: { label: "ร่าง", color: "light" },
  reserved: { label: "จองแล้ว", color: "warning" },
  confirmed: { label: "ยืนยันแล้ว", color: "success" },
  cancelled: { label: "ยกเลิก", color: "error" },
};

export default function PCSchedulePage() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [form, setForm] = useState({ planName: "", planDate: "", remarks: "", items: [] as PlanItem[] });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchProducts();
  }, []);

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

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: 0, quantity: 0, unit: "ชิ้น", remarks: "" }] });
  const updateItem = (index: number, field: keyof PlanItem, value: any) => {
    if (field === "quantity" && value < 0) return;
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };
  const removeItem = (index: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  return (
    <div>
      <PageBreadcrumb pageTitle="จัดงานล่วงหน้า" />
      <div className="space-y-4">
        {message && <Alert variant={message.type} title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"} message={message.text} />}
        <ComponentCard title={`แผนการผลิตทั้งหมด (${plans.length})`}>
          <div className="flex justify-end mb-3">
            <button onClick={() => { setShowModal(true); setEditingPlan(null); setForm({ planName: "", planDate: "", remarks: "", items: [] }); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">เพิ่มแผนใหม่</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-32">รหัสแผน</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อแผน</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-32">วันที่</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-24">สถานะ</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-24">สินค้า</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-40">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{plan.planCode}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{plan.planName}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{new Date(plan.planDate).toLocaleDateString("th-TH")}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        plan.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400" :
                        plan.status === "reserved" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                        plan.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}>{statusConfig[plan.status].label}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-gray-600 dark:text-gray-400">{plan.items?.length || 0}</td>
                    <td className="px-3 py-2 text-center">
                      {plan.status === "draft" && (
                        <>
                          <button onClick={() => handleEdit(plan)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded mr-1">แก้ไข</button>
                          <button onClick={() => handleReserve(plan.id)} className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900 rounded">จอง</button>
                        </>
                      )}
                      {plan.status === "reserved" && (
                        <button onClick={() => handleConfirm(plan.id)} className="px-2 py-1 text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded">ยืนยัน</button>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingPlan ? "แก้ไข" : "เพิ่ม"}แผนการผลิต</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อแผน *</label>
                <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">วันที่ *</label>
                <input type="date" value={form.planDate} onChange={(e) => setForm({ ...form, planDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมายเหตุ</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" rows={2} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รายการสินค้า *</label>
                  <button type="button" onClick={addItem} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">+ เพิ่ม</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={`item-${i}-${item.productId}`} className="flex gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <select value={item.productId} onChange={(e) => updateItem(i, "productId", +e.target.value)} className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required>
                        <option value={0}>เลือกสินค้า</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                      </select>
                      <input type="number" placeholder="จำนวน" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", +e.target.value)} className="w-20 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
                      <input type="text" placeholder="หน่วย" value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="w-16 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
                      <button type="button" onClick={() => removeItem(i)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">ลบ</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 rounded-lg">บันทึก</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-1.5 rounded-lg">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}