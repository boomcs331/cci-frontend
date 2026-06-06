"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  DataTable,
  ActionButton,
  BaseModal,
  ConfirmModal,
  LoadingState,
  type Column,
} from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import { apiFetch } from "@/utils/api";

interface Item { id: number; code: string; name: string; description: string; createDate: string; createBy: string; updateDate: string | null; updateBy: string | null; }

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

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(`/masters/products/models`);
      const result = await response.json();
      const apiData = result.data?.data || result.data || [];
      setTotal(result.data?.total || apiData.length);
      setData(apiData.slice((page - 1) * limit, page * limit));
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
      const url = editingItem ? `/masters/products/models/${editingItem.id}` : "/masters/products/models";
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

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name, description: item.description });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await apiFetch(`/masters/products/models/${deleteId}`, { method: "DELETE" });
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

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: Column<Item>[] = [
    { key: 'code', title: 'รหัส', width: '150px' },
    { key: 'name', title: 'ชื่อ', width: '200px' },
    { key: 'description', title: 'คำอธิบาย' },
    {
      key: 'actions',
      title: 'จัดการ',
      width: '150px',
      render: (_, row) => (
        <div className="flex gap-2 justify-center">
          <ActionButton variant="secondary" size="sm" onClick={() => handleEdit(row)}>
            แก้ไข
          </ActionButton>
          <ActionButton variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
            ลบ
          </ActionButton>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="โมเดลผลิตภัณฑ์"
        description={`ทั้งหมด ${total} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={() => {
              setShowModal(true);
              setEditingItem(null);
              setFormData({ code: "", name: "", description: "" });
            }}
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
        <DataTable
          columns={columns}
          data={data}
          emptyMessage="ไม่พบข้อมูลโมเดลผลิตภัณฑ์"
          rowKey="id"
        />
      </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? "แก้ไข" : "เพิ่ม"}โมเดล`}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              รหัส *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ชื่อ *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              คำอธิบาย
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
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

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        type="delete"
        message="คุณต้องการลบโมเดลผลิตภัณฑ์รายการนี้หรือไม่?"
      />
    </PageContainer>
  );
}

export default function Page() {
  return <PageContent />;
}
