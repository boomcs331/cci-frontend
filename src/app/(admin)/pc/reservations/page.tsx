'use client';
import { useEffect, useState } from 'react';
import { PageContainer, PageHeader, ContentCard, LoadingState, DataTable, type Column } from '@/components/shared';
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
              <DataTable
                columns={[
                  { key: "planCode", title: "แผน" },
                  { key: "lotNumber", title: "QR/Lot", render: (_, d) => d.lotNumber || "-" },
                  {
                    key: "quantity",
                    title: "จำนวน",
                    align: "right",
                    render: (_, d) => `${d.quantity} ${item.unit}`,
                  },
                ] as Column<ReservationDetail>[]}
                data={item.details}
                emptyMessage="ไม่มีข้อมูล"
              />
            </div>
          ))
        )}
      </ContentCard>
    </PageContainer>
  );
}
