'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ProductionPlanReservationPrintDocument } from '@/components/pc/production-plans/ProductionPlanReservationPrintDocument';
import '@/components/pc/production-plans/production-plan-reservation-print.css';
import { apiFetch } from '@/utils/api';
import {
  normalizePlanDetail,
  type PlanDetail,
} from '@/utils/productionPlanReservationDetail';

export default function ReservationPlanPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/production-plans/${id}/details`);
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          raw && typeof raw === 'object' && 'message' in raw
            ? String((raw as { message?: string }).message)
            : `โหลดข้อมูลไม่สำเร็จ (${res.status})`;
        setError(msg);
        setData(null);
        return;
      }
      const normalized = normalizePlanDetail(raw);
      if (!normalized) {
        setError('รูปแบบข้อมูลแผนไม่ถูกต้อง');
        setData(null);
        return;
      }
      if (normalized.status.toLowerCase() !== 'confirmed') {
        setError('พิมพ์ได้เฉพาะแผนที่สถานะ «ยืนยันแล้ว» เท่านั้น');
        setData(null);
        return;
      }
      setData(normalized);
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 print:bg-white">
      <div className="no-print mx-auto max-w-[210mm] px-4 py-4 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-1 bg-orange-500" />
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">พิมพ์แผนการผลิต</h1>
              <p className="text-sm text-gray-600">
                แผน #{id} — ใช้ปุ่มพิมพ์หรือบันทึกเป็น PDF จากเบราว์เซอร์
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
              >
                <FontAwesomeIcon icon={faPrint} className="h-4 w-4" />
                พิมพ์ / PDF
              </button>
              <Link
                href={`/pc/schedule/reservations/${id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                กลับรายละเอียด
              </Link>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            กำลังโหลดข้อมูลแผน…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {error}
            <div className="mt-3">
              <Link
                href={`/pc/schedule/reservations/${id}`}
                className="font-medium text-red-900 underline"
              >
                กลับหน้ารายละเอียด
              </Link>
            </div>
          </div>
        )}
      </div>

      {data && !loading && (
        <div className="mx-auto max-w-[210mm] px-4">
          <div className="print-root rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
            <ProductionPlanReservationPrintDocument data={data} />
          </div>
        </div>
      )}
    </div>
  );
}
