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
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/masters/suppliers?page=${page}&limit=${limit}`);
      const result = await response.json();
      if (result.success && result.data) {
        setApiResponse({ 
          data: result.data.data || result.data,
          pagination: result.data.pagination || { page, limit, total: result.data.length, totalPages: 1 }
        });
      }
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
      const url = editingItem ? `/masters/suppliers/${editingItem.id}` : "/masters/suppliers";
      const method = editingItem ? "PUT" : "POST";
      const response = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
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
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await apiFetch(`/masters/suppliers/${deleteId}`, { method: "DELETE" });
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

  const columns: Column<Supplier>[] = [
    { key: 'code', title: 'รหัส', width: '150px' },
    { key: 'name', title: 'ชื่อ' },
    {
      key: 'create_date',
      title: 'วันที่สร้าง',
      width: '150px',
      render: (value) => value ? new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
    },
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
        title="ผู้จัดจำหน่าย"
        description={`ทั้งหมด ${apiResponse?.pagination?.total || 0} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={() => {
              setShowModal(true);
              setEditingItem(null);
              setFormData({ code: "", name: "", contact_person: "", phone: "", email: "", address: "" });
            }}
          >
            เพิ่มผู้จัดจำหน่าย
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
          data={apiResponse?.data || []}
          emptyMessage="ไม่พบข้อมูลผู้จัดจำหน่าย"
          rowKey="id"
        />
        {apiResponse?.pagination && <PaginationFooter size="sm" {...apiResponse.pagination} />}
      </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? "แก้ไข" : "เพิ่ม"}ผู้จัดจำหน่าย`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ผู้ติดต่อ
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                โทรศัพท์
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ที่อยู่
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
        message="คุณต้องการลบผู้จัดจำหน่ายรายการนี้หรือไม่?"
      />
    </PageContainer>
  );
}

export default function Page() {
  return <PageContent />;
}
