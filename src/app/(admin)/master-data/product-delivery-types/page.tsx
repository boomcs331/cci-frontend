"use client";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader, ContentCard, BaseModal, ActionButton, LoadingState } from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import { apiFetch } from "@/utils/api";

interface Item {
  id: number;
  code: string;
  name: string;
  description: string;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
}

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const [data, setData] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(`/masters/products/delivery-types`);
      const result = await response.json();
      const apiData = result.data?.data || result.data || [];
      setTotal(result.data?.total || apiData.length);
      const startIndex = (page - 1) * limit;
      setData(apiData.slice(startIndex, startIndex + limit));
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/masters/products/delivery-types/${editingItem.id}` : "/masters/products/delivery-types";
      const response = await apiFetch(url, { method: editingItem ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
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

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await apiFetch(`/masters/products/delivery-types/${deleteId}`, { method: "DELETE" });
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
        title="ประเภทการส่งผลิตภัณฑ์"
        description={`ทั้งหมด ${total} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ code: "", name: "", description: "" }); }}
          >
            เพิ่ม
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
          <div className="flex justify-between mb-3">
            <PaginationSelector currentLimit={limit} />
          </div>
          <table className="w-full">
            <thead><tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-24">รหัส</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-40">ชื่อ</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">คำอธิบาย</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-32">จัดการ</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{item.code}</td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <ActionButton variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormData({ code: item.code, name: item.name, description: item.description }); setShowModal(true); }}>
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
        </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? "แก้ไข" : "เพิ่ม"}ประเภทการส่ง`}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัส *</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" rows={2} /></div>
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
            คุณต้องการลบประเภทการส่งผลิตภัณฑ์รายการนี้หรือไม่?
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
