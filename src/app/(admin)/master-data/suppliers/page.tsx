"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/master-data/PaginationFooter";
import Alert from "@/components/ui/alert/Alert";
import { getApiUrl } from "@/utils/api";

interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  create_date: string;
  create_by: string;
  update_date: string | null;
  update_by: string | null;
}

interface ApiResponse {
  data: Supplier[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", contact_person: "", phone: "", email: "", address: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(getApiUrl(`/masters/suppliers`));
      const result = await response.json();
      const apiData = result.data?.data || result.data || [];
      const total = result.data?.total || apiData.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = apiData.slice(startIndex, endIndex);
      setApiResponse({ 
        data: paginatedData, 
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
      });
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? getApiUrl(`/masters/suppliers/${editingItem.id}`) : getApiUrl("/masters/suppliers");
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (response.ok) {
        setMessage({ type: "success", text: editingItem ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ" });
        setShowModal(false);
        setFormData({ code: "", name: "", contact_person: "", phone: "", email: "", address: "" });
        setEditingItem(null);
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  const handleEdit = (item: Supplier) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name, contact_person: item.contact_person, phone: item.phone, email: item.email, address: item.address });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบ?")) return;
    try {
      const response = await fetch(getApiUrl(`/masters/suppliers/${id}`), { method: "DELETE" });
      if (response.ok) {
        setMessage({ type: "success", text: "ลบสำเร็จ" });
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle="ผู้จัดจำหน่าย" />
      <div className="space-y-4">
        {message && <Alert variant={message.type} title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"} message={message.text} />}
        <ComponentCard title={`ผู้จัดจำหน่ายทั้งหมด (${apiResponse?.pagination?.total || 0})`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3">
            <PaginationSelector currentLimit={limit} />
            <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ code: "", name: "", contact_person: "", phone: "", email: "", address: "" }); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">เพิ่มผู้จัดจำหน่าย</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-32">รหัส</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-32">วันที่สร้าง</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {apiResponse?.data?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{item.code}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {item.create_date ? new Date(item.create_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded mr-1">แก้ไข</button>
                      <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {apiResponse?.pagination && <PaginationFooter {...apiResponse.pagination} />}
        </ComponentCard>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingItem ? "แก้ไข" : "เพิ่ม"}ผู้จัดจำหน่าย</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัส *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ผู้ติดต่อ</label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">โทรศัพท์</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อีเมล</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ที่อยู่</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" rows={2} />
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

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>
      <PageContent />
    </Suspense>
  );
}
