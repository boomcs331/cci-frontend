"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { createPaginationHrefBuilder } from "@/lib/pagination";
import ReceivingTable from "@/components/pc/income/ReceivingTable";
import AddReceivingModal from "@/components/pc/income/AddReceivingModal";
import ReceivingDetailModal from "@/components/pc/income/ReceivingDetailModal";
import QRCodeModal from "@/components/pc/income/QRCodeModal";
import PrintAllQRModal from "@/components/pc/income/PrintAllQRModal";
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
import { getSession } from "@/utils/session";
import { apiFetch } from "@/utils/api";
import {
  pcErrorFromApiBody,
  pcConnectionError,
  pcSuccess,
  getPoNoErrorMessage,
  PcErrorCode,
  PC_ERROR_FALLBACK_MESSAGES,
} from "@/lib/pc";
import { useToast } from "@/context/ToastContext";
import { BaseModal } from "@/components/shared";

export default function PCIncomePage() {
  const { show: showToast } = useToast();
  const [alertModal, setAlertModal] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const [receivings, setReceivings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listFetching, setListFetching] = useState(false);
  const hasLoadedOnceRef = useRef(false);
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
  const [poNo, setPoNo] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [mfgDate, setMfgDate] = useState<string>("");
  const [locationId, setLocationId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("admin");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMaterial, setFilterMaterial] = useState<string>("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  const hasActiveFilters = Boolean(
    searchTerm || filterMaterial || filterSupplier || filterDateFrom || filterDateTo,
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMaterial("");
    setFilterSupplier("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const handleMaterialChange = async (matId: number) => {
    setMaterialId(matId);
    const selectedMaterial = materials.find((m) => m.id === matId);
    if (selectedMaterial) {
      if (selectedMaterial.supplierId) {
        const res = await apiFetch(`/masters/suppliers/${selectedMaterial.supplierId}`);
        const data = await res.json();
        if (data.success) setSupplierId(data.data.id);
      }
      if (selectedMaterial.defaultLocationId) {
        const res = await apiFetch(
          `/masters/materials-locations/${selectedMaterial.defaultLocationId}`,
        );
        const data = await res.json();
        if (data.success) setLocationId(data.data.id);
      }
    }
  };

  const listQueryUrl = useMemo(() => {
    let url = `/materials/transactions/receivings?page=${page}&limit=${limit}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (filterMaterial) url += `&materialId=${filterMaterial}`;
    if (filterSupplier) url += `&supplierId=${filterSupplier}`;
    if (filterDateFrom) url += `&dateFrom=${filterDateFrom}`;
    if (filterDateTo) url += `&dateTo=${filterDateTo}`;
    return url;
  }, [page, limit, debouncedSearch, filterMaterial, filterSupplier, filterDateFrom, filterDateTo]);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session.user?.username || "admin");
    }

    let cancelled = false;
    (async () => {
      try {
        const [matsRes, locsRes, suppsRes] = await Promise.all([
          apiFetch("/materials/all"),
          apiFetch("/masters/materials-locations/all"),
          apiFetch("/masters/suppliers/all"),
        ]);
        if (cancelled) return;
        const matsData = await matsRes.json();
        const locsData = await locsRes.json();
        const suppsData = await suppsRes.json();
        setMaterials(matsData.data || []);
        setLocations(locsData.data || []);
        setSuppliers(suppsData.data || []);
      } catch (err) {
        console.error(err);
      }
    })();

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
        const rcvRes = await apiFetch(listQueryUrl);
        if (cancelled) return;
        const rcvData = await rcvRes.json();
        if (rcvData.success) {
          setReceivings(rcvData.data || []);
          setPagination(rcvData.pagination);
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
  }, [listQueryUrl]);

  useEffect(() => {
    if (showDetailModal || showAddModal || showQRModal || showPrintAllModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetailModal, showAddModal, showQRModal, showPrintAllModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!materialId) {
      showToast({
        variant: "error",
        title: PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_MATERIAL_REQUIRED],
      });
      return;
    }

    if (!quantity || quantity <= 0) {
      showToast({
        variant: "error",
        title: PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_QUANTITY_INVALID],
      });
      return;
    }

    const poErrorMessage = getPoNoErrorMessage(poNo);
    if (poErrorMessage) {
      showToast({ variant: "error", title: poErrorMessage });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: Record<string, unknown> = {
        materialId,
        totalQuantity: quantity,
        locationId,
        createBy: currentUser,
      };

      if (supplierId && supplierId > 0) payload.supplierId = supplierId;
      payload.poNo = poNo.trim();
      if (remark && remark.trim()) payload.remark = remark.trim();
      if (mfgDate) payload.mfgDate = mfgDate;

      const response = await apiFetch("/materials/transactions/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const success = pcSuccess(
          "รับวัตถุดิบสำเร็จ",
          `เลขที่ใบรับ: ${result.data.receivingNo}`,
        );
        showToast(success);
        setAlertModal({
          variant: success.variant,
          title: success.title,
          message: success.message,
        });
        setShowAddModal(false);
        resetForm();
        await refreshReceivings();
      } else {
        const errorData = await response.json();
        const errAlert = pcErrorFromApiBody(errorData);
        showToast(errAlert);
        setAlertModal({ variant: "error", title: errAlert.title, message: errAlert.message });
      }
    } catch {
      const errAlert = pcConnectionError();
      showToast(errAlert);
      setAlertModal({ variant: "error", title: errAlert.title, message: errAlert.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialId(null);
    setSupplierId(0);
    setPoNo("");
    setRemark("");
    setMfgDate("");
    setLocationId(1);
    setQuantity(0);
  };

  const refreshReceivings = async () => {
    setListFetching(true);
    try {
      const rcvRes = await apiFetch(listQueryUrl);
      const rcvData = await rcvRes.json();
      if (rcvData.success) {
        setReceivings(rcvData.data || []);
        setPagination(rcvData.pagination);
      }
    } finally {
      setListFetching(false);
    }
  };

  if (initialLoading) {
    return <PcTransactionLoading pageTitle="รายการรับเข้า" variant="income" />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-3 pb-8 sm:px-4 lg:px-6">
      <PcTransactionPageHeader
        variant="income"
        pageTitle="รายการรับเข้า"
        description="บันทึกการรับวัตถุดิบเข้าคลัง สร้างล็อตและ QR ตาม FIFO — ค้นหาและกรองใบรับได้จากด้านล่าง"
        icon={<FontAwesomeIcon icon={faArrowRightToBracket} />}
        stats={[
          {
            label: "ใบรับทั้งหมด",
            value: (pagination?.total ?? 0).toLocaleString(),
          },
          {
            label: "หน้านี้",
            value: receivings.length,
          },
        ]}
        actions={
          <PcTransactionActionButton
            variant="income"
            tone="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            รับเข้า
          </PcTransactionActionButton>
        }
      />

      <PcTransactionFilterCard
        variant="income"
        hasActiveFilters={hasActiveFilters}
        onReset={hasActiveFilters ? clearFilters : undefined}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PcFilterField label="ค้นหา" className="sm:col-span-2 lg:col-span-1">
            <PcFilterSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="เลขที่ใบรับ, PO, รหัสวัตถุดิบ"
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
          <PcFilterField label="ซัพพลายเออร์">
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">ทุกซัพพลายเออร์</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
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
        variant="income"
        title={`รายการใบรับ (${pagination?.total ?? receivings.length})`}
        description="คลิกไอคอนตาเพื่อดูล็อตและ QR — พิมพ์ QR ทั้งใบได้จากไอคอนเครื่องพิมพ์"
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
            <ReceivingTable
              receivings={receivings}
              onViewDetail={(rcv) => {
                setSelectedReceiving(rcv);
                setShowDetailModal(true);
              }}
              onPrintAll={(rcv) => {
                setSelectedReceiving(rcv);
                setShowPrintAllModal(true);
              }}
            />
          </div>
      </PcTransactionDataCard>

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
        onViewQR={(lot) => {
          setSelectedLot(lot);
          setShowQRModal(true);
        }}
        getStatusBadge={(status) => {
          const map: Record<string, string> = {
            ACTIVE:
              "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
            USED_UP: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
            PARTIAL_USED:
              "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
          };
          return map[status] || "bg-gray-100 text-gray-800";
        }}
      />

      <QRCodeModal show={showQRModal} onClose={() => setShowQRModal(false)} lot={selectedLot} />

      <PrintAllQRModal
        show={showPrintAllModal}
        onClose={() => setShowPrintAllModal(false)}
        receiving={selectedReceiving}
      />

      <BaseModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title ?? ""}
        size="sm"
      >
        <div className="text-gray-700 dark:text-gray-300">
          {alertModal?.message}
        </div>
      </BaseModal>
    </div>
  );
}
