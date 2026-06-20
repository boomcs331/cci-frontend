"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  ActionButton,
  BaseModal,
  LoadingState,
} from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";
import { resolveWorkpieceImagePath } from "@/utils/workpieceImage";
import WorkpieceImage from "@/components/pc/shared/WorkpieceImage";
import WorkpieceImagePreviewModal from "@/components/pc/shared/WorkpieceImagePreviewModal";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import {
  PcTransactionFilterCard,
  PcFilterField,
  PcFilterSearchInput,
} from "@/components/pc/transactions/PcTransactionFilterCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
} from "@fortawesome/free-solid-svg-icons";

const warehouseTxnItems = [
  {
    name: "รายการรับเข้า",
    path: "/pc/income",
    description: "บันทึกการรับวัตถุดิบเข้าคลัง",
    icon: <FontAwesomeIcon icon={faArrowRightToBracket} />,
    accent: "success" as const,
  },
  {
    name: "รายการจ่ายออก",
    path: "/pc/outcome",
    description: "จ่ายวัตถุดิบตามแผน (FIFO)",
    icon: <FontAwesomeIcon icon={faArrowRightFromBracket} />,
    accent: "orange" as const,
  },
];

interface Material {
  id: number;
  matCode: string;
  matName: string;
  matTypeId: number;
  defaultLocationId: number;
  lr: string;
  lotSize: number;
  unit: string;
  minStock?: number;
  isActive: boolean;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
  supplierId?: number;
  scale?: number;
  materialsType: {
    id: number;
    code: string;
    name: string;
    createDate: string;
    createBy: string;
    updateDate: string | null;
    updateBy: string | null;
  };
  model?: {
    id: number;
    name: string;
  };
  deliveryType?: {
    id: number;
    name: string;
  };
  unitMaster?: {
    id: number;
    name: string;
  };
  defaultLocation: {
    id: number;
    code: string;
    name: string;
    description: string;
    createDate: string;
    createBy: string;
    updateDate: string | null;
    updateBy: string | null;
  };
  loadingPoint?: {
    id: number;
    name: string;
  };
  supplier?: {
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
    update_date: string;
    update_by: string | null;
  };
  processLine?: {
    id: number;
    name: string;
  };
  /** Path จาก API อัปโหลด เช่น uploads/material-workpieces/xxx.jpg */
  workpieceImagePath?: string | null;
  stock: {
    materialId: number;
    totalQty: number;
    availableQty: number;
    reservedQty: number;
    updateDate: string;
  };
  itemsName?: {
    id: number;
    materialId: number;
    name: string;
    description: string;
    active: boolean;
    createDate: string;
    updateDate: string | null;
    createBy: string;
    updateBy: string | null;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

async function getMaterials(page: number = 1, limit: number = 10, filters: any = {}): Promise<ApiResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });

  const response = await apiFetch(`/materials/?${params.toString()}`, { cache: "no-store" });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

export default function PCPage() {
  const searchParams = useSearchParams();
  // Header title removed - page displays its own title in blue card
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loadingPoints, setLoadingPoints] = useState<any[]>([]);
  const [processLines, setProcessLines] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [searchValue, setSearchValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [formData, setFormData] = useState({
    matCode: '',
    matTypeId: 1,
    defaultLocationId: 1,
    supplierId: 0,
    modelId: 0,
    deliveryTypeId: 0,
    unitId: 0,
    loadingPointId: 0,
    processLineId: 0,
    name: '',
    description: '',
    lr: '',
    lotSize: 0,
    scale: '',
    minStock: 0,
    createBy: ''
  });
  const [addWorkpieceFile, setAddWorkpieceFile] = useState<File | null>(null);
  const [addWorkpiecePreviewUrl, setAddWorkpiecePreviewUrl] = useState<string | null>(null);
  const [editWorkpieceFile, setEditWorkpieceFile] = useState<File | null>(null);
  const [editWorkpiecePreviewUrl, setEditWorkpiecePreviewUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    src: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const setAddWorkpieceFromInput = (file: File | null) => {
    setAddWorkpiecePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setAddWorkpieceFile(file);
  };

  const setEditWorkpieceFromInput = (file: File | null) => {
    setEditWorkpiecePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setEditWorkpieceFile(file);
  };

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const totalPages = apiResponse?.pagination?.totalPages ?? 1;
  const totalItems = apiResponse?.pagination?.total ?? 0;

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  useEffect(() => {
    setSearchValue(searchParams.get("search") ?? "");
    setUnitValue(searchParams.get("unit") ?? "");
    setStatusValue(searchParams.get("isActive") ?? "");
  }, [searchParams.toString()]);

  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, showEditModal, showDeleteModal]);

  useEffect(() => {
    if (!showAddModal) {
      setAddWorkpieceFile(null);
      setAddWorkpiecePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [showAddModal]);

  useEffect(() => {
    if (!showEditModal) {
      setEditWorkpieceFile(null);
      setEditWorkpiecePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [showEditModal]);

  const getMaterialTypes = async () => {
    const response = await apiFetch('/masters/materials-types/all');
    const result = await response.json();
    return result.data || [];
  };
  
  const getLocations = async () => {
    const response = await apiFetch('/masters/materials-locations/all');
    const result = await response.json();
    return result.data || [];
  };
  
  const getSuppliers = async () => {
    const response = await apiFetch('/masters/suppliers/all');
    const result = await response.json();
    return result.data || [];
  };

  const getModels = async () => {
    const response = await apiFetch('/masters/models/all');
    const result = await response.json();
    return result.data || [];
  };

  const getDeliveryTypes = async () => {
    const response = await apiFetch('/masters/delivery-types/all');
    const result = await response.json();
    return result.data || [];
  };

  const getUnits = async () => {
    const response = await apiFetch('/masters/units/all');
    const result = await response.json();
    return result.data || [];
  };

  const getLoadingPoints = async () => {
    const response = await apiFetch('/masters/loading-points/all');
    const result = await response.json();
    return result.data || [];
  };

  const getProcessLines = async () => {
    const response = await apiFetch('/masters/process-lines/all');
    const result = await response.json();
    return result.data || [];
  };
  
  const handleEdit = (material: Material) => {
    if (!material) return;
    setEditingMaterial(material);
    setFormData({
      matCode: material.matCode || '',
      matTypeId: material.matTypeId || 0,
      defaultLocationId: material.defaultLocationId || 0,
      supplierId: material.supplierId || 0,
      modelId: material.model?.id || 0,
      deliveryTypeId: material.deliveryType?.id || 0,
      unitId: material.unitMaster?.id || 0,
      loadingPointId: material.loadingPoint?.id || 0,
      processLineId: material.processLine?.id || 0,
      name: material.matName || '',
      description: '',
      lr: material.lr,
      lotSize: material.lotSize,
      scale: material.scale?.toString() || '',
      minStock: material.minStock || 0,
      createBy: material.createBy
    });
    setEditWorkpieceFile(null);
    setEditWorkpiecePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setShowEditModal(true);
  };
  
  const handleDelete = (material: Material) => {
    setDeletingMaterial(material);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingMaterial) return;
    
    try {
      const response = await apiFetch(`/materials/${deletingMaterial.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setShowDeleteModal(false);
        setSubmitSuccess('ลบวัตถุดิบสำเร็จ');
        const updatedResponse = await getMaterials(page, limit);
        setApiResponse(updatedResponse);
        setTimeout(() => setSubmitSuccess(null), 3000);
      } else {
        setSubmitError('เกิดข้อผิดพลาดในการลบวัตถุดิบ');
        setTimeout(() => setSubmitError(null), 5000);
      }
    } catch (err) {
      setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setTimeout(() => setSubmitError(null), 5000);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!addWorkpieceFile) {
      setSubmitError("กรุณาแนบรูปภาพชิ้นงาน");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", addWorkpieceFile);
      const uploadRes = await apiFetch("/materials/upload/workpiece-image", {
        method: "POST",
        body: fd,
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || uploadJson?.success === false) {
        setSubmitError(
          typeof uploadJson?.message === "string" ? uploadJson.message : "อัปโหลดรูปภาพไม่สำเร็จ",
        );
        return;
      }
      const imagePath = uploadJson?.data?.filePath as string | undefined;
      if (!imagePath?.trim()) {
        setSubmitError("อัปโหลดรูปภาพไม่สำเร็จ");
        return;
      }

      const payload: any = {
        matCode: formData.matCode,
        matName: formData.name,
        matTypeId: formData.matTypeId,
        defaultLocationId: formData.defaultLocationId,
        lr: formData.lr,
        lotSize: formData.lotSize,
        minStock: formData.minStock || 0,
        isActive: true,
        createBy: currentUser,
        workpieceImagePath: imagePath,
      };

      if (formData.supplierId && formData.supplierId > 0) payload.supplierId = formData.supplierId;
      if (formData.modelId && formData.modelId > 0) payload.modelId = formData.modelId;
      if (formData.deliveryTypeId && formData.deliveryTypeId > 0) payload.deliveryTypeId = formData.deliveryTypeId;
      if (formData.unitId && formData.unitId > 0) payload.unitId = formData.unitId;
      if (formData.loadingPointId && formData.loadingPointId > 0) payload.loadingPointId = formData.loadingPointId;
      if (formData.processLineId && formData.processLineId > 0) payload.processLineId = formData.processLineId;
      if (formData.scale && formData.scale.trim()) payload.scale = formData.scale.trim();
      if (formData.description && formData.description.trim()) payload.description = formData.description.trim();

      const response = await apiFetch('/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setSubmitSuccess('เพิ่มวัตถุดิบสำเร็จ');
        const updatedResponse = await getMaterials(page, limit);
        setApiResponse(updatedResponse);
        setFormData({
          matCode: '',
          matTypeId: 1,
          defaultLocationId: 1,
          supplierId: 0,
          modelId: 0,
          deliveryTypeId: 0,
          unitId: 0,
          loadingPointId: 0,
          processLineId: 0,
          name: '',
          description: '',
          lr: '',
          lotSize: 0,
          scale: '',
          minStock: 0,
          createBy: currentUser
        });
        setTimeout(() => setSubmitSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.message || 'เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ');
      }
    } catch (err) {
      setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };
  
  useEffect(() => {
    const getSessionData = () => {
      try {
        const session = localStorage.getItem('session');
        if (session) {
          const parsedSession = JSON.parse(session);
          setCurrentUser(parsedSession.user?.username || 'admin');
        }
      } catch (error) {
        console.error('Failed to parse session:', error);
      }
    };
    getSessionData();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [materialsResponse, typesData, locationsData, suppliersData, modelsData, deliveryTypesData, unitsData, loadingPointsData, processLinesData] = await Promise.all([
          getMaterials(page, limit),
          getMaterialTypes(),
          getLocations(),
          getSuppliers(),
          getModels(),
          getDeliveryTypes(),
          getUnits(),
          getLoadingPoints(),
          getProcessLines()
        ]);
        setApiResponse(materialsResponse);
        setMaterialTypes(typesData);
        setLocations(locationsData);
        setSuppliers(suppliersData);
        setModels(modelsData);
        setDeliveryTypes(deliveryTypesData);
        setUnits(unitsData);
        setLoadingPoints(loadingPointsData);
        setProcessLines(processLinesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [page, limit]);

  return (
    <PageContainer>
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'}} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">วัตถุดิบ</h1>
            </div>
            <p className="text-blue-100 text-sm">จัดการและตรวจสอบวัตถุดิบทั้งหมดในระบบ</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span>ทั้งหมด <strong className="text-white">{apiResponse?.pagination?.total ?? apiResponse?.data?.length ?? 0}</strong> รายการ</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData({ matCode: '', matTypeId: 1, defaultLocationId: 1, supplierId: 0, modelId: 0, deliveryTypeId: 0, unitId: 0, loadingPointId: 0, processLineId: 0, name: '', description: '', lr: '', lotSize: 0, scale: '', minStock: 0, createBy: currentUser });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            เพิ่มวัตถุดิบ
          </button>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <a href="/pc/income" className="group flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors shrink-0">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">รับเข้า</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">บันทึกการรับวัตถุดิบเข้าคลัง</div>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
        <a href="/pc/outcome" className="group flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/30 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors shrink-0">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">จ่ายออก</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">จ่ายวัตถุดิบตามแผน (FIFO)</div>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
      </div>

      {/* ── Alerts ── */}
      {submitSuccess && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {submitError}
        </div>
      )}

      {/* ── Filter Card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ค้นหาและกรอง</span>
            {(searchValue || unitValue || statusValue) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">มีตัวกรอง</span>
            )}
          </div>
          {(searchValue || unitValue || statusValue) && (
            <button onClick={() => { setSearchValue(''); setUnitValue(''); setStatusValue(''); window.history.replaceState({}, '', `?page=1&limit=${limit}`); getMaterials(1, limit).then(setApiResponse); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchValue}
              placeholder="ค้นหารหัสหรือชื่อวัตถุดิบ..."
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              onChange={(e) => {
                setSearchValue(e.target.value);
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) { params.set('search', e.target.value); } else { params.delete('search'); }
                params.set('page', '1');
                window.history.replaceState({}, '', `?${params.toString()}`);
                getMaterials(1, limit, Object.fromEntries(params)).then(setApiResponse);
              }}
            />
          </div>
          <select
            value={unitValue}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            onChange={(e) => {
              setUnitValue(e.target.value);
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) { params.set('unit', e.target.value); } else { params.delete('unit'); }
              params.set('page', '1');
              window.history.replaceState({}, '', `?${params.toString()}`);
              getMaterials(1, limit, Object.fromEntries(params)).then(setApiResponse);
            }}
          >
            <option value="">หน่วยทั้งหมด</option>
            <option value="KG">KG</option>
            <option value="PCS">PCS</option>
            <option value="M">M</option>
          </select>
          <select
            value={statusValue}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            onChange={(e) => {
              setStatusValue(e.target.value);
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) { params.set('isActive', e.target.value); } else { params.delete('isActive'); }
              params.set('page', '1');
              window.history.replaceState({}, '', `?${params.toString()}`);
              getMaterials(1, limit, Object.fromEntries(params)).then(setApiResponse);
            }}
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="true">ใช้งาน</option>
            <option value="false">ไม่ใช้งาน</option>
          </select>
        </div>
      </div>

      {/* ── Material Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            รายการวัตถุดิบทั้งหมด
            {apiResponse?.pagination?.total != null && (
              <span className="ml-2 text-xs font-normal text-gray-400">({apiResponse.pagination.total.toLocaleString()} รายการ)</span>
            )}
          </span>
          <PaginationSelector currentLimit={limit} />
        </div>
        <div className="w-full">
          {/* Desktop List View */}
          <div className="hidden md:block space-y-3">
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
                <svg className="w-16 h-16 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            ) : !apiResponse?.data || apiResponse.data.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div className="text-center">
                  <div className="text-base font-medium text-gray-600 dark:text-gray-300">ไม่พบข้อมูลวัตถุดิบ</div>
                  <div className="text-sm text-gray-400 mt-1">ลองปรับคำค้นหาหรือเพิ่มวัตถุดิบใหม่</div>
                </div>
              </div>
            ) : apiResponse.data.map((material, idx) => {
              if (!material) return null;
              const wpPath = resolveWorkpieceImagePath(material);
              const rowNum = (page - 1) * limit + idx + 1;
              return (
                <div 
                  key={material.id} 
                  onClick={() => handleEdit(material)}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <WorkpieceImage path={wpPath} alt={material.matName || material.matCode} size="md"
                        onPreview={(src) => setImagePreview({ src, title: material.matName || material.matCode, subtitle: material.matCode })} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">#{rowNum}</span>
                        <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                          {material.matCode}
                        </span>
                        {material.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>ปิดใช้
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{material.matName || '-'}</div>
                      {material.materialsType?.name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{material.materialsType.name}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-400 dark:text-gray-500">หน่วย</div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{material.unitMaster?.name || material.unit || '-'}</div>
                      </div>
                      {material.defaultLocation?.name && (
                        <div className="text-right hidden lg:block">
                          <div className="text-xs text-gray-400 dark:text-gray-500">ที่เก็บ</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{material.defaultLocation.name}</div>
                        </div>
                      )}
                      {material.lotSize != null && (
                        <div className="text-right hidden xl:block">
                          <div className="text-xs text-gray-400 dark:text-gray-500">ขนาดล็อต</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{material.lotSize.toLocaleString()}</div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(material); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105"
                          title="แก้ไข"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(material); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105"
                          title="ลบ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
              <svg className="w-16 h-16 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">กำลังโหลด...</span>
            </div>
          ) : !apiResponse?.data || apiResponse.data.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div className="text-center">
                <div className="text-base font-medium text-gray-600 dark:text-gray-300">ไม่พบข้อมูลวัตถุดิบ</div>
                <div className="text-sm text-gray-400 mt-1">ลองปรับคำค้นหาหรือเพิ่มวัตถุดิบใหม่</div>
              </div>
            </div>
          ) : apiResponse.data.map((material, idx) => {
            if (!material) return null;
            const wpPath = resolveWorkpieceImagePath(material);
            const rowNum = (page - 1) * limit + idx + 1;
            return (
              <div key={material.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-4 mb-4">
                  <WorkpieceImage path={wpPath} alt={material.matName || material.matCode} size="md"
                    onPreview={(src) => setImagePreview({ src, title: material.matName || material.matCode, subtitle: material.matCode })} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-500">#{rowNum}</span>
                      {material.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>ใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>ปิดใช้
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg inline-block mb-1">
                      {material.matCode}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white text-base mb-1">{material.matName || '-'}</div>
                    {material.materialsType?.name && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{material.materialsType.name}</div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">หน่วย</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{material.unitMaster?.name || material.unit || '-'}</div>
                  </div>
                  {material.defaultLocation?.name && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">ที่เก็บ</div>
                      <div className="font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{material.defaultLocation.name}</div>
                    </div>
                  )}
                  {material.model?.name && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">โมเดล</div>
                      <div className="font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{material.model.name}</div>
                    </div>
                  )}
                  {material.lotSize != null && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">ขนาดล็อต</div>
                      <div className="font-bold text-gray-900 dark:text-white tabular-nums">{material.lotSize.toLocaleString()}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => handleEdit(material)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(material)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {apiResponse?.pagination && (
        <div className="mt-4">
          <PaginationFooter page={page} limit={limit} total={totalItems} totalPages={totalPages} hrefBuilder={paginationHref} />
        </div>
      )}

      {/* Add Modal */}
      <BaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="เพิ่มวัตถุดิบใหม่"
        size="xl"
      >
        <div className="overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl" style={{maxHeight: 'calc(90vh - 100px)'}}>
          <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {submitError}
            </div>
          )}
          
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">ข้อมูลพื้นฐาน</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">รหัสวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.matCode} 
                  onChange={(e) => setFormData({...formData, matCode: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ชื่อวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                รูปภาพชิ้นงาน <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full h-10 text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-1.5 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300 dark:file:bg-blue-950/50 dark:file:text-blue-300"
                  onChange={(e) => setAddWorkpieceFromInput(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG หรือ WebP ไม่เกิน 5 MB</p>
              <div className="mt-2">
                <WorkpieceImage
                  src={addWorkpiecePreviewUrl}
                  path={null}
                  size="lg"
                  className="w-64 max-h-32"
                  onPreview={(src) =>
                    setImagePreview({ src, title: formData.name || formData.matCode || "รูปชิ้นงาน" })
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">การจัดการ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ประเภท *</label>
                <select 
                  value={formData.matTypeId} 
                  onChange={(e) => setFormData({...formData, matTypeId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required
                >
                  {materialTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ที่เก็บ *</label>
                <select 
                  value={formData.defaultLocationId} 
                  onChange={(e) => setFormData({...formData, defaultLocationId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required
                >
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">คำอธิบาย</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                rows={3} 
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">รายละเอียดเพิ่มเติม</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">หน่วย</label>
                <select 
                  value={formData.unitId} 
                  onChange={(e) => setFormData({...formData, unitId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">ไม่ระบุ</option>
                  {units && units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">LR</label>
                <select 
                  value={formData.lr} 
                  onChange={(e) => setFormData({...formData, lr: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">เลือก</option>
                  <option value="L">L</option>
                  <option value="R">R</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Scale</label>
                <input 
                  type="text" 
                  value={formData.scale} 
                  onChange={(e) => setFormData({...formData, scale: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">โมเดล</label>
                <select 
                  value={formData.modelId} 
                  onChange={(e) => setFormData({...formData, modelId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">ไม่ระบุ</option>
                  {models && models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ประเภทการส่ง</label>
                <select 
                  value={formData.deliveryTypeId} 
                  onChange={(e) => setFormData({...formData, deliveryTypeId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">ไม่ระบุ</option>
                  {deliveryTypes && deliveryTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">จุดขนถ่าย</label>
                <select 
                  value={formData.loadingPointId} 
                  onChange={(e) => setFormData({...formData, loadingPointId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">ไม่ระบุ</option>
                  {loadingPoints && loadingPoints.map(point => (
                    <option key={point.id} value={point.id}>{point.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">สายการผลิต</label>
                <select 
                  value={formData.processLineId} 
                  onChange={(e) => setFormData({...formData, processLineId: parseInt(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">ไม่ระบุ</option>
                  {processLines && processLines.map(line => (
                    <option key={line.id} value={line.id}>{line.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Stock</label>
                <input 
                  type="number" 
                  value={formData.minStock.toString()} 
                  onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ขนาดล็อต</label>
                <input 
                  type="number" 
                  value={formData.lotSize.toString()} 
                  onChange={(e) => setFormData({...formData, lotSize: parseInt(e.target.value) || 0})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ผู้จัดจำหน่าย</label>
              <select 
                value={formData.supplierId} 
                onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})}
                onFocus={async () => {
                  const suppliersData = await getSuppliers();
                  setSuppliers(suppliersData);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">ไม่ระบุ</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                  บันทึก
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      matCode: '',
                      matTypeId: 1,
                      defaultLocationId: 1,
                      supplierId: 0,
                      modelId: 0,
                      deliveryTypeId: 0,
                      unitId: 0,
                      loadingPointId: 0,
                      processLineId: 0,
                      name: '',
                      description: '',
                      lr: '',
                      lotSize: 0,
                      scale: '',
                      minStock: 0,
                      createBy: currentUser
                    });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
      </BaseModal>

      {/* Edit Modal */}
      <BaseModal
        isOpen={showEditModal && editingMaterial !== null}
        onClose={() => setShowEditModal(false)}
        title="แก้ไขวัตถุดิบ"
        size="xl"
      >
        <div className="overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl" style={{maxHeight: 'calc(90vh - 100px)'}}>
              <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                let newWorkpiecePath: string | undefined;
                if (editWorkpieceFile) {
                  const fd = new FormData();
                  fd.append("file", editWorkpieceFile);
                  const up = await apiFetch("/materials/upload/workpiece-image", { method: "POST", body: fd });
                  const upJson = await up.json().catch(() => ({}));
                  if (!up.ok || upJson?.success === false) {
                    setSubmitError(
                      typeof upJson?.message === "string" ? upJson.message : "อัปโหลดรูปภาพไม่สำเร็จ",
                    );
                    setTimeout(() => setSubmitError(null), 5000);
                    return;
                  }
                  const p = upJson?.data?.filePath as string | undefined;
                  if (!p?.trim()) {
                    setSubmitError("อัปโหลดรูปภาพไม่สำเร็จ");
                    setTimeout(() => setSubmitError(null), 5000);
                    return;
                  }
                  newWorkpiecePath = p;
                }
                const updateData: Record<string, unknown> = {
                  matCode: formData.matCode,
                  matName: formData.name || '',
                  description: formData.description || '',
                  matTypeId: formData.matTypeId,
                  defaultLocationId: formData.defaultLocationId,
                  supplierId: formData.supplierId || 0,
                  modelId: formData.modelId || 0,
                  deliveryTypeId: formData.deliveryTypeId || 0,
                  unitId: formData.unitId || 0,
                  loadingPointId: formData.loadingPointId || 0,
                  processLineId: formData.processLineId || 0,
                  lr: formData.lr || '',
                  lotSize: formData.lotSize || 0,
                  scale: formData.scale || '',
                  minStock: formData.minStock || 0,
                  isActive: true
                };
                if (newWorkpiecePath) {
                  updateData.workpieceImagePath = newWorkpiecePath;
                }
                const response = await apiFetch(`/materials/${editingMaterial!.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (response.ok) {
                  setShowEditModal(false);
                  setSubmitSuccess('อัปเดตวัตถุดิบสำเร็จ');
                  const updatedResponse = await getMaterials(page, limit);
                  setApiResponse(updatedResponse);
                  setTimeout(() => setSubmitSuccess(null), 3000);
                } else {
                  const errorData = await response.json();
                  setSubmitError(errorData.message || 'เกิดข้อผิดพลาดในการอัปเดต');
                  setTimeout(() => setSubmitError(null), 5000);
                }
              } catch (err) {
                setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                setTimeout(() => setSubmitError(null), 5000);
              }
            }} className="space-y-5">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">ข้อมูลพื้นฐาน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">รหัสวัตถุดิบ *</label>
                    <input 
                      type="text" 
                      value={formData.matCode} 
                      onChange={(e) => setFormData({...formData, matCode: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ชื่อวัตถุดิบ *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      required 
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">รูปภาพชิ้นงาน</label>
                  <div className="mb-2">
                    <WorkpieceImage
                      src={editWorkpiecePreviewUrl}
                      path={editWorkpiecePreviewUrl ? null : editingMaterial ? resolveWorkpieceImagePath(editingMaterial) : null}
                      alt={editingMaterial?.matName || editingMaterial?.matCode || '-'}
                      size="lg"
                      className="w-64 max-h-32"
                      onPreview={(src) =>
                        setImagePreview({
                          src,
                          title: editingMaterial?.matName || editingMaterial?.matCode || '-',
                          subtitle: editingMaterial?.matCode || '-',
                        })
                      }
                    />
                  </div>
                  <div className="w-full">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="w-full h-10 text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-1.5 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300 dark:file:bg-blue-950/50 dark:file:text-blue-300"
                      onChange={(e) => setEditWorkpieceFromInput(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">เว้นว่างเพื่อคงรูปเดิม — JPEG, PNG หรือ WebP ไม่เกิน 5 MB</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">การจัดการ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ประเภท *</label>
                    <select 
                      value={formData.matTypeId} 
                      onChange={(e) => setFormData({...formData, matTypeId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      required
                    >
                      <option value="">เลือกประเภท</option>
                      {materialTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ที่เก็บ *</label>
                    <select 
                      value={formData.defaultLocationId} 
                      onChange={(e) => setFormData({...formData, defaultLocationId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      required
                    >
                      <option value="">เลือกที่เก็บ</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">คำอธิบาย</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows={3} 
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">รายละเอียดเพิ่มเติม</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">หน่วย</label>
                    <select 
                      value={formData.unitId} 
                      onChange={(e) => setFormData({...formData, unitId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">ไม่ระบุ</option>
                      {units && units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">โมเดล</label>
                    <select 
                      value={formData.modelId} 
                      onChange={(e) => setFormData({...formData, modelId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">ไม่ระบุ</option>
                      {models && models.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ประเภทการส่ง</label>
                    <select 
                      value={formData.deliveryTypeId} 
                      onChange={(e) => setFormData({...formData, deliveryTypeId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">ไม่ระบุ</option>
                      {deliveryTypes && deliveryTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">จุดขนถ่าย</label>
                    <select 
                      value={formData.loadingPointId} 
                      onChange={(e) => setFormData({...formData, loadingPointId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">ไม่ระบุ</option>
                      {loadingPoints && loadingPoints.map(point => (
                        <option key={point.id} value={point.id}>{point.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">สายการผลิต</label>
                    <select 
                      value={formData.processLineId} 
                      onChange={(e) => setFormData({...formData, processLineId: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">ไม่ระบุ</option>
                      {processLines && processLines.map(line => (
                        <option key={line.id} value={line.id}>{line.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">LR</label>
                    <select 
                      value={formData.lr} 
                      onChange={(e) => setFormData({...formData, lr: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">เลือก</option>
                      <option value="L">L</option>
                      <option value="R">R</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Scale</label>
                    <input 
                      type="text" 
                      value={formData.scale} 
                      onChange={(e) => setFormData({...formData, scale: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Stock</label>
                    <input 
                      type="number" 
                      value={formData.minStock.toString()} 
                      onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ขนาดล็อต</label>
                    <input 
                      type="number" 
                      value={formData.lotSize.toString()} 
                      onChange={(e) => setFormData({...formData, lotSize: parseInt(e.target.value) || 0})} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">ผู้จัดจำหน่าย</label>
                  <select 
                    value={formData.supplierId} 
                    onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {suppliers && suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                  อัปเดต
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
      </BaseModal>

      <BaseModal
        isOpen={showDeleteModal && deletingMaterial !== null}
        onClose={() => setShowDeleteModal(false)}
        title="ยืนยันการลบ"
        size="sm"
      >
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            คุณต้องการลบวัตถุดิบ <strong>{deletingMaterial?.matCode}</strong> หรือไม่?
          </p>
          <p className="text-sm text-red-600 mt-2">
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
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
            onClick={() => setShowDeleteModal(false)}
            className="flex-1"
          >
            ยกเลิก
          </ActionButton>
        </div>
      </BaseModal>

      <WorkpieceImagePreviewModal
        open={!!imagePreview}
        src={imagePreview?.src ?? null}
        title={imagePreview?.title}
        subtitle={imagePreview?.subtitle}
        onClose={() => setImagePreview(null)}
      />
    </PageContainer>
  );
}
