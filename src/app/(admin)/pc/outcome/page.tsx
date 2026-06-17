"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faPlus,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import { apiFetch } from "@/utils/api";
import OutcomeTable from "@/components/pc/outcome/OutcomeTable";
import { PcTransactionPageHeader } from "@/components/pc/transactions/PcTransactionPageHeader";
import { PcTransactionActionButton } from "@/components/pc/transactions/PcTransactionActionButton";
import {
  PcTransactionFilterCard,
  PcFilterField,
  PcFilterSearchInput,
  INPUT_CLS,
} from "@/components/pc/transactions/PcTransactionFilterCard";
import { PcTransactionDataCard } from "@/components/pc/transactions/PcTransactionDataCard";
import { PcTransactionLoading } from "@/components/pc/transactions/PcTransactionLoading";
import QRScannerModal from "@/components/qr/QRScannerModal";
import { BaseModal, ActionButton } from "@/components/shared";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import { pcErrorFromApiBody } from "@/lib/pc";

export default function PCOutcomePage() {
  const searchParams = useSearchParams();
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listFetching, setListFetching] = useState(false);
  const hasLoadedOnceRef = useRef(false);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterIssueType, setFilterIssueType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  const issuesUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (filterMaterial) params.set("materialId", filterMaterial);
    if (filterIssueType) params.set("issueType", filterIssueType);
    if (filterDateFrom) params.set("startDate", filterDateFrom);
    if (filterDateTo) params.set("endDate", filterDateTo);
    return `/materials/transactions/issues?${params.toString()}`;
  }, [page, limit, debouncedSearch, filterMaterial, filterIssueType, filterDateFrom, filterDateTo]);

  const hasActiveFilters = Boolean(
    searchTerm || filterMaterial || filterIssueType || filterDateFrom || filterDateTo,
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMaterial("");
    setFilterIssueType("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [matsRes, prodsRes] = await Promise.all([
          apiFetch("/materials/all"),
          apiFetch("/products?page=1&limit=100"),
        ]);
        if (cancelled) return;
        const matsData = await matsRes.json();
        const prodsData = await prodsRes.json();
        setMaterials(matsData.data || []);
        setProducts(prodsData.data || []);
      } catch (err) {
        console.error(err);
      }
    })();

    const session = localStorage.getItem("session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed.user?.username || "admin");
      } catch {
        /* ignore */
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      if (!hasLoadedOnceRef.current) {
        setInitialLoading(true);
      } else {
        setListFetching(true);
      }
      try {
        const outRes = await apiFetch(issuesUrl);
        if (cancelled) return;
        const outData = await outRes.json();
        if (outData.success) {
          setOutcomes(outData.data || []);
          setPagination(outData.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setListFetching(false);
          hasLoadedOnceRef.current = true;
        }
      }
    };
    void fetchList();
    return () => {
      cancelled = true;
    };
  }, [issuesUrl]);

  const checkMaterialAvailability = async (productId: number, quantity: number) => {
    setCheckingMaterials(true);
    try {
      const response = await apiFetch("/materials/transactions/issue-production/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productionQuantity: quantity }),
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

  const refreshOutcomes = async () => {
    setListFetching(true);
    try {
      const outRes = await apiFetch(issuesUrl);
      const outData = await outRes.json();
      if (outData.success) {
        setOutcomes(outData.data || []);
        setPagination(outData.pagination);
      }
    } finally {
      setListFetching(false);
    }
  };

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
          
          const uploadRes = await apiFetch("/materials/upload/document", {
            method: "POST",
            body: formData,
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

        const response = await apiFetch("/materials/transactions/issue-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        if (result.success) {
          setAlertMsg({variant: "success", title: "สำเร็จ", message: "จ่ายออกสำเร็จ!"});
          setTimeout(() => {
            setShowAddModal(false);
            resetForm();
            setAlertMsg(null);
          }, 1500);
          await refreshOutcomes();
        } else {
          const err = pcErrorFromApiBody(result);
          setAlertModal({isOpen: true, variant: "error", title: err.title, message: err.message || "ไม่สามารถจ่ายออกได้"});
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

        const response = await apiFetch("/materials/transactions/issue-from-bom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        if (result.success) {
          setAlertMsg({variant: "success", title: "สำเร็จ", message: `จ่ายออกตาม BOM สำเร็จ!`});
          setTimeout(() => {
            setShowAddModal(false);
            resetForm();
            setAlertMsg(null);
          }, 1500);
          await refreshOutcomes();
        } else {
          const err = pcErrorFromApiBody(result);
          setAlertModal({isOpen: true, variant: "error", title: err.title, message: err.message || "ไม่สามารถจ่ายออกได้"});
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

  if (initialLoading) {
    return <PcTransactionLoading pageTitle="รายการจ่ายออก" variant="outcome" />;
  }

  return (
    <div className="w-full space-y-6 px-3 pb-8 sm:px-4 lg:px-6">
      <PcTransactionPageHeader
        variant="outcome"
        pageTitle="รายการจ่ายออก"
        description="จ่ายวัตถุดิบตาม FIFO — ตรวจสอบ QR ล็อตก่อนจ่าย หรือบันทึกจ่ายแบบ Manual / ตาม BOM"
        icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
        stats={[
          { label: "ใบจ่ายทั้งหมด", value: (pagination?.total ?? 0).toLocaleString() },
          { label: "หน้านี้", value: outcomes.length },
        ]}
        actions={
          <>
            <PcTransactionActionButton variant="outcome" tone="secondary" onClick={() => setShowScanner(true)}>
              <FontAwesomeIcon icon={faQrcode} className="h-4 w-4" />
              ตรวจสอบ QR
            </PcTransactionActionButton>
            <PcTransactionActionButton variant="outcome" tone="primary" onClick={() => setShowAddModal(true)}>
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              จ่ายออก (FIFO)
            </PcTransactionActionButton>
          </>
        }
      />

      <PcTransactionFilterCard
        variant="outcome"
        hasActiveFilters={hasActiveFilters}
        onReset={hasActiveFilters ? clearFilters : undefined}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PcFilterField label="ค้นหา" className="sm:col-span-2 lg:col-span-1">
            <PcFilterSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="เลขที่ใบจ่าย, WO, รหัสวัตถุดิบ"
            />
          </PcFilterField>
          <PcFilterField label="วัตถุดิบ">
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">ทุกวัตถุดิบ</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.matCode}
                </option>
              ))}
            </select>
          </PcFilterField>
          <PcFilterField label="ประเภทใบจ่าย">
            <select
              value={filterIssueType}
              onChange={(e) => setFilterIssueType(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">ทุกประเภท</option>
              <option value="MANUAL">จ่ายแบบ Manual</option>
              <option value="PRODUCTION">จ่ายตาม BOM / ผลิต</option>
            </select>
          </PcFilterField>
          <PcFilterField label="วันที่เริ่ม">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={INPUT_CLS}
            />
          </PcFilterField>
          <PcFilterField label="วันที่สิ้นสุด">
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={INPUT_CLS}
            />
          </PcFilterField>
        </div>
      </PcTransactionFilterCard>

      <PcTransactionDataCard
        variant="outcome"
        title={`รายการใบจ่าย (${pagination?.total ?? outcomes.length})`}
        description="ตัดสต็อกตามลำดับ FIFO — แนบเอกสารได้เมื่อจ่ายแบบ Manual"
        toolbar={<PaginationSelector currentLimit={limit} />}
        footer={
          pagination ? (
            <PaginationFooter
              page={page}
              limit={limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              hrefBuilder={paginationHref}
              summaryLocale="th"
            />
          ) : null
        }
      >
        <div
          className={
            listFetching
              ? "pointer-events-none opacity-60 transition-opacity duration-200"
              : "transition-opacity duration-200"
          }
        >
          <OutcomeTable
            outcomes={outcomes}
            onPreviewDocuments={(files) => {
              if (files?.length) {
                setPreviewFiles(files);
                setPreviewIndex(0);
                setShowPreview(true);
              }
            }}
          />
        </div>
      </PcTransactionDataCard>

      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/70 p-3 backdrop-blur-sm animate-cci-backdrop-in sm:p-4">
          <div className="max-h-[min(92vh,880px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-cci-popup animate-cci-modal-in dark:border-gray-700 dark:bg-gray-800">
            <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" aria-hidden />
            <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-4 dark:border-orange-900/40 dark:from-orange-950/40 dark:to-amber-950/30 sm:px-6">
              <h3 className="min-w-0 text-lg font-semibold text-orange-950 dark:text-orange-100 sm:text-xl">จ่ายวัตถุดิบออก (FIFO)</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {alertMsg && (
                <div className={`mb-4 rounded-lg px-4 py-3 ${
                  alertMsg.variant === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : alertMsg.variant === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : alertMsg.variant === "warning"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                }`}>
                  <div className="font-medium">{alertMsg.title}</div>
                  {alertMsg.message && <div className="text-sm mt-1">{alertMsg.message}</div>}
                </div>
              )}
              <div className="mb-6 grid grid-cols-2 gap-0 border-b border-gray-200 dark:border-gray-700 sm:flex sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIssueMode("manual");
                    resetForm();
                  }}
                  className={`min-w-0 px-2 py-3 text-center text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                    issueMode === "manual"
                      ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  จ่ายแบบ Manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIssueMode("production");
                    resetForm();
                  }}
                  className={`min-w-0 px-2 py-3 text-center text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                    issueMode === "production"
                      ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                            <div
                              key={idx}
                              className="flex flex-col gap-1 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <span className="min-w-0 break-all">ไฟล์ {idx + 1}: {file.name}</span>
                              <span className="shrink-0 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
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
                            <div
                              key={idx}
                              className={`flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between ${
                                mat.isAvailable ? "bg-white dark:bg-gray-800" : "border-red-300 bg-red-50 dark:bg-red-900/20"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{mat.materialCode}</span>
                                  {!mat.isAvailable && (
                                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                      ไม่พอ
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{mat.materialName}</div>
                              </div>
                              <div className="shrink-0 text-left sm:text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  ต้องการ: {mat.requiredQuantity.toLocaleString()} {mat.unit}
                                </div>
                                <div className={`text-xs ${mat.isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
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

                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full rounded-lg bg-gray-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-600 sm:w-auto sm:shrink-0"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 sm:flex-1"
                  >
                    {submitLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        contextHint="โฟกัสวัตถุดิบ: กรอก QR ล็อตจากใบรับเข้า (FIFO) เพื่อดูคงเหลือและสถานะ — เส้นทางตัวอย่างหลักคือหน้านี้ (/pc/outcome) ปุ่ม «ตรวจสอบ QR»"
      />
      {confirmModal && (
        <BaseModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          title={confirmModal.title}
          size="sm"
        >
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            {confirmModal.message}
          </div>
          <div className="flex gap-3">
            <ActionButton
              variant="danger"
              onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal(null);
              }}
              className="flex-1"
            >
              ยืนยัน
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setConfirmModal(null)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </BaseModal>
      )}
      {alertModal && (
        <BaseModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal(null)}
          title={alertModal.title}
          size="sm"
        >
          <div className="text-gray-700 dark:text-gray-300">
            {alertModal.message}
          </div>
        </BaseModal>
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
