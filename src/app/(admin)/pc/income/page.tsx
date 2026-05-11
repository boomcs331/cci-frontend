"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import ReceivingTable from "@/components/pc/income/ReceivingTable";
import AddReceivingModal from "@/components/pc/income/AddReceivingModal";
import ReceivingDetailModal from "@/components/pc/income/ReceivingDetailModal";
import QRCodeModal from "@/components/pc/income/QRCodeModal";
import PrintAllQRModal from "@/components/pc/income/PrintAllQRModal";
import { getSession } from "@/utils/session";
import { apiFetch } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import AlertModal from "@/components/common/AlertModal";

export default function PCIncomePage() {
  const { show: showToast } = useToast();
  const [alertModal, setAlertModal] = useState<{ variant: 'success' | 'error'; title: string; message?: string } | null>(null);
  const searchParams = useSearchParams();
  const [receivings, setReceivings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReceiving, setSelectedReceiving] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [poNo, setPoNo] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>('');
  const [locationId, setLocationId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMaterial, setFilterMaterial] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  const handleMaterialChange = async (matId: number) => {
    setMaterialId(matId);
    const selectedMaterial = materials.find(m => m.id === matId);
    if (selectedMaterial) {
      if (selectedMaterial.supplierId) {
        const res = await apiFetch(`/masters/suppliers/${selectedMaterial.supplierId}`);
        const data = await res.json();
        if (data.success) setSupplierId(data.data.id);
      }
      if (selectedMaterial.defaultLocationId) {
        const res = await apiFetch(`/masters/materials-locations/${selectedMaterial.defaultLocationId}`);
        const data = await res.json();
        if (data.success) setLocationId(data.data.id);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `/materials/transactions/receivings?page=${page}&limit=${limit}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
        if (filterMaterial) url += `&materialId=${filterMaterial}`;
        if (filterSupplier) url += `&supplierId=${filterSupplier}`;
        if (filterDateFrom) url += `&dateFrom=${filterDateFrom}`;
        if (filterDateTo) url += `&dateTo=${filterDateTo}`;

        const [rcvRes, matsRes, locsRes, suppsRes] = await Promise.all([
          apiFetch(url),
          apiFetch('/materials/all'),
          apiFetch('/masters/materials-locations/all'),
          apiFetch('/masters/suppliers/all')
        ]);
        const rcvData = await rcvRes.json();
        const matsData = await matsRes.json();
        const locsData = await locsRes.json();
        const suppsData = await suppsRes.json();
        if (rcvData.success) {
          setReceivings(rcvData.data || []);
          setPagination(rcvData.pagination);
        }
        setMaterials(matsData.data || []);
        setLocations(locsData.data || []);
        setSuppliers(suppsData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const session = getSession();
    if (session) {
      setCurrentUser(session.user?.username || 'admin');
    }
  }, [page, limit, searchTerm, filterMaterial, filterSupplier, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (showDetailModal || showAddModal || showQRModal || showPrintAllModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showAddModal, showQRModal, showPrintAllModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!materialId) {
      showToast({ variant: 'error', title: 'กรุณาเลือกวัตถุดิบ' });
      return;
    }

    if (quantity === 0) {
      showToast({ variant: 'error', title: 'กรุณาระบุจำนวนวัตถุดิบ' });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: any = {
        materialId,
        totalQuantity: quantity,
        locationId,
        createBy: currentUser
      };

      if (supplierId && supplierId > 0) payload.supplierId = supplierId;
      if (poNo && poNo.trim()) payload.poNo = poNo.trim();
      if (remark && remark.trim()) payload.remark = remark.trim();
      if (mfgDate) payload.mfgDate = mfgDate;

      const response = await apiFetch('/materials/transactions/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        showToast({ variant: 'success', title: 'รับวัตถุดิบสำเร็จ', message: `เลขที่ใบรับ: ${result.data.receivingNo}` });
        setAlertModal({ variant: 'success', title: 'รับวัตถุดิบสำเร็จ', message: `เลขที่ใบรับ: ${result.data.receivingNo}` });
        setShowAddModal(false);
        resetForm();
        await refreshReceivings();
      } else {
        const errorData = await response.json();
        showToast({ variant: 'error', title: 'เกิดข้อผิดพลาด', message: errorData.message || 'กรุณาลองใหม่' });
        setAlertModal({ variant: 'error', title: 'เกิดข้อผิดพลาด', message: errorData.message || 'กรุณาลองใหม่' });
      }
    } catch (err) {
      showToast({ variant: 'error', title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
      setAlertModal({ variant: 'error', title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialId(null);
    setSupplierId(0);
    setPoNo('');
    setRemark('');
    setMfgDate('');
    setLocationId(1);
    setQuantity(0);
  };

  const refreshReceivings = async () => {
    const rcvRes = await apiFetch(`/materials/transactions/receivings?page=${page}&limit=${limit}`);
    const rcvData = await rcvRes.json();
    if (rcvData.success) {
      setReceivings(rcvData.data || []);
      setPagination(rcvData.pagination);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      USED_UP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      PARTIAL_USED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
        <PageBreadcrumb pageTitle="รายการรับเข้า" />
        <ComponentCard title="รายการรับเข้าวัตถุดิบ">
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
      <PageBreadcrumb pageTitle="รายการรับเข้า" />
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-xl border border-gray-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/90 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">รายการรับเข้าวัตถุดิบ</h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            กรองตามวัตถุดิบ ซัพพลายเออร์ และช่วงวันที่ — บันทึกรับเข้าใหม่จากปุ่มด้านล่าง
          </p>
        </div>

        <ComponentCard title={`รายการรับเข้าวัตถุดิบ (${pagination?.total || 0})`}>
          <div className="mb-4 space-y-3 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/30 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                placeholder="ค้นหา (เลขที่ใบรับ, PO)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">ทุกวัตถุดิบ</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matCode}
                  </option>
                ))}
              </select>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:col-span-2 lg:col-span-1"
              >
                <option value="">ทุกซัพพลายเออร์</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">วันที่เริ่ม</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <PaginationSelector currentLimit={limit} />
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              รับเข้า
            </button>
          </div>

          <ReceivingTable
            receivings={receivings}
            onViewDetail={(rcv) => { setSelectedReceiving(rcv); setShowDetailModal(true); }}
            onPrintAll={(rcv) => { setSelectedReceiving(rcv); setShowPrintAllModal(true); }}
            getStatusBadge={getStatusBadge}
          />

          {pagination && (
            <PaginationFooter
              page={page}
              limit={limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              hrefBuilder={paginationHref}
            />
          )}
        </ComponentCard>
      </div>

      <AddReceivingModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
        materials={materials}
        suppliers={suppliers}
        locations={locations}
        materialId={materialId}
        setMaterialId={setMaterialId}
        quantity={quantity}
        setQuantity={setQuantity}
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        locationId={locationId}
        setLocationId={setLocationId}
        poNo={poNo}
        setPoNo={setPoNo}
        remark={remark}
        setRemark={setRemark}
        submitLoading={submitLoading}
        onMaterialChange={handleMaterialChange}
        mfgDate={mfgDate}
        setMfgDate={setMfgDate}
      />

      <ReceivingDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        receiving={selectedReceiving}
        onViewQR={(lot) => { setSelectedLot(lot); setShowQRModal(true); }}
        getStatusBadge={getStatusBadge}
      />

      <QRCodeModal
        show={showQRModal}
        onClose={() => setShowQRModal(false)}
        lot={selectedLot}
      />

      <PrintAllQRModal
        show={showPrintAllModal}
        onClose={() => setShowPrintAllModal(false)}
        receiving={selectedReceiving}
      />

      <AlertModal
        show={!!alertModal}
        variant={alertModal?.variant}
        title={alertModal?.title ?? ''}
        message={alertModal?.message}
        onClose={() => setAlertModal(null)}
      />
    </div>
  );
}
