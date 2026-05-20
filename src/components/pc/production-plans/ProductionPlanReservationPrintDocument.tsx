'use client';

import { useMemo } from 'react';
import type { PlanDetail, PlanItem, Reservation } from '@/utils/productionPlanReservationDetail';
import { reservationMaterialQr } from '@/utils/productionPlanReservationDetail';
import {
  formatMaterialIssuedByDisplay,
  resolveStoredUserLabel,
} from '@/utils/resolveStoredUserLabel';
import { getSession } from '@/utils/session';

function formatThaiDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatThaiDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabelTh(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'draft') return 'ร่าง';
  if (s === 'reserved') return 'จองแล้ว';
  if (s === 'confirmed') return 'ยืนยันแล้ว';
  if (s === 'cancelled') return 'ยกเลิก';
  return status || '—';
}

type MaterialRow = {
  line: number;
  productName: string;
  materialCode: string;
  materialName: string;
  required: string;
  unit: string;
};

export function ProductionPlanReservationPrintDocument({
  data,
}: {
  data: PlanDetail;
}) {
  const sessionUser = useMemo(() => getSession()?.user, []);
  const materialIssuedByLabel = formatMaterialIssuedByDisplay(data, sessionUser);

  const materialRows = useMemo(() => {
    const rows: MaterialRow[] = [];
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach((item: PlanItem, idx: number) => {
      const mats = Array.isArray(item.materials) ? item.materials : [];
      mats.forEach((m) => {
        rows.push({
          line: idx + 1,
          productName: item.productName,
          materialCode: m.materialCode,
          materialName: m.materialName,
          required: Number(m.requiredQuantity).toLocaleString('th-TH', {
            maximumFractionDigits: 4,
          }),
          unit: m.unit || '—',
        });
      });
    });
    return rows;
  }, [data.items]);

  const reservations = Array.isArray(data.reservations) ? data.reservations : [];
  const planTime =
    data.planTime && data.planTime.length >= 5
      ? `${data.planTime.substring(0, 5)} น.`
      : '—';

  return (
    <article className="pp-print">
      <header>
        <h1>ใบแผนการผลิต</h1>
        <p className="pp-muted">เอกสารสำหรับการพิมพ์ / บันทึกเป็น PDF (A4)</p>
      </header>

      <section aria-label="ข้อมูลทั่วไป">
        <h2>ข้อมูลทั่วไป</h2>
        <div className="pp-grid">
          <div className="pp-row">
            <span className="pp-label">เลขที่แผนผลิต</span>
            <span>{data.planCode || '—'}</span>
          </div>
          <div className="pp-row">
            <span className="pp-label">วันที่ผลิต</span>
            <span>{formatThaiDate(data.planDate)}</span>
          </div>
          <div className="pp-row">
            <span className="pp-label">เวลา (แผน)</span>
            <span>{planTime}</span>
          </div>
          <div className="pp-row">
            <span className="pp-label">สถานะ</span>
            <span>{statusLabelTh(data.status)}</span>
          </div>
          <div className="pp-row">
            <span className="pp-label">ชื่อแผนผลิต</span>
            <span>{data.planName || '—'}</span>
          </div>
          <div className="pp-row">
            <span className="pp-label">ผู้สร้างรายการ</span>
            <span>{resolveStoredUserLabel(data.createBy, sessionUser)}</span>
          </div>
          <div className="pp-row" style={{ gridColumn: '1 / -1' }}>
            <span className="pp-label">วันที่สร้าง</span>
            <span>{formatThaiDateTime(data.createDate)}</span>
          </div>
          {materialIssuedByLabel != null && (
            <div className="pp-row" style={{ gridColumn: '1 / -1' }}>
              <span className="pp-label">จ่ายออกวัตถุดิบโดย</span>
              <span>{materialIssuedByLabel}</span>
            </div>
          )}
          {data.remarks ? (
            <div className="pp-row" style={{ gridColumn: '1 / -1' }}>
              <span className="pp-label">หมายเหตุ</span>
              <span>{data.remarks}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section aria-label="รายการผลิต">
        <h2>รายการผลิต (สินค้า)</h2>
        <table className="pp-table">
          <thead>
            <tr>
              <th className="pp-center">ลำดับ</th>
              <th>รหัสสินค้า</th>
              <th>ชื่อสินค้า</th>
              <th className="pp-num">จำนวนผลิต</th>
              <th className="pp-center">หน่วย</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(data.items) ? data.items : []).map((item, i) => (
              <tr key={`${item.productId}-${i}`}>
                <td className="pp-center">{i + 1}</td>
                <td>{item.productCode?.trim() ? item.productCode : '—'}</td>
                <td>{item.productName}</td>
                <td className="pp-num">
                  {Number(item.quantity).toLocaleString('th-TH', {
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="pp-center">{item.unit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-label="รายการวัตถุดิบ">
        <h2>รายการวัตถุดิบ (ตามบรรทัดแผน)</h2>
        <table className="pp-table">
          <thead>
            <tr>
              <th className="pp-center">บรรทัด</th>
              <th>สินค้า (บรรทัด)</th>
              <th>รหัสวัตถุดิบ</th>
              <th>ชื่อวัตถุดิบ</th>
              <th className="pp-num">จำนวน</th>
              <th className="pp-center">หน่วย</th>
            </tr>
          </thead>
          <tbody>
            {materialRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="pp-center">
                  ไม่มีรายการวัตถุดิบ
                </td>
              </tr>
            ) : (
              materialRows.map((r, idx) => (
                <tr key={`${r.line}-${r.materialCode}-${idx}`}>
                  <td className="pp-center">{r.line}</td>
                  <td>{r.productName}</td>
                  <td>{r.materialCode}</td>
                  <td>{r.materialName}</td>
                  <td className="pp-num">{r.required}</td>
                  <td className="pp-center">{r.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section aria-label="Lot การผลิต">
        <h2>Lot การผลิต (วัตถุดิบที่จ่าย / จอง)</h2>
        <table className="pp-table">
          <thead>
            <tr>
              <th>รหัสวัตถุดิบ</th>
              <th>ชื่อวัตถุดิบ</th>
              <th>Lot Number</th>
              <th>Lot PD No.</th>
              <th className="pp-num">จำนวน</th>
              <th>QR (ข้อความ)</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="pp-center">
                  ไม่มีข้อมูล Lot
                </td>
              </tr>
            ) : (
              reservations.map((r: Reservation, idx: number) => {
                const qr = reservationMaterialQr(r);
                return (
                  <tr key={`${r.materialId}-${idx}-${r.lotNumber ?? ''}`}>
                    <td>{r.materialCode}</td>
                    <td>{r.materialName}</td>
                    <td>{r.lotNumber || '—'}</td>
                    <td>{r.lotPdNo || '—'}</td>
                    <td className="pp-num">
                      {Number(r.reservedQuantity).toLocaleString('th-TH', {
                        maximumFractionDigits: 4,
                      })}
                    </td>
                    <td className="mono">{qr || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <footer className="pp-sign" aria-label="ลายเซ็น">
        <div className="pp-sign-block">
          <div className="pp-label">ผู้จัดทำ</div>
          <div style={{ marginTop: 28 }}>ลงชื่อ __________________</div>
          <div>วันที่ __________</div>
        </div>
        <div className="pp-sign-block">
          <div className="pp-label">ผู้อนุมัติ</div>
          <div style={{ marginTop: 28 }}>ลงชื่อ __________________</div>
          <div>วันที่ __________</div>
        </div>
        <div className="pp-sign-block">
          <div className="pp-label">ผู้รับทราบ</div>
          <div style={{ marginTop: 28 }}>ลงชื่อ __________________</div>
          <div>วันที่ __________</div>
        </div>
      </footer>
    </article>
  );
}
