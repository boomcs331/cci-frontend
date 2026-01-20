"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import Alert from "@/components/ui/alert/Alert";

interface Material {
  id: number;
  matCode: string;
  matTypeId: number;
  defaultLocationId: number;
  lr: string;
  lotSize: number;
  unit: string;
  isActive: boolean;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
  supplierId?: number;
  materialsType: {
    id: number;
    code: string;
    name: string;
    createDate: string;
    createBy: string;
    updateDate: string | null;
    updateBy: string | null;
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  const url = `${apiUrl}/materials/?${params.toString()}`;
  
  const response = await fetch(url, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

interface PCPageProps {
  searchParams: { page?: string; limit?: string };
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
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [searchValue, setSearchValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [formData, setFormData] = useState({
    matCode: '',
    matTypeId: 1,
    defaultLocationId: 1,
    supplierId: 0,
    name: '',
    description: '',
    lr: '',
    lotSize: 0,
    unit: 'KG',
    initialStock: 0,
    createBy: ''
  });
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
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
    const response = await fetch('http://localhost:3006/materials/types/all');
    const result = await response.json();
    return result.data;
  };
  
  const getLocations = async () => {
    const response = await fetch('http://localhost:3006/materials/locations/all');
    const result = await response.json();
    return result.data;
  };
  
  const getSuppliers = async () => {
    const response = await fetch('http://localhost:3006/materials/suppliers/all');
    const result = await response.json();
    return result.data;
  };
  
  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      matCode: material.matCode,
      matTypeId: material.matTypeId,
      defaultLocationId: material.defaultLocationId,
      supplierId: material.supplierId || 0,
      name: material.itemsName?.name || '',
      description: material.itemsName?.description || '',
      lr: material.lr,
      lotSize: material.lotSize,
      unit: material.unit,
      initialStock: 0,
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
      const response = await fetch(`http://localhost:3006/materials/${deletingMaterial.id}`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
      const response = await fetch(`${apiUrl}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
          name: '',
          description: '',
          lr: '',
          lotSize: 0,
          unit: 'KG',
          initialStock: 0,
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
        const [materialsResponse, typesData, locationsData, suppliersData] = await Promise.all([
          getMaterials(page, limit),
          getMaterialTypes(),
          getLocations(),
          getSuppliers()
        ]);
        setApiResponse(materialsResponse);
        setMaterialTypes(typesData);
        setLocations(locationsData);
        setSuppliers(suppliersData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [page, limit]);

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Materials Management" />
        <div className="space-y-6">
          <ComponentCard title="ข้อมูลวัตถุดิบ">
            <div className="text-center py-8">กำลังโหลด...</div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Materials Management" />
        <div className="space-y-6">
          <ComponentCard title="ข้อมูลวัตถุดิบ">
            <div className="text-center py-8 text-red-500">
              เกิดข้อผิดพลาด: {error}
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Materials Management" />
      <div className="space-y-6">
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
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ตารางแสดงข้อมูลวัตถุดิบ</h2>
          </div>
        </div>
        
        <ComponentCard title={`All Materials (${apiResponse?.pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchValue}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                <select
                  value={unitValue}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                <select
                  value={statusValue}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  ล้าง
                </button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มวัตถุดิบ
              </button>
            </div>
          </div>
          {apiResponse?.data && apiResponse.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        รหัสวัตถุดิบ
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        ประเภท
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        หน่วย
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m0 0l4-4m-4 4l4 4" />
                        </svg>
                        ขนาดล็อต
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        ที่เก็บ
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        ผู้จัดจำหน่าย
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        คงเหลือ
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ใช้ได้
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        จอง
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        สถานะ
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {apiResponse.data.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{material.matCode}</div>
                          {material.itemsName?.name && (
                            <div className="text-blue-600 dark:text-blue-400 font-medium">{material.itemsName.name}</div>
                          )}
                          <div className="text-gray-500 dark:text-gray-400">ID: {material.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {material.materialsType.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{material.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.lotSize?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {material.defaultLocation.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {material.supplier ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{material.supplier.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{material.supplier.code}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.stock?.totalQty?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.stock?.availableQty?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.stock?.reservedQty?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          material.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {material.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(material)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(material)} className="p-1 text-red-600 hover:bg-red-100 rounded">
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
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลวัตถุดิบ</div>
          )}
          
          {apiResponse?.pagination && apiResponse.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, apiResponse.pagination.total)} of {apiResponse.pagination.total} results
              </div>
              <div className="flex items-center">
                <a href={`?page=${Math.max(1, page - 1)}&limit=${limit}`} className={`mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  Previous
                </a>
                <div className="flex items-center gap-2">
                  {page > 3 && <span className="px-2">...</span>}
                  {Array.from({ length: Math.min(3, apiResponse.pagination.totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(page - 1, 1);
                    return (
                      <a key={pageNum} href={`?page=${pageNum}&limit=${limit}`} className={`px-4 py-2 rounded ${
                        page === pageNum
                          ? "bg-brand-500 text-white"
                          : "text-gray-700 dark:text-gray-400"
                      } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}>
                        {pageNum}
                      </a>
                    );
                  })}
                  {page < apiResponse.pagination.totalPages - 2 && <span className="px-2">...</span>}
                </div>
                <a href={`?page=${Math.min(apiResponse.pagination.totalPages, page + 1)}&limit=${limit}`} className={`ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page >= apiResponse.pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  Next
                </a>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  <input 
                    type="text" 
                    value={formData.unit} 
                    onChange={(e) => setFormData({...formData, unit: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ผู้จัดจำหน่าย</label>
                <select 
                  value={formData.supplierId} 
                  onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})} 
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                >
                  <option value="0">ไม่ระบุ</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ขนาดล็อต</label>
                  <input 
                    type="number" 
                    value={formData.lotSize.toString()} 
                    onChange={(e) => setFormData({...formData, lotSize: parseInt(e.target.value) || 0})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จำนวนเริ่มต้น</label>
                  <input 
                    type="number" 
                    value={formData.initialStock.toString()} 
                    onChange={(e) => setFormData({...formData, initialStock: parseInt(e.target.value) || 0})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
                  บันทึก
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  name: formData.name,
                  description: formData.description,
                  matTypeId: formData.matTypeId,
                  defaultLocationId: formData.defaultLocationId,
                  supplierId: formData.supplierId,
                  lr: formData.lr,
                  lotSize: formData.lotSize,
                  unit: formData.unit,
                  isActive: true,
                  updateBy: currentUser
                };
                const response = await fetch(`http://localhost:3006/materials/${editingMaterial.id}`, {
                  method: 'PUT',
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
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วย</label>
                  <input 
                    type="text" 
                    value={formData.unit} 
                    onChange={(e) => setFormData({...formData, unit: e.target.value})} 
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800" 
                  />
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
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