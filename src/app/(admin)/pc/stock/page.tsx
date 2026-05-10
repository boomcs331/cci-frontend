"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";

interface StockItem {
  id: number;
  matCode: string;
  matName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  unit: string;
}

interface LotItem {
  id: number;
  lotNo: string;
  lotPdNo?: string | null;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  status: string;
  unit?: string | null;
  createDate?: string;
  receiving?: {
    id: number;
    receivingNo?: string;
    receivingDate?: string;
    poNo?: string | null;
    supplier?: {
      code?: string;
      name?: string;
    };
  };
}

interface QrTxnItem {
  id: number;
  transactionNo?: string;
  transactionType?: string;
  transactionDate?: string;
  quantity?: number;
  remainingQuantity?: number;
  referenceNo?: string;
  remark?: string;
  createBy?: string;
}

export default function PCStockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [lotItems, setLotItems] = useState<LotItem[]>([]);
  const [lotLoading, setLotLoading] = useState(false);
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [qrTransactions, setQrTransactions] = useState<QrTxnItem[]>([]);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    if (selectedStock) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedStock]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/materials/stock');
      const data = await res.json();
      if (data.success) {
        setStocks(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openLotDetails = async (stock: StockItem) => {
    setSelectedStock(stock);
    setSelectedQr(null);
    setQrTransactions([]);
    setLotLoading(true);
    try {
      const res = await apiFetch(
        `/materials/transactions/lots?page=1&limit=200&materialId=${stock.id}`,
      );
      const data = await res.json();
      if (data.success) {
        const rows = ((data.data || []) as LotItem[]).filter(
          (lot) => Number(lot.remainingQuantity || 0) > 0,
        );
        setLotItems(rows);
      } else {
        setLotItems([]);
      }
    } catch (err) {
      console.error(err);
      setLotItems([]);
    } finally {
      setLotLoading(false);
    }
  };

  const openQrTransactions = async (qrCode: string) => {
    setSelectedQr(qrCode);
    setQrLoading(true);
    try {
      const res = await apiFetch(
        `/materials/transactions/qr/${encodeURIComponent(qrCode)}/transactions`,
      );
      const data = await res.json();
      if (data.success) {
        setQrTransactions((data.data || []) as QrTxnItem[]);
      } else {
        setQrTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setQrTransactions([]);
    } finally {
      setQrLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.matCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = stocks.filter(s => s.availableStock <= s.minStock);
  const criticalStockItems = stocks.filter(s => s.availableStock > s.minStock && s.availableStock <= s.minStock * 2);
  const totalRemainingInLots = lotItems.reduce(
    (sum, lot) => sum + Number(lot.remainingQuantity || 0),
    0,
  );

  const getStockColor = (available: number, min: number) => {
    if (available <= min) {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
    if (available <= min * 2) {
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    }
    if (available <= min * 3) {
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="ยอดคงเหลือ วัตถุดิบ" />
      <div className="space-y-6">
        {selectedStock && (
          <>
            <div
              className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in z-[99999]"
              onClick={() => setSelectedStock(null)}
            />
            <div className="fixed inset-0 z-[99999] p-4 flex items-center justify-center">
              <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-cci-popup animate-cci-modal-in flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      รายละเอียด Lot รับเข้า - {selectedStock.matCode}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStock.matName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStock(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                  >
                    ปิด
                  </button>
                </div>

                <div className="p-5 overflow-auto space-y-4">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>
                        QR ที่ยังมีชิ้นงาน:{" "}
                        <strong>{lotItems.length.toLocaleString()}</strong>
                      </span>
                      <span>
                        คงเหลือรวมจาก lot:{" "}
                        <strong>
                          {totalRemainingInLots.toLocaleString()}{" "}
                          {selectedStock.unit}
                        </strong>
                      </span>
                      <span>
                        คงเหลือพร้อมใช้ (stock):{" "}
                        <strong>
                          {selectedStock.availableStock.toLocaleString()}{" "}
                          {selectedStock.unit}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {lotLoading ? (
                    <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล lot...</div>
                  ) : lotItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      ไม่พบ lot/QR ที่ยังมีคงเหลือสำหรับวัตถุดิบนี้
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left text-xs font-medium">Receiving</th>
                            <th className="px-3 py-2 text-left text-xs font-medium">Lot</th>
                            <th className="px-3 py-2 text-right text-xs font-medium">รับเข้า</th>
                            <th className="px-3 py-2 text-right text-xs font-medium">คงเหลือ</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">สถานะ</th>
                            <th className="px-3 py-2 text-left text-xs font-medium">QR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {lotItems.map((lot) => (
                            <tr key={lot.id}>
                              <td className="px-3 py-2 text-sm">
                                <div className="font-medium">{lot.receiving?.receivingNo || "-"}</div>
                                <div className="text-xs text-gray-500">
                                  {lot.receiving?.receivingDate
                                    ? new Date(lot.receiving.receivingDate).toLocaleDateString("th-TH")
                                    : "-"}
                                  {lot.receiving?.supplier?.name
                                    ? ` | ${lot.receiving.supplier.name}`
                                    : ""}
                                </div>
                                <div className="text-xs text-gray-500">{lot.receiving?.poNo || "-"}</div>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <div className="font-medium">{lot.lotNo}</div>
                                <div className="text-xs text-gray-500">{lot.lotPdNo || "-"}</div>
                              </td>
                              <td className="px-3 py-2 text-sm text-right">
                                {Number(lot.quantity || 0).toLocaleString()} {lot.unit || selectedStock.unit}
                              </td>
                              <td className="px-3 py-2 text-sm text-right">
                                {Number(lot.remainingQuantity || 0).toLocaleString()} {lot.unit || selectedStock.unit}
                              </td>
                              <td className="px-3 py-2 text-sm text-center">
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                                  {lot.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <button
                                  type="button"
                                  onClick={() => void openQrTransactions(lot.qrCode)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                                >
                                  {lot.qrCode}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedQr && (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 p-4">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        รายการเคลื่อนไหวของ QR: <span className="font-mono">{selectedQr}</span>
                      </h4>
                      {qrLoading ? (
                        <div className="text-sm text-gray-500">กำลังโหลดรายการเคลื่อนไหว...</div>
                      ) : qrTransactions.length === 0 ? (
                        <div className="text-sm text-gray-500">ไม่พบรายการเคลื่อนไหวของ QR นี้</div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-800">
                          <table className="w-full table-auto">
                            <thead>
                              <tr className="bg-blue-100/70 dark:bg-blue-900/40">
                                <th className="px-3 py-2 text-left text-xs font-medium">วันที่</th>
                                <th className="px-3 py-2 text-left text-xs font-medium">ประเภท</th>
                                <th className="px-3 py-2 text-right text-xs font-medium">จำนวน</th>
                                <th className="px-3 py-2 text-right text-xs font-medium">คงเหลือ</th>
                                <th className="px-3 py-2 text-left text-xs font-medium">อ้างอิง</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-100 dark:divide-blue-900/40">
                              {qrTransactions.map((tx) => (
                                <tr key={tx.id}>
                                  <td className="px-3 py-2 text-sm">
                                    {tx.transactionDate
                                      ? new Date(tx.transactionDate).toLocaleString("th-TH")
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2 text-sm">{tx.transactionType || "-"}</td>
                                  <td className="px-3 py-2 text-sm text-right">
                                    {Number(tx.quantity || 0).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right">
                                    {Number(tx.remainingQuantity || 0).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm">{tx.referenceNo || tx.remark || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedStock && showAlert && (lowStockItems.length > 0 || criticalStockItems.length > 0) && (
          <div className="fixed top-20 right-6 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in border-2 border-red-500 dark:border-red-600 p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">แจ้งเตือน Stock</h3>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
                    {lowStockItems.map(item => (
                      <div key={item.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.matCode}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{item.matName}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{item.availableStock.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Min:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.minStock.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-red-200 dark:border-red-800">
                          <span className="text-gray-600 dark:text-gray-400">ขาด:</span>
                          <span className="font-bold text-red-700 dark:text-red-300">{(item.minStock - item.availableStock).toLocaleString()}</span>
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
                    {criticalStockItems.map(item => (
                      <div key={item.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.matCode}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{item.matName}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">{item.availableStock.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Min:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.minStock.toLocaleString()}</span>
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ยอดคงเหลือ วัตถุดิบ และสถานะการจอง</h2>
        </div>

        <ComponentCard title="ค้นหา">
          <input
            type="text"
            placeholder="ค้นหารหัสหรือชื่อวัตถุดิบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </ComponentCard>

        <ComponentCard title={`รายการ Stock (${filteredStocks.length})`}>
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อวัตถุดิบ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">Stock ทั้งหมด</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จองแล้ว</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือพร้อมใช้</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{stock.matCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stock.matName}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                        {stock.currentStock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400 font-medium">
                        {stock.reservedStock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`px-3 py-1 rounded-full font-medium ${getStockColor(stock.availableStock, stock.minStock)}`}>
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
                            พร้อมใช้
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => void openLotDetails(stock)}
                          className="px-3 py-1 text-xs rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 hover:opacity-90"
                        >
                          ดู lot / QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
