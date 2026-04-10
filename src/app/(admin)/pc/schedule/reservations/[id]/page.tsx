'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import ProductionLotBatchPanel from '@/components/pc/production/ProductionLotBatchPanel';
import QRScannerModal from '@/components/qr/QRScannerModal';
import { getProductProductionSteps } from '@/services/productProductionStepsService';
import type { GenerateProductQrOrdersResponse } from '@/services/productionPlanQrService';
import { getApiUrl } from '@/utils/api';
import {
  generateProductQrOrdersAndSyncPlanItems,
  syncPlanItemsFromProductionQrGeneration,
  type PlanDetailForLots,
} from '@/utils/ensureProductionLotsAfterReserve';

interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  requiredQuantity: number;
  availableQty: number;
  unit: string;
}

interface Reservation {
  materialId: number;
  materialCode: string;
  materialName: string;
  reservedQuantity: number;
  lotNumber?: string;
  lotPdNo?: string;
  qrCode?: string;
  receiveDate?: string;
  createDate: string;
}

interface PlanItem {
  planItemId?: number;
  /** รหัสแถวแผนใน DB (ใช้เรียก generate-product-qr-orders เมื่อไม่มี planItemId) */
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
  /** จาก API หลังจ่ายวัตถุดิบเฉพาะบรรทัด — ใช้ซ่อนปุ่มยืนยันซ้ำและเปิดแผงล็อตผลิต */
  materialsIssued?: boolean;
}

interface PlanDetail {
  id?: number;
  planId?: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: string;
  remarks?: string;
  items: PlanItem[];
  reservations?: Reservation[];
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ show: boolean; materials: Material[] }>({ show: false, materials: [] });
  const [showScanner, setShowScanner] = useState(false);
  const [stepsByProductId, setStepsByProductId] = useState<Record<number, string[]>>({});
  const [stepsLoading, setStepsLoading] = useState(false);
  const [issuingItemIndex, setIssuingItemIndex] = useState<number | null>(null);
  const router = useRouter();

  const productIdsToFetch = useMemo(() => {
    if (!data?.items?.length) return [] as number[];
    if (data.status === 'confirmed') {
      return [...new Set(data.items.map((i) => i.productId))];
    }
    const issued = data.items.filter((i) => i.materialsIssued);
    if (issued.length === 0) return [];
    return [...new Set(issued.map((i) => i.productId))];
  }, [data?.items, data?.status]);

  const fetchData = () => {
    fetch(getApiUrl(`/production-plans/${id}/details`))
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error:', err));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  /** จ่ายเฉพาะบรรทัดสินค้าในแผน (index ตามลำดับใน items[]) — ส่งไปที่ API เป็น itemIndexes */
  const handleConfirmAndIssueForItem = async (itemIndex: number) => {
    setErrorAlert({ show: false, materials: [] });

    const item = data?.items?.[itemIndex];
    if (!item) return;

    const label = `${item.productName} จำนวน ${item.quantity} ${item.unit} (บรรทัด ${itemIndex + 1})`;
    if (!confirm(`ยืนยันและจ่ายออกวัตถุดิบเฉพาะรายการนี้หรือไม่?\n${label}\n(จะตัด stock เฉพาะ BOM ของบรรทัดนี้เท่านั้น)`)) {
      return;
    }

    const insufficientMaterials: Material[] = [];
    item.materials.forEach((m) => {
      if (m.availableQty < m.requiredQuantity) {
        insufficientMaterials.push(m);
      }
    });

    if (insufficientMaterials.length > 0) {
      setErrorAlert({ show: true, materials: insufficientMaterials });
      return;
    }

    setLoading(true);
    setIssuingItemIndex(itemIndex);
    try {
      const res = await fetch(getApiUrl(`/production-plans/${id}/confirm-and-issue`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndexes: [itemIndex] }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'เกิดข้อผิดพลาด');
      }

      const confirmBody = (await res.json()) as {
        productionQrGeneration?: GenerateProductQrOrdersResponse | null;
        productionQrGenerationError?: string | null;
      };

      const dRes = await fetch(getApiUrl(`/production-plans/${id}/details`));
      if (!dRes.ok) {
        throw new Error('โหลดรายละเอียดแผนหลังจ่ายไม่สำเร็จ');
      }
      const updated = (await dRes.json()) as PlanDetail;
      setData(updated);

      const pid = Number(updated.id ?? updated.planId ?? id);
      if (Number.isFinite(pid)) {
        const lotPlan: PlanDetailForLots = {
          id: updated.id,
          planId: updated.planId,
          planCode: updated.planCode,
          status: updated.status,
          items: updated.items.map((it) => ({
            planItemId: it.planItemId,
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            quantity: it.quantity,
            unit: it.unit,
          })),
        };
        try {
          if (confirmBody.productionQrGeneration) {
            await syncPlanItemsFromProductionQrGeneration(
              lotPlan,
              confirmBody.productionQrGeneration,
            );
          } else {
            await generateProductQrOrdersAndSyncPlanItems(pid, lotPlan, [itemIndex]);
          }
          if (confirmBody.productionQrGenerationError) {
            console.warn(confirmBody.productionQrGenerationError);
          }
        } catch (e) {
          console.warn('sync production QR after confirm failed', e);
        }
      }

      alert(
        'ยืนยันและจ่ายออกวัตถุดิบสำเร็จ — ระบบสร้าง QR ล็อตผลิตใน DB แล้ว (ตามจำนวนบรรจุของสินค้า) ใช้สแกนติดตามขั้นตอนได้',
      );
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการยืนยันและจ่ายออก');
    } finally {
      setLoading(false);
      setIssuingItemIndex(null);
    }
  };

  useEffect(() => {
    if (productIdsToFetch.length === 0) {
      setStepsByProductId({});
      setStepsLoading(false);
      return;
    }
    let cancelled = false;
    setStepsLoading(true);
    (async () => {
      try {
        const next: Record<number, string[]> = {};
        await Promise.all(
          productIdsToFetch.map(async (productId) => {
            try {
              const rows = await getProductProductionSteps(productId);
              if (cancelled) return;
              next[productId] = [...rows]
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((r) => r.process.processName);
            } catch {
              if (!cancelled) next[productId] = [];
            }
          })
        );
        if (!cancelled) setStepsByProductId(next);
      } finally {
        if (!cancelled) setStepsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdsToFetch]);

  if (!data) return <div className="p-6">Loading...</div>;

  const effectivePlanId = Number(data.id ?? data.planId ?? id);
  if (!Number.isFinite(effectivePlanId)) {
    return (
      <div className="p-6 text-red-600">
        ข้อมูลแผนไม่มีรหัสแผน (id/planId) — รีเฟรชหรือติดต่อผู้ดูแลระบบ
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="รายละเอียดแผนการผลิตที่จองแล้ว" />
      <div className="space-y-6">
        {errorAlert.show && errorAlert.materials.length > 0 && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500 dark:border-red-600 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">⛔</span>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">ไม่สามารถจ่ายออกได้</h3>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    วัตถแุดิบต่อไปนี้มีจำนวนไม่เพียงพอ กรุณาเติม Stock ก่อนทำรายการใหม่
                  </p>
                </div>
                
                <div className="overflow-y-auto flex-1 p-6">
                  <div className="space-y-4">
                    {errorAlert.materials.map((m, idx) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{m.materialName}</h4>
                          <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                            ขาด {(m.requiredQuantity - m.availableQty).toLocaleString()} {m.unit}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนที่ต้องการ</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{m.requiredQuantity.toLocaleString()} <span className="text-sm text-gray-500">{m.unit}</span></p>
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">คงเหลือปัจจุบัน</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">{m.availableQty.toLocaleString()} <span className="text-sm text-red-500">{m.unit}</span></p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      กรุณาเติม Stock แล้วลองทำรายการอีกครั้ง
                    </p>
                    <button
                      onClick={() => setErrorAlert({ show: false, materials: [] })}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      รับทราบ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{data.planCode} - {data.planName}</h2>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 shrink-0"
            >
              สแกน QR (วัตถุดิบ / ล็อตผลิต)
            </button>
          </div>
        </div>

        <ComponentCard title="รายละเอียดแผนการผลิต">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">วันที่และเวลา:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(data.planDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {' '}
                {data.planTime ? data.planTime.substring(0, 5) : '00:00'} น.
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">สถานะ:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                data.status === 'reserved' ? 'bg-orange-200 text-orange-800' :
                data.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {data.status === 'reserved' ? 'จองแล้ว' :
                 data.status === 'confirmed' ? 'ยืนยันแล้ว' : data.status}
              </span>
            </div>
            {data.remarks && (
              <div className="col-span-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">{data.remarks}</span>
              </div>
            )}
          </div>

          {data.reservations && data.reservations.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                รายการจองวัตถุดิบ ({data.reservations.length} รายการ)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/40">
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-900 dark:text-blue-100">รหัสวัตถุดิบ</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-900 dark:text-blue-100">ชื่อวัตถุดิบ</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-900 dark:text-blue-100">Lot Number</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-900 dark:text-blue-100">Lot PD No.</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-900 dark:text-blue-100">QR Code</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-blue-900 dark:text-blue-100">จำนวนที่จอง</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-blue-900 dark:text-blue-100">วันที่จอง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200 dark:divide-blue-800">
                    {data.reservations.map((r, idx) => (
                      <tr key={idx} className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{r.materialCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{r.materialName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{r.lotNumber || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{r.lotPdNo || '-'}</td>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">{r.qrCode || '-'}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">
                          {r.reservedQuantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-white">
                          {new Date(r.createDate).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.items.map((item, itemIndex) => (
            <div key={`${item.productId}-${itemIndex}`} className="mb-8 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  บรรทัด {itemIndex + 1}: {item.productName} — จำนวน {item.quantity} {item.unit}
                </h3>
                {item.materialsIssued && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                    จ่ายวัตถุดิบรายการนี้แล้ว
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material Code</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">ต้องการ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {item.materials.map((m) => (
                      <tr key={m.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{m.materialName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{m.materialCode}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {m.requiredQuantity} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {m.availableQty} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.availableQty >= m.requiredQuantity ? (
                            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.status === 'reserved' && !item.materialsIssued && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleConfirmAndIssueForItem(itemIndex)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading && issuingItemIndex === itemIndex
                      ? 'กำลังดำเนินการ...'
                      : 'ยืนยันและจ่ายออกเฉพาะรายการนี้'}
                  </button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    จะตัด stock เฉพาะ BOM ของบรรทัด {itemIndex + 1} เท่านั้น (สินค้าซ้ำกันในแผนเดียวกันถือเป็นคนละบรรทัด)
                  </p>
                </div>
              )}

              {(data.status === 'confirmed' || item.materialsIssued) && stepsLoading ? (
                <div className="mt-6 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200">
                  กำลังโหลดลำดับขั้นตอนผลิตของสินค้า…
                </div>
              ) : data.status === 'confirmed' || item.materialsIssued ? (
                <ProductionLotBatchPanel
                  planId={effectivePlanId}
                  planCode={data.planCode}
                  itemIndex={itemIndex}
                  planItemId={item.planItemId ?? item.id}
                  planStatus={data.status}
                  productId={item.productId}
                  productName={item.productName}
                  totalQty={item.quantity}
                  unit={item.unit}
                  processStepLabels={
                    stepsByProductId[item.productId]?.length
                      ? stepsByProductId[item.productId]
                      : undefined
                  }
                />
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  หลังยืนยันและจ่ายออกวัตถุดิบสำหรับบรรทัดนี้แล้ว ระบบจะแสดงการติดตามล็อตผลิตตามลำดับขั้นตอนของสินค้า
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => router.push('/pc/schedule/reservations')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ย้อนกลับ
            </button>
          </div>
        </ComponentCard>
      </div>

      <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </div>
  );
}
