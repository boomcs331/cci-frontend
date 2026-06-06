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

interface Unit {
  id: number;
  code: string;
  name: string;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: Unit[];
    total: number;
    page: number;
    limit: number;
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
  const [editingItem, setEditingItem] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(`/masters/units?page=${page}&limit=${limit}`);
      const result = await response.json();
      if (result.success) {
        setApiResponse(result);
      } else {
        setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
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
      const url = editingItem ? `/masters/units/${editingItem.id}` : "/masters/units";
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

  const handleEdit = (item: Unit) => {
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
      const response = await apiFetch(`/masters/units/${deleteId}`, { method: "DELETE" });
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

  const columns: Column<Unit>[] = [
    { key: 'code', title: 'รหัส', width: '150px' },
    { key: 'name', title: 'ชื่อ' },
    {
      key: 'createDate',
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
        title="หน่วย"
        description={`ทั้งหมด ${apiResponse?.data?.total || 0} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={() => {
              setShowModal(true);
              setEditingItem(null);
              setFormData({ code: "", name: "" });
            }}
          >
            เพิ่มหน่วย
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
          data={apiResponse?.data?.data || []}
          emptyMessage="ไม่พบข้อมูลหน่วย"
          rowKey="id"
        />
        {apiResponse?.data && <PaginationFooter size="sm" page={apiResponse.data.page} limit={apiResponse.data.limit} total={apiResponse.data.total} totalPages={apiResponse.data.totalPages} />}
      </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? "แก้ไข" : "เพิ่ม"}หน่วย`}
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
        message="คุณต้องการลบหน่วยรายการนี้หรือไม่?"
      />
    </PageContainer>
  );
}

export default function Page() {
  return <PageContent />;
}
