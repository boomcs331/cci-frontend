"use client";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader, ContentCard, BaseModal, ActionButton, LoadingState } from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";

interface DeliveryType {
  id: number;
  code: string;
  name: string;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
}

interface ApiResponse {
  data: DeliveryType[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryType | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(`/masters/delivery-types?page=${page}&limit=${limit}`);
      const result = await response.json();
      setApiResponse({ 
        data: result.data?.data || [], 
        pagination: { 
          page: result.data?.page || page, 
          limit: result.data?.limit || limit, 
          total: result.data?.total || 0, 
          totalPages: result.data?.totalPages || 0 
        } 
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
      const url = editingItem ? `/masters/delivery-types/${editingItem.id}` : "/masters/delivery-types";
      const method = editingItem ? "PUT" : "POST";
      const response = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (response.ok) {
        setMessage({ type: "success", text: editingItem ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ" });
        setShowModal(false);
        setFormData({ code: "", name: "" });
        setEditingItem(null);
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  const handleEdit = (item: DeliveryType) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await apiFetch(`/masters/delivery-types/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        setMessage({ type: "success", text: "ลบสำเร็จ" });
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="ประเภทการส่ง"
        description={`ทั้งหมด ${apiResponse?.pagination?.total || 0} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ code: "", name: "" }); }}
          >
            เพิ่มประเภทการส่ง
          </ActionButton>
        }
      />

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 ${
          message.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <ContentCard>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <PaginationSelector currentLimit={limit} />
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
                {(apiResponse?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  (apiResponse?.data ?? []).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{item.code}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {item.createDate ? new Date(item.createDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <ActionButton variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                          แก้ไข
                        </ActionButton>
                        <ActionButton variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                          ลบ
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {apiResponse?.pagination && <PaginationFooter size="sm" {...apiResponse.pagination} />}
        </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? "แก้ไข" : "เพิ่ม"}ประเภทการส่ง`}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัส *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required />
          </div>
          <div className="flex gap-2 pt-3">
            <ActionButton type="submit" className="flex-1">
              บันทึก
            </ActionButton>
            <ActionButton
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </form>
      </BaseModal>

      {deleteId !== null && (
        <BaseModal
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          title="ยืนยันการลบ"
          size="sm"
        >
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            คุณต้องการลบประเภทการส่งรายการนี้หรือไม่?
          </div>
          <div className="flex gap-3">
            <ActionButton
              variant="danger"
              onClick={confirmDelete}
              className="flex-1"
            >
              ลบ
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setDeleteId(null)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </BaseModal>
      )}
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>
      <PageContent />
    </Suspense>
  );
}
