'use client';
import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import TableEmptyRow from '@/components/common/TableEmptyRow';
import QRCodeGenerator from '@/components/common/QRCodeGenerator';
import QRScannerModal from '@/components/qr/QRScannerModal';

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
  qr_code?: string;
  receiveDate?: string;
  createDate: string;
}

interface PlanItem {
  /** เท่ากับ planItemId — production_plan_items.id */
  id?: number;
  planItemId?: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
}

interface PlanDetail {
  /** API เคยส่งแค่ planId — ใช้ร่วมกับ id จาก backend รุ่นใหม่ */
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

/** สีแยกตามวัตถุดิบในกล่อง Lot ที่ยืนยัน (หมุนเวียนตามลำดับ) */
const MATERIAL_LOT_PALETTE = [
  {
    card: 'border-emerald-300/90 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/35',
    header: 'border-emerald-200 bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-900/45',
    headerMuted: 'text-emerald-900 dark:text-emerald-100',
    thead: 'bg-emerald-50/90 dark:bg-emerald-900/30',
    th: 'text-emerald-900 dark:text-emerald-100',
    tbodyDivide: 'divide-emerald-100 dark:divide-emerald-900/45',
    rowHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/25',
  },
  {
    card: 'border-sky-300/90 bg-sky-50/40 dark:border-sky-700 dark:bg-sky-950/35',
    header: 'border-sky-200 bg-sky-100/80 dark:border-sky-800 dark:bg-sky-900/45',
    headerMuted: 'text-sky-900 dark:text-sky-100',
    thead: 'bg-sky-50/90 dark:bg-sky-900/30',
    th: 'text-sky-900 dark:text-sky-100',
    tbodyDivide: 'divide-sky-100 dark:divide-sky-900/45',
    rowHover: 'hover:bg-sky-50 dark:hover:bg-sky-900/25',
  },
  {
    card: 'border-amber-300/90 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/35',
    header: 'border-amber-200 bg-amber-100/80 dark:border-amber-800 dark:bg-amber-900/45',
    headerMuted: 'text-amber-900 dark:text-amber-100',
    thead: 'bg-amber-50/90 dark:bg-amber-900/30',
    th: 'text-amber-900 dark:text-amber-100',
    tbodyDivide: 'divide-amber-100 dark:divide-amber-900/45',
    rowHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/25',
  },
  {
    card: 'border-violet-300/90 bg-violet-50/40 dark:border-violet-700 dark:bg-violet-950/35',
    header: 'border-violet-200 bg-violet-100/80 dark:border-violet-800 dark:bg-violet-900/45',
    headerMuted: 'text-violet-900 dark:text-violet-100',
    thead: 'bg-violet-50/90 dark:bg-violet-900/30',
    th: 'text-violet-900 dark:text-violet-100',
    tbodyDivide: 'divide-violet-100 dark:divide-violet-900/45',
    rowHover: 'hover:bg-violet-50 dark:hover:bg-violet-900/25',
  },
  {
    card: 'border-rose-300/90 bg-rose-50/40 dark:border-rose-700 dark:bg-rose-950/35',
    header: 'border-rose-200 bg-rose-100/80 dark:border-rose-800 dark:bg-rose-900/45',
    headerMuted: 'text-rose-900 dark:text-rose-100',
    thead: 'bg-rose-50/90 dark:bg-rose-900/30',
    th: 'text-rose-900 dark:text-rose-100',
    tbodyDivide: 'divide-rose-100 dark:divide-rose-900/45',
    rowHover: 'hover:bg-rose-50 dark:hover:bg-rose-900/25',
  },
  {
    card: 'border-cyan-300/90 bg-cyan-50/40 dark:border-cyan-700 dark:bg-cyan-950/35',
    header: 'border-cyan-200 bg-cyan-100/80 dark:border-cyan-800 dark:bg-cyan-900/45',
    headerMuted: 'text-cyan-900 dark:text-cyan-100',
    thead: 'bg-cyan-50/90 dark:bg-cyan-900/30',
    th: 'text-cyan-900 dark:text-cyan-100',
    tbodyDivide: 'divide-cyan-100 dark:divide-cyan-900/45',
    rowHover: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/25',
  },
  {
    card: 'border-orange-300/90 bg-orange-50/40 dark:border-orange-700 dark:bg-orange-950/35',
    header: 'border-orange-200 bg-orange-100/80 dark:border-orange-800 dark:bg-orange-900/45',
    headerMuted: 'text-orange-900 dark:text-orange-100',
    thead: 'bg-orange-50/90 dark:bg-orange-900/30',
    th: 'text-orange-900 dark:text-orange-100',
    tbodyDivide: 'divide-orange-100 dark:divide-orange-900/45',
    rowHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/25',
  },
  {
    card: 'border-indigo-300/90 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-950/35',
    header: 'border-indigo-200 bg-indigo-100/80 dark:border-indigo-800 dark:bg-indigo-900/45',
    headerMuted: 'text-indigo-900 dark:text-indigo-100',
    thead: 'bg-indigo-50/90 dark:bg-indigo-900/30',
    th: 'text-indigo-900 dark:text-indigo-100',
    tbodyDivide: 'divide-indigo-100 dark:divide-indigo-900/45',
    rowHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/25',
  },
] as const;

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async (): Promise<PlanDetail | null> => {
    try {
      const res = await apiFetch(`/production-plans/${id}/details`);
      const json = (await res.json()) as PlanDetail;
      setData(json);
      return json;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleReserve = async () => {
    if (!confirm('ต้องการจองวัตถุดิบสำหรับแผนการผลิตนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`/production-plans/${id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'เกิดข้อผิดพลาด');
      }

      await fetchData();
      alert(
        'จองวัตถุดิบสำเร็จ — QR ล็อตผลิตจะถูกสร้างหลังยืนยันและจ่ายออกวัตถุดิบ (ตัดสต็อค) แล้ว',
      );
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการจองวัตถุดิบ');
    } finally {
      setLoading(false);
    }
  };



  const handleCancel = async () => {
    if (!confirm('ต้องการยกเลิกแผนการผลิตนี้หรือไม่? (จะคืนวัตถุดิบที่จองไว้)')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`/production-plans/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด');
      
      await fetchData();
      alert('ยกเลิกแผนการผลิตสำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยกเลิกแผนการผลิต');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  const effectivePlanId = Number(data.id ?? data.planId ?? id);
  if (!Number.isFinite(effectivePlanId)) {
    return <div className="p-6 text-red-600">ข้อมูลแผนไม่มีรหัสแผน (id/planId) — รีเฟรชหรือติดต่อผู้ดูแลระบบ</div>;
  }

  const planItems = Array.isArray(data.items) ? data.items : [];

  const reservationQr = (r: Reservation) =>
    (r.qrCode ?? r.qr_code ?? '').trim();

  return (
    <div>
      <PageBreadcrumb pageTitle="รายละเอียดแผนการผลิต" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{data.planCode} - {data.planName}</h2>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 shrink-0"
            >
              ตรวจสอบ QR (กรอก/วางค่า)
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
                data.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                data.status === 'reserved' ? 'bg-blue-200 text-blue-800' :
                data.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                {data.status === 'draft' ? 'ร่าง' :
                 data.status === 'reserved' ? 'จองแล้ว' :
                 data.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิก'}
              </span>
            </div>
            {data.remarks && (
              <div className="col-span-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">{data.remarks}</span>
              </div>
            )}
          </div>

          {planItems.map((item, itemIndex) => {
            const materials = Array.isArray(item.materials) ? item.materials : [];
            return (
            <div key={`${item.productId}-${itemIndex}`} className="mb-8 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {item.productName} - จำนวน {item.quantity} {item.unit}
              </h3>
              
              {/* ตารางแสดง Material ที่ต้องการ */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material Name</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">ต้องการ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {materials.length === 0 ? (
                      <TableEmptyRow colSpan={5} />
                    ) : (
                      materials.map((m) => {
                        const ratio = m.requiredQuantity > 0 ? m.availableQty / m.requiredQuantity : 0;
                        const bgColor = ratio <= 1 ? 'bg-red-50 dark:bg-red-900/20' :
                                        ratio <= 2 ? 'bg-orange-50 dark:bg-orange-900/20' :
                                        ratio <= 3 ? 'bg-green-50 dark:bg-green-900/20' :
                                        'bg-blue-50 dark:bg-blue-900/20';
                        return (
                          <tr key={m.materialId} className={`hover:opacity-80 ${bgColor}`}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{m.materialCode}</td> 
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{m.materialName}</td>
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Lot ที่ยืนยัน — แยกตามวัตถุดิบ */}
              {(() => {
                const reservations = data.reservations ?? [];
                const byMaterial = materials
                  .map((m) => {
                    const rows = reservations.filter(
                      (r) => Number(r.materialId) === Number(m.materialId),
                    );
                    return { material: m, rows };
                  })
                  .filter((x) => x.rows.length > 0);

                if (byMaterial.length === 0) return null;

                return (
                  <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-gray-900/40">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Lot ที่ยืนยัน
                    </h4>
                    {byMaterial.map(({ material: m, rows }) => {
                      const bomIdx = materials.findIndex(
                        (mm) => Number(mm.materialId) === Number(m.materialId),
                      );
                      const pal =
                        MATERIAL_LOT_PALETTE[
                          (bomIdx >= 0 ? bomIdx : 0) %
                            MATERIAL_LOT_PALETTE.length
                        ];
                      return (
                      <div
                        key={m.materialId}
                        className={`overflow-hidden rounded-lg border bg-white/90 dark:bg-gray-950/50 ${pal.card}`}
                      >
                        <div className={`border-b px-3 py-2 ${pal.header}`}>
                          <div className={`text-xs font-medium ${pal.headerMuted}`}>
                            วัตถุดิบ
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {m.materialCode}{' '}
                            <span className="font-normal text-gray-600 dark:text-gray-300">
                              — {m.materialName}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto text-xs">
                            <thead>
                              <tr className={pal.thead}>
                                <th className={`px-3 py-2 text-left ${pal.th}`}>
                                  Lot Number
                                </th>
                                <th className={`px-3 py-2 text-left ${pal.th}`}>
                                  Lot PD No.
                                </th>
                                <th className={`px-3 py-2 text-center ${pal.th}`}>
                                  QR Code
                                </th>
                                <th className={`px-3 py-2 text-right ${pal.th}`}>
                                  จำนวน
                                </th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${pal.tbodyDivide}`}>
                              {rows.map((r, idx) => {
                                const qr = reservationQr(r);
                                return (
                                  <tr
                                    key={`${m.materialId}-${idx}-${r.lotNumber ?? ''}`}
                                    className={pal.rowHover}
                                  >
                                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                                      {r.lotNumber || '-'}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                                      {r.lotPdNo || '-'}
                                    </td>
                                    <td className="px-3 py-2 align-middle">
                                      {qr ? (
                                        <div className="flex flex-col items-center gap-1 py-1">
                                          <QRCodeGenerator
                                            value={qr}
                                            size={56}
                                            className="mx-auto block rounded border border-gray-200 bg-white p-0.5 dark:border-gray-600"
                                          />
                                          <span className="max-w-[140px] truncate font-mono text-[10px] text-gray-600 dark:text-gray-400">
                                            {qr}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                      {r.reservedQuantity.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
            );
          })}

          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
              {data.status === 'draft' && (
                <button
                  onClick={handleReserve}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'กำลังดำเนินการ...' : 'จองวัตถุดิบ'}
                </button>
              )}

              {(data.status === 'draft' || data.status === 'reserved') && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยกเลิกแผน'}
                </button>
              )}
            </div>
            <button
              onClick={() => router.back()}
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
