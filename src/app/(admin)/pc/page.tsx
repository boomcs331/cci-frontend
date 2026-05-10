"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import Alert from "@/components/ui/alert/Alert";
import { apiFetch } from "@/utils/api";
import { createPaginationHrefBuilder } from "@/lib/pagination";

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
    setEditingMaterial(material);
    setFormData({
      matCode: material.matCode,
      matTypeId: material.matTypeId,
      defaultLocationId: material.defaultLocationId,
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
    
    try {
      const payload: any = {
        matCode: formData.matCode,
        matName: formData.name,
        matTypeId: formData.matTypeId,
        defaultLocationId: formData.defaultLocationId,
        lr: formData.lr,
        lotSize: formData.lotSize,
        minStock: formData.minStock || 0,
        isActive: true,
        createBy: currentUser
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

  const pageShellClass =
    "-mx-4 flex min-h-[calc(100dvh-5.25rem)] flex-col gap-4 px-4 pb-2 md:-mx-6 md:px-6 md:pb-4";

  if (loading) {
    return (
      <div className={pageShellClass}>
        <PageBreadcrumb pageTitle="จัดการวัตถุดิบ" />
        <ComponentCard title="ข้อมูลวัตถุดิบ">
          <div className="py-8 text-center">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageShellClass}>
        <PageBreadcrumb pageTitle="จัดการวัตถุดิบ" />
        <ComponentCard title="ข้อมูลวัตถุดิบ">
          <div className="py-8 text-center text-red-500">
            เกิดข้อผิดพลาด: {error}
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      <PageBreadcrumb pageTitle="จัดการวัตถุดิบ" />
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {submitSuccess && (
          <Alert
            variant="success"
            title="สำเร็จ"
            message={submitSuccess}
          />
        )}
        
        {submitError && (
          <Alert
            variant="error"
            title="เกิดข้อผิดพลาด"
            message={submitError}
          />
        )}
        
        <ComponentCard title={`วัตถุดิบทั้งหมด (${totalItems})`}>
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <PaginationSelector currentLimit={limit} />
              <button
                type="button"
                onClick={() => {
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
                setShowAddModal(true);
              }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มวัตถุดิบ
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-6">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    ค้นหา
                  </label>
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัส/ชื่อ..."
                    value={searchValue}
                    className="h-11 w-full px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      const params = new URLSearchParams(searchParams.toString());
                      if (e.target.value) {
                        params.set('search', e.target.value);
                      } else {
                        params.delete('search');
                      }
                      params.set('page', '1');
                      window.history.replaceState({}, '', `?${params.toString()}`);
                      const fetchData = async () => {
                        const response = await getMaterials(1, limit, Object.fromEntries(params));
                        setApiResponse(response);
                      };
                      fetchData();
                    }}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    หน่วย
                  </label>
                  <select
                    value={unitValue}
                    className="h-11 w-full px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    onChange={(e) => {
                      setUnitValue(e.target.value);
                      const params = new URLSearchParams(searchParams.toString());
                      if (e.target.value) {
                        params.set('unit', e.target.value);
                      } else {
                        params.delete('unit');
                      }
                      params.set('page', '1');
                      window.history.replaceState({}, '', `?${params.toString()}`);
                      const fetchData = async () => {
                        const response = await getMaterials(1, limit, Object.fromEntries(params));
                        setApiResponse(response);
                      };
                      fetchData();
                    }}
                  >
                    <option value="">ทุกหน่วย</option>
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="M">M</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={statusValue}
                    className="h-11 w-full px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    onChange={(e) => {
                      setStatusValue(e.target.value);
                      const params = new URLSearchParams(searchParams.toString());
                      if (e.target.value) {
                        params.set('isActive', e.target.value);
                      } else {
                        params.delete('isActive');
                      }
                      params.set('page', '1');
                      window.history.replaceState({}, '', `?${params.toString()}`);
                      const fetchData = async () => {
                        const response = await getMaterials(1, limit, Object.fromEntries(params));
                        setApiResponse(response);
                      };
                      fetchData();
                    }}
                  >
                    <option value="">ทุกสถานะ</option>
                    <option value="true">ใช้งาน</option>
                    <option value="false">ไม่ใช้งาน</option>
                  </select>
                </div>

                <div className="lg:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setSearchValue('');
                      setUnitValue('');
                      setStatusValue('');
                      window.history.replaceState({}, '', `?page=1&limit=${limit}`);
                      const fetchData = async () => {
                        const response = await getMaterials(1, limit);
                        setApiResponse(response);
                      };
                      fetchData();
                    }}
                    className="h-11 w-full px-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            </div>
          </div>
          {apiResponse?.data && apiResponse.data.length > 0 ? (
            <div className="max-h-[min(70dvh,calc(100dvh-17rem))] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-max w-full table-auto">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 shadow-sm dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">ชื่อวัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">โมเดล</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">ประเภทการส่ง</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">ขนาดล็อต</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">หน่วย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">Scale</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">ที่เก็บ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">จุดขนถ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">ผู้จัดจำหน่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">สายการผลิต</th>
                    <th className="sticky right-0 z-20 bg-gray-50 px-4 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900 shadow-[-4px_0_8px_-4px_rgba(0,0,0,.08)] dark:bg-gray-800 dark:text-white">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {apiResponse.data.map((material, idx) => (
                    <tr
                      key={material.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${idx % 2 === 1 ? "bg-gray-50/40 dark:bg-gray-900/20" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.matCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.matName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.model?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.deliveryType?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.lotSize?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.unitMaster?.name || material.unit || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.scale || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.defaultLocation?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.loadingPoint?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.supplier?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{material.processLine?.name || '-'}</td>
                      <td className="sticky right-0 z-10 bg-white px-4 py-3 text-center whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,.06)] dark:bg-gray-900">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(material)} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(material)} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <div className="text-base font-medium text-gray-700 dark:text-gray-200">ไม่พบข้อมูลวัตถุดิบ</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ลองปรับคำค้น/ตัวกรอง หรือเพิ่มวัตถุดิบใหม่
              </div>
            </div>
          )}

          {apiResponse?.pagination && (
            <PaginationFooter
              page={page}
              limit={limit}
              total={totalItems}
              totalPages={totalPages}
              hrefBuilder={paginationHref}
            />
          )}
        </ComponentCard>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่มวัตถุดิบใหม่</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <Alert
                  variant="error"
                  title="เกิดข้อผิดพลาด"
                  message={submitError}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.matCode} 
                  onChange={(e) => setFormData({...formData, matCode: e.target.value})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภท *</label>
                  <select 
                    value={formData.matTypeId} 
                    onChange={(e) => setFormData({...formData, matTypeId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                    required
                  >
                    {materialTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ที่เก็บ *</label>
                  <select 
                    value={formData.defaultLocationId} 
                    onChange={(e) => setFormData({...formData, defaultLocationId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                    required
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  rows={3} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วย</label>
                  <select 
                    value={formData.unitId} 
                    onChange={(e) => setFormData({...formData, unitId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {units && units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LR</label>
                  <select 
                    value={formData.lr} 
                    onChange={(e) => setFormData({...formData, lr: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="">เลือก</option>
                    <option value="L">L</option>
                    <option value="R">R</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">โมเดล</label>
                  <select 
                    value={formData.modelId} 
                    onChange={(e) => setFormData({...formData, modelId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {models && models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภทการส่ง</label>
                  <select 
                    value={formData.deliveryTypeId} 
                    onChange={(e) => setFormData({...formData, deliveryTypeId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {deliveryTypes && deliveryTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จุดขนถ่าย</label>
                  <select 
                    value={formData.loadingPointId} 
                    onChange={(e) => setFormData({...formData, loadingPointId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {loadingPoints && loadingPoints.map(point => (
                      <option key={point.id} value={point.id}>{point.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สายการผลิต</label>
                  <select 
                    value={formData.processLineId} 
                    onChange={(e) => setFormData({...formData, processLineId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {processLines && processLines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scale</label>
                  <input 
                    type="text" 
                    value={formData.scale} 
                    onChange={(e) => setFormData({...formData, scale: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Stock</label>
                  <input 
                    type="number" 
                    value={formData.minStock.toString()} 
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ผู้จัดจำหน่าย</label>
                <select 
                  value={formData.supplierId} 
                  onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})}
                  onFocus={async () => {
                    const suppliersData = await getSuppliers();
                    setSuppliers(suppliersData);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                >
                  <option value="0">ไม่ระบุ</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ขนาดล็อต</label>
                <input 
                  type="number" 
                  value={formData.lotSize.toString()} 
                  onChange={(e) => setFormData({...formData, lotSize: parseInt(e.target.value) || 0})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
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
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">แก้ไขวัตถุดิบ</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const updateData = {
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
                const response = await apiFetch(`/materials/${editingMaterial.id}`, {
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
                <Alert
                  variant="error"
                  title="เกิดข้อผิดพลาด"
                  message={submitError}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.matCode} 
                  onChange={(e) => setFormData({...formData, matCode: e.target.value})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อวัตถุดิบ *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภท *</label>
                  <select 
                    value={formData.matTypeId} 
                    onChange={(e) => setFormData({...formData, matTypeId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                    required
                  >
                    <option value="">เลือกประเภท</option>
                    {materialTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ที่เก็บ *</label>
                  <select 
                    value={formData.defaultLocationId} 
                    onChange={(e) => setFormData({...formData, defaultLocationId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                    required
                  >
                    <option value="">เลือกที่เก็บ</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  rows={3} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ผู้จัดจำหน่าย</label>
                <select 
                  value={formData.supplierId} 
                  onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                >
                  <option value="0">ไม่ระบุ</option>
                  {suppliers && suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วย</label>
                  <select 
                    value={formData.unitId} 
                    onChange={(e) => setFormData({...formData, unitId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {units && units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">โมเดล</label>
                  <select 
                    value={formData.modelId} 
                    onChange={(e) => setFormData({...formData, modelId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {models && models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภทการส่ง</label>
                  <select 
                    value={formData.deliveryTypeId} 
                    onChange={(e) => setFormData({...formData, deliveryTypeId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {deliveryTypes && deliveryTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จุดขนถ่าย</label>
                  <select 
                    value={formData.loadingPointId} 
                    onChange={(e) => setFormData({...formData, loadingPointId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {loadingPoints && loadingPoints.map(point => (
                      <option key={point.id} value={point.id}>{point.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สายการผลิต</label>
                  <select 
                    value={formData.processLineId} 
                    onChange={(e) => setFormData({...formData, processLineId: parseInt(e.target.value)})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="0">ไม่ระบุ</option>
                    {processLines && processLines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LR</label>
                  <select 
                    value={formData.lr} 
                    onChange={(e) => setFormData({...formData, lr: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                  >
                    <option value="">เลือก</option>
                    <option value="L">L</option>
                    <option value="R">R</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scale</label>
                  <input 
                    type="text" 
                    value={formData.scale} 
                    onChange={(e) => setFormData({...formData, scale: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Stock</label>
                  <input 
                    type="number" 
                    value={formData.minStock.toString()} 
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ขนาดล็อต</label>
                <input 
                  type="number" 
                  value={formData.lotSize.toString()} 
                  onChange={(e) => setFormData({...formData, lotSize: parseInt(e.target.value) || 0})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
                  อัปเดต
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteModal && deletingMaterial && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ยืนยันการลบ</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                คุณต้องการลบวัตถุดิบ <strong>{deletingMaterial.matCode}</strong> หรือไม่?
              </p>
              <p className="text-sm text-red-600 mt-2">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                ลบ
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
