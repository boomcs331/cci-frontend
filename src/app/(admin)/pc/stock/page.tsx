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
  unit: string;
}

export default function PCStockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div>
      <PageBreadcrumb pageTitle="Stock คงเหลือ" />
      <div className="space-y-6">
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
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {stock.availableStock.toLocaleString()}
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
