"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { apiFetch } from "@/utils/api";

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

interface StockAlertsPayload {
  lowStock?: ProductStockItem[];
  criticalStock?: ProductStockItem[];
}

interface PaginatedPayload {
  data?: ProductStockItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export default function ProductionProductStockPage() {
  const [stocks, setStocks] = useState<ProductStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAlert, setShowAlert] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [lowStockItems, setLowStockItems] = useState<ProductStockItem[]>([]);
  const [criticalStockItems, setCriticalStockItems] = useState<ProductStockItem[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/products/stock/alerts");
        const json = (await res.json()) as { success?: boolean; data?: StockAlertsPayload };
        if (cancelled || !json.success || !json.data) return;
        setLowStockItems(json.data.lowStock ?? []);
        setCriticalStockItems(json.data.criticalStock ?? []);
      } catch {
        if (!cancelled) {
          setLowStockItems([]);
          setCriticalStockItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (debouncedSearch) q.set("search", debouncedSearch);
        const res = await apiFetch(`/products/stock?${q.toString()}`);
        const json = (await res.json()) as { success?: boolean } & PaginatedPayload;
        if (cancelled) return;
        if (json.success && Array.isArray(json.data) && json.pagination) {
          setStocks(json.data);
          setTotal(json.pagination.total);
          setTotalPages(Math.max(1, json.pagination.totalPages));
        } else {
          setStocks([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch {
        if (!cancelled) {
          setStocks([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  const getStockColor = (available: number, min: number) => {
    if (available <= min) {
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    }
    if (available <= min * 2) {
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
    }
    if (available <= min * 3) {
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    }
    return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="ยอดคงเหลือ สินค้าขาย" />
      <div className="space-y-6">
        {showAlert && (lowStockItems.length > 0 || criticalStockItems.length > 0) && (
          <div className="fixed top-20 right-6 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500 dark:border-red-600 p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">แจ้งเตือน Stock สินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAlert(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4">
              {lowStockItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold">🔴 Stock ไม่พอจ่าย</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                      {lowStockItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.productCode}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{item.productName}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {item.availableStock.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Min:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.minStock.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {criticalStockItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">🟠 Stock ใกล้หมด</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                      {criticalStockItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {criticalStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.productCode}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{item.productName}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {item.availableStock.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ยอดคงเหลือ สินค้าขาย และสถานะการจองขาย
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ยอดรวมเพิ่มเมื่อล็อตผลิตครบกระบวนการ (COMPLETED) — แบ่งหน้ารายการด้านล่าง
          </p>
        </div>

        <ComponentCard title="ค้นหา">
          <input
            type="text"
            placeholder="ค้นหารหัสหรือชื่อสินค้า..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </ComponentCard>

        <ComponentCard title={`รายการ Stock (${total})`}>
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสสินค้า</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อสินค้า</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Stock ทั้งหมด</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จองขายแล้ว</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือพร้อมขาย</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{stock.productCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stock.productName}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                          {stock.currentStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400 font-medium">
                          {stock.reservedStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`px-3 py-1 rounded-full font-medium ${getStockColor(stock.availableStock, stock.minStock)}`}
                          >
                            {stock.availableStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{stock.unit}</td>
                        <td className="px-4 py-3 text-center">
                          {stock.availableStock <= 0 ? (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              หมด
                            </span>
                          ) : stock.availableStock < 10 ? (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              ใกล้หมด
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              พร้อมขาย
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                  </div>
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
