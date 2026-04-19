"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api";
import {
  decodeProductionLotQr,
  getLotRecord,
  PRODUCTION_LOT_QR_PREFIX,
} from "@/utils/productionLotTracking";
import type { ProductLotStatusPayload } from "@/components/qr/QrCodeLookupPanel";
import { stockBalanceTh as th } from "@/components/inventory/stockBalanceTh";

export type StockBalanceMode = "material" | "product";

export type StockBalanceLookupPanelProps = {
  active: boolean;
  mode: StockBalanceMode;
  instanceId?: string;
  showUsageHint?: boolean;
};

type MaterialSummary = {
  id: number;
  matCode?: string;
  matName?: string;
};

type MaterialStockPayload = {
  materialId: number;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  material?: {
    matCode?: string;
    matName?: string;
    unitMaster?: { unitName?: string; symbol?: string };
  };
};

interface ProductStockItem {
  id: number;
  productCode: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  unit: string;
}

interface PaginatedPayload {
  data?: ProductStockItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

async function fetchJsonMaterialStock(materialId: number): Promise<MaterialStockPayload | null> {
  const res = await apiFetch(`/materials/transactions/stock/${materialId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(j.message || th.loadMatFail);
  }
  const json = (await res.json()) as { success?: boolean; data?: MaterialStockPayload };
  if (!json.success || !json.data) return null;
  return json.data;
}

/** Aggregate stock (materials_stock / FG stock). Same interaction pattern as QrCodeLookupPanel. */
export function StockBalanceLookupPanel({
  active,
  mode,
  instanceId = "default",
  showUsageHint = true,
}: StockBalanceLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [materialStock, setMaterialStock] = useState<MaterialStockPayload | null>(null);
  const [materialSource, setMaterialSource] = useState<string | null>(null);
  const [materialCandidates, setMaterialCandidates] = useState<MaterialSummary[]>([]);

  const [productRows, setProductRows] = useState<ProductStockItem[]>([]);
  const [productSearchNote, setProductSearchNote] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `stock-bal-input-${instanceId}`;

  const resetResults = useCallback(() => {
    setLookupError(null);
    setMaterialStock(null);
    setMaterialSource(null);
    setMaterialCandidates([]);
    setProductRows([]);
    setProductSearchNote(null);
  }, []);

  useEffect(() => {
    if (!active) {
      setQuery("");
      resetResults();
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [active, resetResults]);

  const applyMaterialStock = useCallback(async (materialId: number, sourceLabel: string) => {
    setMaterialCandidates([]);
    setMaterialSource(sourceLabel);
    setLoading(true);
    setLookupError(null);
    try {
      const stock = await fetchJsonMaterialStock(materialId);
      if (!stock) {
        setMaterialStock(null);
        setLookupError(th.noStockRow);
        return;
      }
      setMaterialStock(stock);
    } catch (e) {
      setMaterialStock(null);
      setLookupError(e instanceof Error ? e.message : th.loadMatFail);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  const submitMaterial = useCallback(async () => {
    const code = query.trim();
    if (!code) {
      setLookupError(th.enterMat);
      return;
    }

    if (getLotRecord(code) || decodeProductionLotQr(code) || code.startsWith(PRODUCTION_LOT_QR_PREFIX)) {
      setLookupError(th.wrongTabProdQr);
      return;
    }

    setLoading(true);
    setLookupError(null);
    setMaterialStock(null);
    setMaterialSource(null);
    setMaterialCandidates([]);

    let clearInput = false;

    try {
      const qrRes = await apiFetch(`/materials/transactions/qr/${encodeURIComponent(code)}`);
      const qrJson = (await qrRes.json()) as { success?: boolean; data?: { material?: { id?: number } } };

      if (qrRes.ok && qrJson.success && qrJson.data?.material?.id != null) {
        setLoading(false);
        await applyMaterialStock(qrJson.data.material.id, th.fromQr(code));
        clearInput = true;
        return;
      }

      const mParams = new URLSearchParams({ page: "1", limit: "20", search: code });
      const mRes = await apiFetch(`/materials?${mParams}`);
      const mJson = (await mRes.json()) as {
        success?: boolean;
        data?: MaterialSummary[];
      };

      if (!mRes.ok || !mJson.success || !Array.isArray(mJson.data)) {
        setLookupError(th.matSearchFail);
        return;
      }

      if (mJson.data.length === 0) {
        setLookupError(th.matNotFound);
        return;
      }

      if (mJson.data.length === 1) {
        setLoading(false);
        await applyMaterialStock(mJson.data[0].id, th.fromMatch(code));
        clearInput = true;
        return;
      }

      setMaterialCandidates(mJson.data);
      setLookupError(null);
    } catch {
      setLookupError(th.network);
    } finally {
      setLoading(false);
      if (clearInput) setQuery("");
      inputRef.current?.focus();
    }
  }, [applyMaterialStock, query]);

  const submitProduct = useCallback(async () => {
    const code = query.trim();
    if (!code) {
      setLookupError(th.enterProd);
      return;
    }

    setLoading(true);
    setLookupError(null);
    setProductRows([]);
    setProductSearchNote(null);

    let searchTerm = code;
    let note: string | null = null;

    try {
      const tryStatus = Boolean(
        getLotRecord(code) || decodeProductionLotQr(code) || code.startsWith(PRODUCTION_LOT_QR_PREFIX),
      );

      if (tryStatus) {
        const stRes = await apiFetch(`/production-orders/lots/${encodeURIComponent(code)}/status`);
        if (stRes.status === 403) {
          setLookupError(th.lotStatusDenied);
          return;
        }
        if (stRes.ok) {
          const st = (await stRes.json()) as ProductLotStatusPayload;
          if (st?.productCode) {
            searchTerm = st.productCode;
            note = th.fromLotNote(st.lotNo || code, st.productCode);
          }
        }
      }

      const q = new URLSearchParams({ page: "1", limit: "30", search: searchTerm });
      const res = await apiFetch(`/products/stock?${q}`);
      if (res.status === 403) {
        setLookupError(th.prodStockDenied);
        return;
      }
      const json = (await res.json()) as { success?: boolean; message?: string } & PaginatedPayload;
      if (!res.ok || !json.success || !Array.isArray(json.data)) {
        setLookupError(json.message || th.prodLoadFail);
        return;
      }

      setProductRows(json.data);
      setProductSearchNote(note);
      if (json.data.length === 0) {
        setLookupError(th.prodNotFound);
      } else {
        setQuery("");
        setLookupError(null);
      }
    } catch {
      setLookupError(th.network);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "material") void submitMaterial();
    else void submitProduct();
  };

  const handleClear = () => {
    setQuery("");
    resetResults();
    inputRef.current?.focus();
  };

  const usageLine = mode === "material" ? th.usageMat : th.usageProd;

  const placeholder = mode === "material" ? th.phMat : th.phProd;

  if (!active) return null;

  const unitLabel =
    materialStock?.material?.unitMaster?.unitName ||
    materialStock?.material?.unitMaster?.symbol ||
    "";

  return (
    <div className="space-y-4">
      {showUsageHint ? <p className="text-xs text-gray-500 dark:text-gray-400">{usageLine}</p> : null}

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {mode === "material" ? th.labelMat : th.labelProd}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (lookupError) setLookupError(null);
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border-2 border-brand-500 bg-white px-3 text-base text-gray-900 dark:border-brand-500 dark:bg-gray-900 dark:text-white sm:h-14 sm:px-4 sm:text-lg"
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:px-5 sm:py-2.5"
          >
            {loading ? th.btnSearching : th.btnSearch}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {th.btnClear}
          </button>
        </div>
      </form>

      {lookupError ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-200">
          {lookupError}
        </div>
      ) : null}

      {loading ? <div className="py-6 text-center text-sm text-gray-500">{th.loading}</div> : null}

      {mode === "material" && materialCandidates.length > 1 && !loading ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-950/25">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
            {th.multiMat}
          </p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {materialCandidates.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200/80 bg-white px-3 py-2 dark:border-amber-800/50 dark:bg-gray-900/60"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{m.matCode}</div>
                  <div className="truncate text-xs text-gray-600 dark:text-gray-400">{m.matName}</div>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void applyMaterialStock(m.id, th.picked(m.matCode ?? ""))}
                  className="shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {th.viewStock}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "material" && materialStock && !loading ? (
        <div className="space-y-4 rounded-lg border-2 border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-lg font-bold text-green-900 dark:text-green-100 sm:text-xl">{th.matAggTitle}</h2>
            {materialSource ? (
              <span className="text-xs text-green-800 dark:text-green-300 sm:max-w-[55%] sm:text-right">{materialSource}</span>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{th.thCode}</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {materialStock.material?.matCode ?? "—"}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{th.thName}</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {materialStock.material?.matName ?? "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-white/90 p-3 dark:border-green-800 dark:bg-gray-900/50">
              <div className="text-xs text-gray-600 dark:text-gray-400">{th.thTotal}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {Number(materialStock.totalQty).toLocaleString()} {unitLabel}
              </div>
            </div>
            <div className="rounded-lg border border-green-200 bg-white/90 p-3 dark:border-green-800 dark:bg-gray-900/50">
              <div className="text-xs text-gray-600 dark:text-gray-400">{th.thAvail}</div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                {Number(materialStock.availableQty).toLocaleString()} {unitLabel}
              </div>
            </div>
            <div className="rounded-lg border border-green-200 bg-white/90 p-3 dark:border-green-800 dark:bg-gray-900/50">
              <div className="text-xs text-gray-600 dark:text-gray-400">{th.thRes}</div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-200">
                {Number(materialStock.reservedQty).toLocaleString()} {unitLabel}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "product" && productSearchNote && productRows.length > 0 && !loading ? (
        <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
          {productSearchNote}
        </p>
      ) : null}

      {mode === "product" && productRows.length > 0 && !loading ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800/80">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">{th.thCode}</th>
                <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">{th.thName}</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-200">{th.prodOnHand}</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-200">{th.thRes}</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-200">{th.prodAvail}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {productRows.map((p) => (
                <tr key={p.id} className="bg-white/90 dark:bg-gray-900/40">
                  <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{p.productCode}</td>
                  <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.productName}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-white">
                    {p.currentStock.toLocaleString()} {p.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-800 dark:text-amber-200">
                    {p.reservedStock.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-green-700 dark:text-green-300">
                    {p.availableStock.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
