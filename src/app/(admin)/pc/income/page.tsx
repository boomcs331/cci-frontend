"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import ReceivingTable from "@/components/pc/income/ReceivingTable";
import AddReceivingModal from "@/components/pc/income/AddReceivingModal";
import ReceivingDetailModal from "@/components/pc/income/ReceivingDetailModal";
import QRCodeModal from "@/components/pc/income/QRCodeModal";
import PrintAllQRModal from "@/components/pc/income/PrintAllQRModal";
import Pagination from "@/components/pc/income/Pagination";
import { getSession } from "@/utils/session";
import { getApiUrl } from "@/utils/api";

export default function PCIncomePage() {
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
  const [locationId, setLocationId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('admin');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const handleMaterialChange = (matId: number) => {
    setMaterialId(matId);
    const selectedMaterial = materials.find(m => m.id === matId);
    if (selectedMaterial) {
      if (selectedMaterial.supplierId) setSupplierId(selectedMaterial.supplierId);
      if (selectedMaterial.defaultLocationId) setLocationId(selectedMaterial.defaultLocationId);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rcvRes, matsRes, locsRes, suppsRes] = await Promise.all([
          fetch(getApiUrl(`/materials/transactions/receivings?page=${page}&limit=${limit}`)),
          fetch(getApiUrl('/materials/all')),
          fetch(getApiUrl('/materials/locations/all')),
          fetch(getApiUrl('/materials/suppliers/all'))
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
  }, [page, limit]);

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
      alert('กรุณาเลือกวัตถุดิบ');
      return;
    }

    if (quantity === 0) {
      alert('กรุณาระบุจำนวนวัตถุดิบ');
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

      const response = await fetch(getApiUrl('/materials/transactions/receive'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`รับวัตถุดิบสำเร็จ! เลขที่ใบรับ: ${result.data.receivingNo}`);
        setShowAddModal(false);
        resetForm();
        await refreshReceivings();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialId(null);
    setSupplierId(0);
    setPoNo('');
    setRemark('');
    setLocationId(1);
    setQuantity(0);
  };

  const refreshReceivings = async () => {
    const rcvRes = await fetch(getApiUrl(`/materials/transactions/receivings?page=${page}&limit=${limit}`));
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
      <div>
        <PageBreadcrumb pageTitle="รายการรับเข้า" />
        <ComponentCard title="รายการรับเข้าวัตถุดิบ">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายการรับเข้า" />
      <div className="space-y-6">
        <ComponentCard title={`รายการรับเข้าวัตถุดิบ (${pagination?.total || 0})`}>
          <div className="flex justify-between items-center mb-4">
            <PaginationSelector currentLimit={limit} />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <Pagination pagination={pagination} currentPage={page} limit={limit} />
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
    </div>
  );
}
