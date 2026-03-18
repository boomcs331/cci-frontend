'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';

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
  planTime?: string;
  status: string;
  remarks?: string;
  items: PlanItem[];
  reservations?: Reservation[];
}

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleReserve = async () => {
    if (!confirm('ต้องการจองวัตถุดิบสำหรับแผนการผลิตนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3006/production-plans/${id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'เกิดข้อผิดพลาด');
      }
      
      alert('จองวัตถุดิบสำเร็จ');
      fetchData();
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
      const res = await fetch(`http://localhost:3006/production-plans/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด');
      
      alert('ยกเลิกแผนการผลิตสำเร็จ');
      fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยกเลิกแผนการผลิต');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle="รายละเอียดแผนการผลิต" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{data.planCode} - {data.planName}</h2>
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
                    {item.materials.map((m) => {
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
                    })}
                  </tbody>
                </table>
              </div>

              {/* ตารางแสดง Lot ที่ยืนยัน */}
              {data.reservations && data.reservations.filter(r => 
                item.materials.some(m => m.materialId === r.materialId)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                    Lot ที่ยืนยัน
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-xs">
                      <thead>
                        <tr className="bg-green-100 dark:bg-green-900/40">
                          <th className="px-3 py-2 text-left text-green-900 dark:text-green-100">Material</th>
                          <th className="px-3 py-2 text-left text-green-900 dark:text-green-100">Lot Number</th>
                          <th className="px-3 py-2 text-left text-green-900 dark:text-green-100">Lot PD No.</th>
                          <th className="px-3 py-2 text-left text-green-900 dark:text-green-100">QR Code</th>
                          <th className="px-3 py-2 text-right text-green-900 dark:text-green-100">จำนวน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200 dark:divide-green-800">
                        {data.reservations
                          .filter(r => item.materials.some(m => m.materialId === r.materialId))
                          .map((r, idx) => (
                            <tr key={idx} className="hover:bg-green-100 dark:hover:bg-green-900/30">
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{r.materialCode}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{r.lotNumber || '-'}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{r.lotPdNo || '-'}</td>
                              <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{r.qrCode || '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                {r.reservedQuantity.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}

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
    </div>
  );
}
