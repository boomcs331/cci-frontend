"use client";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import Alert from "@/components/ui/alert/Alert";
import { apiFetch } from "@/utils/api";

interface ProductType {
  id: number;
  code: string;
  name: string;
  description: string;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
}

interface ApiResponse {
  data: ProductType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(`/masters/products/types`);
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
  }, [page, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/masters/products/types/${editingItem.id}` : "/masters/products/types";
      const method = editingItem ? "PATCH" : "POST";
      const response = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (response.ok) {
        setMessage({ type: "success", text: editingItem ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ" });
        setShowModal(false);
        setFormData({ code: "", name: "", description: "" });
        setEditingItem(null);
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  const handleEdit = (item: ProductType) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name, description: item.description });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบ?")) return;
    try {
      const response = await apiFetch(`/masters/products/types/${id}`, { method: "DELETE" });
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
      <PageBreadcrumb pageTitle="ประเภทผลิตภัณฑ์" />
      <div className="space-y-4">
        {message && <Alert variant={message.type} title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"} message={message.text} />}
        <ComponentCard title={`ประเภทผลิตภัณฑ์ทั้งหมด (${apiResponse?.pagination?.total || 0})`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3">
            <PaginationSelector currentLimit={limit} />
            <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ code: "", name: "", description: "" }); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">เพิ่มประเภท</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-24">รหัส</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-40">ชื่อ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">คำอธิบาย</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-32">วันที่สร้าง</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(apiResponse?.data ?? []).length === 0 ? (
                  <TableEmptyRow colSpan={5} />
                ) : (
                  (apiResponse?.data ?? []).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{item.code}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {item.createDate ? new Date(item.createDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded mr-1">แก้ไข</button>
                      <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">ลบ</button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {apiResponse?.pagination && (
            <PaginationFooter
              size="sm"
              page={page}
              limit={limit}
              total={apiResponse.pagination.total}
              totalPages={apiResponse.pagination.totalPages}
            />
          )}
        </ComponentCard>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingItem ? "แก้ไข" : "เพิ่ม"}ประเภทผลิตภัณฑ์</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัส *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" rows={2} />
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
