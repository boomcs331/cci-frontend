"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { getApiUrl } from "@/utils/api";

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

export default function PCStockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/materials/stock'));
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

  const filteredStocks = stocks.filter(s => 
    s.matCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = stocks.filter(s => s.availableStock <= s.minStock);
  const criticalStockItems = stocks.filter(s => s.availableStock > s.minStock && s.availableStock <= s.minStock * 2);

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
      <PageBreadcrumb pageTitle="Stock คงเหลือ" />
      <div className="space-y-6">
        {showAlert && (lowStockItems.length > 0 || criticalStockItems.length > 0) && (
          <div className="fixed top-20 right-6 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500 dark:border-red-600 p-5 max-h-[80vh] overflow-hidden flex flex-col">
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stock คงเหลือและสถานะการจอง</h2>
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
