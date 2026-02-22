"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import QRScannerModal from "@/components/qr/QRScannerModal";
import AlertComponent from "@/components/ui/alert/Alert";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import AlertModal from "@/components/ui/modal/AlertModal";
import FilePreviewModal from "@/components/common/FilePreviewModal";

export default function PCOutcomePage() {
  const searchParams = useSearchParams();
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<{id: number, quantity: number}[]>([]);
  const [bomQuantity, setBomQuantity] = useState<number>(1);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [workOrderNo, setWorkOrderNo] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [showScanner, setShowScanner] = useState(false);
  const [issueMode, setIssueMode] = useState<'manual' | 'production'>('manual');
  const [issueType, setIssueType] = useState<string>('');
  const [issuingTypeId, setIssuingTypeId] = useState<number | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [alertMsg, setAlertMsg] = useState<{variant: "success" | "error" | "warning" | "info", title: string, message: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, variant: "success" | "error" | "warning" | "info", title: string, message: string} | null>(null);
  const [previewFiles, setPreviewFiles] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [materialPreview, setMaterialPreview] = useState<any>(null);
  const [checkingMaterials, setCheckingMaterials] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [outRes, matsRes, prodsRes] = await Promise.all([
          fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`),
          fetch('http://localhost:3006/materials/all'),
          fetch('http://localhost:3006/products?page=1&limit=100')
        ]);
        const outData = await outRes.json();
        const matsData = await matsRes.json();
        const prodsData = await prodsRes.json();
        if (outData.success) {
          setOutcomes(outData.data || []);
          setPagination(outData.pagination);
        }
        setMaterials(matsData.data || []);
        setProducts(prodsData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const session = localStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed.user?.username || 'admin');
      } catch (e) {}
    }
  }, [page, limit]);

  const checkMaterialAvailability = async (productId: number, quantity: number) => {
    setCheckingMaterials(true);
    try {
      const response = await fetch('http://localhost:3006/materials/transactions/issue-production/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productionQuantity: quantity })
      });
      const result = await response.json();
      if (result.success) setMaterialPreview(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingMaterials(false);
    }
  };

  useEffect(() => {
    if (selectedProduct && bomQuantity > 0 && issueMode === 'production') {
      checkMaterialAvailability(selectedProduct.id, bomQuantity);
    } else {
      setMaterialPreview(null);
    }
  }, [selectedProduct, bomQuantity, issueMode]);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (issueMode === 'manual') {
      if (!materialId) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาเลือกวัตถุดิบ"});
        return;
      }
      if (quantity <= 0) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาระบุจำนวนที่ถูกต้อง"});
        return;
      }
      if (!issueType) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาเลือกประเภทการจ่าย"});
        return;
      }

      setSubmitLoading(true);
      try {
        let uploadedDocumentFiles: any[] = [];
        
        if (documentFiles.length > 0) {
          const formData = new FormData();
          documentFiles.forEach(file => {
            formData.append('files', file);
          });
          
          const uploadRes = await fetch('http://localhost:3006/materials/upload/document', {
            method: 'POST',
            body: formData
          });
          
          const uploadResult = await uploadRes.json();
          if (uploadResult.success && uploadResult.data.files) {
            uploadedDocumentFiles = uploadResult.data.files.map((file: any) => ({
              fileName: file.fileName || file.originalName,
              filePath: file.filePath || file.path,
              fileType: file.fileType || file.mimeType,
              fileSize: file.fileSize || file.size
            }));
          }
        }

        const payload: any = {
          issueDate: new Date().toISOString(),
          documentNo: workOrderNo.trim() || undefined,
          documentFiles: uploadedDocumentFiles.length > 0 ? uploadedDocumentFiles : undefined,
          remarks: remark.trim() || undefined,
          items: [{
            materialId,
            quantity,
            unit: materials.find(m => m.id === materialId)?.unit || 'PCS',
            fromLocationId: undefined,
            remarks: `${issueType} - ${department.trim() || ''}`
          }]
        };

        const response = await fetch('http://localhost:3006/materials/transactions/issue-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
          setAlertMsg({variant: "success", title: "สำเร็จ", message: "จ่ายออกสำเร็จ!"});
          setTimeout(() => {
            setShowAddModal(false);
            resetForm();
            setAlertMsg(null);
          }, 1500);
          const outRes = await fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`);
          const outData = await outRes.json();
          if (outData.success) {
            setOutcomes(outData.data || []);
            setPagination(outData.pagination);
          }
        } else {
          setAlertModal({isOpen: true, variant: "error", title: "เกิดข้อผิดพลาด", message: result.message || "ไม่สามารถจ่ายออกได้"});
        }
      } catch (err) {
        setAlertModal({isOpen: true, variant: "error", title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาดในการเชื่อมต่อ"});
      } finally {
        setSubmitLoading(false);
      }
    } else {
      if (!selectedProduct) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาเลือกสินค้า"});
        return;
      }
      if (bomQuantity <= 0) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาระบุจำนวนที่ถูกต้อง"});
        return;
      }

      const insufficientMaterials = materialPreview?.requiredMaterials?.filter((m: any) => !m.isAvailable) || [];
      if (insufficientMaterials.length > 0) {
        const errorMsg = 'วัตถุดิบไม่เพียงพอ:\n' + insufficientMaterials.map((m: any) => 
          `${m.materialName}: ต้องการ ${m.requiredQuantity} ${m.unit}, มีอยู่ ${m.currentStock} ${m.unit}`
        ).join('\n');
        setAlertModal({isOpen: true, variant: "error", title: "วัตถุดิบไม่เพียงพอ", message: errorMsg});
        return;
      }

      if (!issuingTypeId) {
        setAlertModal({isOpen: true, variant: "warning", title: "คำเตือน", message: "กรุณาเลือกประเภทการจ่าย"});
        return;
      }

      setSubmitLoading(true);
      try {
        const payload: any = {
          productId: selectedProduct.id,
          quantity: bomQuantity,
          issuingTypeId: issuingTypeId,
          department: department.trim() || undefined,
          workOrderNo: workOrderNo.trim() || undefined,
          remarks: remark.trim() || undefined
        };

        const response = await fetch('http://localhost:3006/materials/transactions/issue-from-bom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
          setAlertMsg({variant: "success", title: "สำเร็จ", message: `จ่ายออกตาม BOM สำเร็จ!`});
          setTimeout(() => {
            setShowAddModal(false);
            resetForm();
            setAlertMsg(null);
          }, 1500);
          const outRes = await fetch(`http://localhost:3006/materials/transactions/issues?page=${page}&limit=${limit}`);
          const outData = await outRes.json();
          if (outData.success) {
            setOutcomes(outData.data || []);
            setPagination(outData.pagination);
          }
        } else {
          setAlertModal({isOpen: true, variant: "error", title: "เกิดข้อผิดพลาด", message: result.message || "ไม่สามารถจ่ายออกได้"});
        }
      } catch (err) {
        setAlertModal({isOpen: true, variant: "error", title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาดในการเชื่อมต่อ"});
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const filteredMaterials = materials.filter(m => 
    materialSearch === '' || 
    m.matCode.toLowerCase().includes(materialSearch.toLowerCase()) ||
    (m.matName || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

  const resetForm = () => {
    setMaterialId(null);
    setMaterialSearch('');
    setQuantity(0);
    setRemark('');
    setDepartment('');
    setWorkOrderNo('');
    setSelectedMaterials([]);
    setSelectedProduct(null);
    setIssueType('');
    setDocumentFile(null);
    setDocumentFiles([]);
    setBomQuantity(1);
    setMaterialPreview(null);
    setIssuingTypeId(null);
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="รายการจ่ายออก" />
        <ComponentCard title="รายการจ่ายออก">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายการจ่ายออก" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">รายการจ่ายออกวัตถุดิบ</h2>
          </div>
        </div>

        <ComponentCard title={`รายการจ่ายออก (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                ตรวจสอบ QR
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                จ่ายออก (FIFO)
              </button>
            </div>
          </div>

          {outcomes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบจ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่จ่าย</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">แผนก</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Work Order</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">เอกสาร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {outcomes.map((out) => (
                    <tr key={out.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{out.issueNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(out.issueDate).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{out.items?.[0]?.material?.matCode}</div>
                        <div className="text-xs text-gray-500">{out.items?.[0]?.material?.matName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {out.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {out.productionOrderNo || out.workOrderNo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{parseFloat(out.items?.[0]?.issuedQuantity || 0).toLocaleString()} {out.items?.[0]?.unit}</td>
                      <td className="px-4 py-3 text-center">
                        {out.documents && out.documents.length > 0 ? (
                          <button
                            onClick={() => {
                              setPreviewFiles(out.documents);
                              setPreviewIndex(0);
                              setShowPreview(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-xs font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            ดูไฟล์ ({out.documents.length})
                          </button>
                        ) : out.documentFile && out.documentFile !== '/uploads/default.pdf' ? (
                          <button
                            onClick={() => {
                              const fileName = out.documentFile.split('/').pop() || 'document';
                              setPreviewFiles([{
                                id: out.id,
                                fileName: fileName,
                                filePath: out.documentFile,
                                fileSize: 0
                              }]);
                              setPreviewIndex(0);
                              setShowPreview(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-xs font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            ดูไฟล์ (1)
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มีไฟล์</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลรายการจ่ายออก</div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center">
                <a href={`?page=${Math.max(1, page - 1)}&limit=${limit}`} className={`mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  Previous
                </a>
                <div className="flex items-center gap-2">
                  {page > 3 && <span className="px-2">...</span>}
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
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
                  {page < pagination.totalPages - 2 && <span className="px-2">...</span>}
                </div>
                <a href={`?page=${Math.min(pagination.totalPages, page + 1)}&limit=${limit}`} className={`ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
                  page >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">จ่ายวัตถุดิบออก (FIFO)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              {alertMsg && (
                <div className="mb-4">
                  <AlertComponent variant={alertMsg.variant} title={alertMsg.title} message={alertMsg.message} />
                </div>
              )}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIssueMode('manual');
                    resetForm();
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    issueMode === 'manual'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  จ่ายแบบ Manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIssueMode('production');
                    resetForm();
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    issueMode === 'production'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  จ่ายตาม BOM
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {issueMode === 'manual' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={materialSearch}
                          onChange={(e) => {
                            setMaterialSearch(e.target.value);
                            setShowMaterialDropdown(true);
                          }}
                          onFocus={() => setShowMaterialDropdown(true)}
                          placeholder="ค้นหารหัสหรือชื่อวัตถุดิบ"
                          className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        {showMaterialDropdown && filteredMaterials.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredMaterials.slice(0, 50).map((mat) => (
                              <div
                                key={mat.id}
                                onClick={() => {
                                  setMaterialId(mat.id);
                                  setMaterialSearch(`${mat.matCode} - ${mat.matName || 'ไม่มีชื่อ'}`);
                                  setShowMaterialDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">{mat.matCode}</div>
                                <div className="text-xs text-gray-500">{mat.matName}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">จำนวน *</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ประเภทการจ่าย *</label>
                      <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">-- เลือกประเภท --</option>
                        <option value="production">ผลิต</option>
                        <option value="maintenance">ซ่อมบำรุง</option>
                        <option value="rnd">R&D</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">แนบเอกสาร (หลายไฟล์)</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setDocumentFiles(files);
                        }}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      {documentFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {documentFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded">
                              <span>ไฟล์ {idx + 1}: {file.name}</span>
                              <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                          ))}
                          <div className="text-xs text-gray-500 mt-2">
                            ทั้งหมด {documentFiles.length} ไฟล์
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลือกสินค้า *</label>
                      <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => {
                          const product = products.find(p => p.id === Number(e.target.value));
                          setSelectedProduct(product || null);
                        }}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">-- เลือกสินค้า --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">จำนวนที่ต้องการผลิต *</label>
                      <input
                        type="number"
                        value={bomQuantity}
                        onChange={(e) => setBomQuantity(Number(e.target.value))}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        min="1"
                        step="1"
                        required
                      />
                    </div>

                    {checkingMaterials && (
                      <div className="text-center py-4 text-gray-500">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                        <p className="mt-2">กำลังตรวจสอบวัตถุดิบ...</p>
                      </div>
                    )}

                    {materialPreview && materialPreview.requiredMaterials && (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">วัตถุดิบที่จะถูกจ่าย (PC):</h4>
                        <div className="space-y-2">
                          {materialPreview.requiredMaterials.map((mat: any, idx: number) => (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded border ${
                              mat.isAvailable ? 'bg-white dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20 border-red-300'
                            }`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{mat.materialCode}</span>
                                  {!mat.isAvailable && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">ไม่พอ</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{mat.materialName}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">ต้องการ: {mat.requiredQuantity.toLocaleString()} {mat.unit}</div>
                                <div className={`text-xs ${mat.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                  คงเหลือ: {mat.currentStock.toLocaleString()} {mat.unit}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {materialPreview.requiredMaterials.some((m: any) => !m.isAvailable) && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700 font-medium">⚠️ มีวัตถุดิบไม่เพียงพอ ไม่สามารถจ่ายออกได้</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ประเภทการจ่าย *</label>
                      <select
                        value={issuingTypeId || ''}
                        onChange={(e) => setIssuingTypeId(Number(e.target.value))}
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">-- เลือกประเภท --</option>
                        <option value="1">ผลิต</option>
                        <option value="2">ซ่อมบำรุง</option>
                        <option value="3">R&D</option>
                        <option value="4">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">แผนก</label>
                      <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลขที่ Work Order</label>
                      <input type="text" value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">หมายเหตุ</label>
                      <textarea value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows={3} />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" disabled={submitLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded">
                    {submitLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded">ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant="warning"
        />
      )}
      {alertModal && (
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal(null)}
          title={alertModal.title}
          message={alertModal.message}
          variant={alertModal.variant}
        />
      )}
      {showPreview && previewFiles.length > 0 && (
        <FilePreviewModal
          files={previewFiles}
          initialIndex={previewIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
