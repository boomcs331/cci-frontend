'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
      <div className="no-print mx-auto max-w-3xl px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
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
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              พิมพ์ / PDF
            </button>
            <Link
              href={`/pc/schedule/reservations/${id}`}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              กลับรายละเอียด
            </Link>
          </div>
        </div>

        {loading && (
          <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
            กำลังโหลดข้อมูลแผน…
          </p>
        )}
        {error && !loading && (
          <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
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
        <div className="print-root mx-auto max-w-[210mm] bg-white px-3 py-2 print:max-w-none print:p-0 print:shadow-none">
          <ProductionPlanReservationPrintDocument data={data} />
        </div>
      )}
    </div>
  );
}
