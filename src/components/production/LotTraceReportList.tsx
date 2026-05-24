"use client";

import { useEffect, useState } from "react";
import type { LotStepQuantitiesPayload } from "@/types/productionLotStepQuantities";
import type { LotTraceProductGroup } from "@/utils/lotTraceReportFormat";
import {
  fgLotStatusLabelTh,
  formatLotTraceDateTime,
  lotStatusLabelTh,
} from "@/utils/lotTraceReportFormat";
import LotTraceLotCard from "./LotTraceLotCard";

export function lotTraceLotKey(
  productId: number,
  lot: LotStepQuantitiesPayload,
): string {
  return `${productId}:${lot.lotId ?? lot.lotNo ?? lot.qrCode}`;
}

function lotMatchesSearch(lot: LotStepQuantitiesPayload, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  return (
    lot.lotNo.toLowerCase().includes(needle) ||
    lot.qrCode.toLowerCase().includes(needle)
  );
}

type LotTraceReportListProps = {
  productGroups: LotTraceProductGroup[];
  variant: "production" | "fg";
  /** เปิดกลุ่ม/ล็อตที่ตรงกับคำค้น (เช่น จาก ?lot=) */
  autoExpandLotSearch?: string;
};

export default function LotTraceReportList({
  productGroups,
  variant,
  autoExpandLotSearch,
}: LotTraceReportListProps) {
  const isFg = variant === "fg";
  const statusLabel = (status: string) =>
    isFg ? fgLotStatusLabelTh(status) : lotStatusLabelTh(status);

  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedLots, setExpandedLots] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const q = autoExpandLotSearch?.trim();
    if (!q || productGroups.length === 0) return;

    const nextProducts = new Set<number>();
    const nextLots = new Set<string>();

    for (const pg of productGroups) {
      const match = pg.lots.find((lot) => lotMatchesSearch(lot, q));
      if (match) {
        nextProducts.add(pg.productId);
        nextLots.add(lotTraceLotKey(pg.productId, match));
      }
    }

    if (nextProducts.size > 0) {
      setExpandedProducts(nextProducts);
      setExpandedLots(nextLots);
    }
  }, [autoExpandLotSearch, productGroups]);

  const toggleProduct = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleLot = (key: string) => {
    setExpandedLots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] table-auto text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
            <th className="w-10 px-2 py-3" aria-label="ขยาย" />
            <th className="px-3 py-3 text-left font-medium">รหัสสินค้า</th>
            <th className="px-3 py-3 text-left font-medium">ชื่อสินค้า</th>
            <th className="px-3 py-3 text-right font-medium">จำนวนล็อต</th>
            <th className="px-3 py-3 text-right font-medium">รวมจำนวน</th>
            <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {productGroups.map((pg) => {
            const productOpen = expandedProducts.has(pg.productId);
            return (
              <ProductRows
                key={pg.productId}
                pg={pg}
                productOpen={productOpen}
                expandedLots={expandedLots}
                isFg={isFg}
                statusLabel={statusLabel}
                onToggleProduct={() => toggleProduct(pg.productId)}
                onToggleLot={toggleLot}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProductRows({
  pg,
  productOpen,
  expandedLots,
  isFg,
  statusLabel,
  onToggleProduct,
  onToggleLot,
}: {
  pg: LotTraceProductGroup;
  productOpen: boolean;
  expandedLots: Set<string>;
  isFg: boolean;
  statusLabel: (status: string) => string;
  onToggleProduct: () => void;
  onToggleLot: (key: string) => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/60"
        onClick={onToggleProduct}
      >
        <td className="px-2 py-3 text-center text-gray-500">
          <ChevronIcon open={productOpen} />
        </td>
        <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">
          {pg.productCode}
        </td>
        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
          {pg.productName}
        </td>
        <td className="px-3 py-3 text-right tabular-nums">
          {pg.lotCount.toLocaleString()}
        </td>
        <td className="px-3 py-3 text-right tabular-nums font-medium">
          {pg.totalLotQuantity.toLocaleString()} {pg.unit}
        </td>
        <td className="px-3 py-3 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleProduct();
            }}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {productOpen ? "ซ่อนล็อต" : `ดูล็อต (${pg.lotCount})`}
          </button>
        </td>
      </tr>

      {productOpen ? (
        <tr className="bg-gray-50/80 dark:bg-gray-800/40">
          <td colSpan={6} className="px-3 py-4 sm:px-6">
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
              <table className="w-full min-w-[640px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/80 dark:border-gray-600 dark:bg-gray-800">
                    <th className="w-8 px-2 py-2" aria-label="ขยายล็อต" />
                    <th className="px-2 py-2 text-left font-medium">เลขล็อต</th>
                    <th className="px-2 py-2 text-left font-medium">ใบสั่งผลิต</th>
                    <th className="px-2 py-2 text-left font-medium">QR</th>
                    <th className="px-2 py-2 text-right font-medium">จำนวน</th>
                    {isFg ? (
                      <th className="px-2 py-2 text-right font-medium">คงเหลือ</th>
                    ) : null}
                    <th className="px-2 py-2 text-left font-medium">สถานะ</th>
                    <th className="px-2 py-2 text-center font-medium">Lot Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pg.lots.map((lot) => {
                    const lotKey = lotTraceLotKey(pg.productId, lot);
                    const lotOpen = expandedLots.has(lotKey);
                    const colSpan = isFg ? 8 : 7;
                    return (
                      <LotRows
                        key={lotKey}
                        lot={lot}
                        lotKey={lotKey}
                        lotOpen={lotOpen}
                        colSpan={colSpan}
                        isFg={isFg}
                        unit={pg.unit}
                        statusLabel={statusLabel}
                        onToggleLot={() => onToggleLot(lotKey)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function LotRows({
  lot,
  lotKey,
  lotOpen,
  colSpan,
  isFg,
  unit,
  statusLabel,
  onToggleLot,
}: {
  lot: LotStepQuantitiesPayload;
  lotKey: string;
  lotOpen: boolean;
  colSpan: number;
  isFg: boolean;
  unit: string;
  statusLabel: (status: string) => string;
  onToggleLot: () => void;
}) {
  const variant = isFg ? "fg" : "production";

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={onToggleLot}
      >
        <td className="px-2 py-2 text-center text-gray-500">
          <ChevronIcon open={lotOpen} />
        </td>
        <td className="px-2 py-2 font-medium">{lot.lotNo}</td>
        <td className="px-2 py-2">{lot.orderNo || "—"}</td>
        <td className="max-w-[140px] truncate px-2 py-2 font-mono text-[11px] sm:text-xs" title={lot.qrCode}>
          {lot.qrCode}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {lot.lotQuantity.toLocaleString()} {unit}
        </td>
        {isFg ? (
          <td className="px-2 py-2 text-right tabular-nums">
            {(lot.remainingQuantity ?? lot.lotQuantity).toLocaleString()}
          </td>
        ) : null}
        <td className="px-2 py-2">{statusLabel(lot.lotStatus)}</td>
        <td className="px-2 py-2 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLot();
            }}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 sm:text-sm"
          >
            {lotOpen ? "ซ่อน" : "ดู Lot Trace"}
          </button>
        </td>
      </tr>
      {lotOpen ? (
        <tr>
          <td colSpan={colSpan} className="px-2 py-3 sm:px-4">
            {lot.lotCreatedAt ? (
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                สร้างเมื่อ {formatLotTraceDateTime(lot.lotCreatedAt)}
              </p>
            ) : null}
            <LotTraceLotCard group={lot} variant={variant} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`mx-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
