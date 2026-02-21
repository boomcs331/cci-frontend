"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import Alert from "@/components/ui/alert/Alert";
import { getApiUrl, getApiBaseUrl } from "@/utils/api";

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
  const apiUrl = getApiBaseUrl();
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
    minStock: 0,
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
    const response = await fetch(getApiUrl('/materials/types/all'));
    const result = await response.json();
    return result.data || [];
  };
  
  const getLocations = async () => {
    const response = await fetch(getApiUrl('/materials/locations/all'));
    const result = await response.json();
    return result.data || [];
  };
  
  const getSuppliers = async () => {
    const response = await fetch(getApiUrl('/materials/suppliers/all'));
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
      name: material.matName || '',
      description: '',
      lr: material.lr,
      lotSize: material.lotSize,
      unit: material.unit,
      minStock: material.minStock || 0,
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
      const response = await fetch(getApiUrl(`/materials/${deletingMaterial.id}`), {
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
        unit: formData.unit,
        minStock: formData.minStock || 0,
        initialStock: formData.initialStock || 0,
        isActive: true,
        createBy: currentUser
      };

      if (formData.supplierId && formData.supplierId > 0) {
        payload.supplierId = formData.supplierId;
      }

      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      const response = await fetch(getApiUrl('/materials'), {
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
          name: '',
          description: '',
          lr: '',
          lotSize: 0,
          unit: 'KG',
          minStock: 0,
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
        <PageBreadcrumb pageTitle="จัดการวัตถุดิบ" />
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
        <PageBreadcrumb pageTitle="จัดการวัตถุดิบ" />
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

  return <div>Page content here</div>;
}
