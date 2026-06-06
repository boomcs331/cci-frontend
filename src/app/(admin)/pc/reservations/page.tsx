'use client';
import { useEffect, useState } from 'react';
import { PageContainer, PageHeader, ContentCard, LoadingState } from '@/components/shared';
import { apiFetch } from '@/utils/api';

interface ReservationDetail {
  planCode: string;
  lotNumber?: string;
  quantity: number;
}

interface MaterialReservation {
  materialId: number;
  materialName: string;
  unit: string;
  totalReserved: number;
  details: ReservationDetail[];
}

export default function ReservationsPage() {
  const [data, setData] = useState<MaterialReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await apiFetch('/production-plans/materials/reservations');
        const payload = (await response.json()) as
          | MaterialReservation[]
          | { reservations?: MaterialReservation[]; data?: MaterialReservation[] };

        const normalized = Array.isArray(payload)
          ? payload
          : payload.reservations ?? payload.data ?? [];
        setData(normalized);
      } catch (err) {
        console.error('Error:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchReservations();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="รายการจอง Material"
        description={`ทั้งหมด ${data.length} รายการ`}
      />

      <ContentCard>
        {loading ? (
          <LoadingState message="กำลังโหลด..." />
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            ไม่มีรายการจอง Material
          </div>
        ) : (
          data.map((item) => (
            <div key={item.materialId} className="mb-8 border-b pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {item.materialName} - จอง {item.totalReserved} {item.unit}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">แผน</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">QR/Lot</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {item.details.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      item.details.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{d.planCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{d.lotNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {d.quantity} {item.unit}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </ContentCard>
    </PageContainer>
  );
}
