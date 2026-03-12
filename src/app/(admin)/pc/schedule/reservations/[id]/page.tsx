'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';

interface Material {
  materialId: number;
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
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
}

interface PlanDetail {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
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
  const router = useRouter();

  const fetchData = () => {
    fetch(`http://localhost:3006/production-plans/${id}/details`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error:', err));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleConfirmAndIssue = async () => {
    // ล้าง error alert เก่าก่อนทำรายการใหม่
    setErrorAlert({ show: false, materials: [] });
    
    if (!confirm('ต้องการยืนยันและจ่ายออกวัตถุดิบหรือไม่? (จะตัด stock จริง)')) return;
    
    // ตรวจสอบ stock ก่อนจ่าย
    const insufficientMaterials: Material[] = [];
    data?.items.forEach(item => {
      item.materials.forEach(m => {
        if (m.availableQty < m.requiredQuantity) {
          insufficientMaterials.push(m);
        }
      });
    });

    if (insufficientMaterials.length > 0) {
      setErrorAlert({ show: true, materials: insufficientMaterials });
      // ไม่ทำอะไรต่อ ให้ popup แสดงค้างไว้ตลอด
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3006/production-plans/${id}/confirm-and-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'เกิดข้อผิดพลาด');
      }
      
      alert('ยืนยันและจ่ายออกวัตถุดิบสำเร็จ');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการยืนยันและจ่ายออก');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{data.planCode} - {data.planName}</h2>
          </div>
        </div>

        <ComponentCard title="รายละเอียดแผนการผลิต">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">วันที่:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(data.planDate).toLocaleDateString('th-TH')}
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

          {data.items.map((item) => (
            <div key={item.productId} className="mb-8 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {item.productName} - จำนวน {item.quantity} {item.unit}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">ต้องการ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {item.materials.map((m) => (
                      <tr key={m.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
              {data.status === 'reserved' && (
                <button
                  onClick={handleConfirmAndIssue}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยันและจ่ายออก'}
                </button>
              )}
            </div>
            <button
              onClick={() => router.push('/pc/schedule/reservations')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ย้อนกลับ
            </button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
