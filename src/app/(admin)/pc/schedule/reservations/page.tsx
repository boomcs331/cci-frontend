"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import TimePicker from "@/components/ui/TimePicker";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: "reserved" | "confirmed";
  items?: { product?: { productName: string }; quantity: number; unit: string }[];
}

const statusConfig = {
  reserved: { label: "จองแล้ว", color: "orange" },
  confirmed: { label: "ยืนยันแล้ว", color: "green" },
};

export default function ScheduleReservationsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>('');
  const [filterTimeTo, setFilterTimeTo] = useState<string>('');
  
  const dateFromPickerRef = useRef<HTMLInputElement>(null);
  const dateToPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    // Initialize flatpickr after plans are loaded
    if (!loading && dateFromPickerRef.current) {
      const fp1 = flatpickr(dateFromPickerRef.current, {
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
          setFilterDateFrom(dateStr);
        }
      });
      
      const fp2 = flatpickr(dateToPickerRef.current!, {
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
          setFilterDateTo(dateStr);
        }
      });
      
      return () => {
        fp1.destroy();
        fp2.destroy();
      };
    }
  }, [loading]);

  useEffect(() => {
    applyFilters();
  }, [plans, searchTerm, filterStatus, filterDateFrom, filterDateTo, filterTimeFrom, filterTimeTo]);

  const applyFilters = () => {
    let filtered = [...plans];
    
    if (searchTerm) {
      filtered = filtered.filter((p: ProductionPlan) => 
        p.planCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.planName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter((p: ProductionPlan) => p.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterDateFrom) {
      filtered = filtered.filter((p: ProductionPlan) => new Date(p.planDate) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter((p: ProductionPlan) => new Date(p.planDate) <= new Date(filterDateTo));
    }
    if (filterTimeFrom) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : '00:00';
        return planTime >= filterTimeFrom;
      });
    }
    if (filterTimeTo) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : '00:00';
        return planTime <= filterTimeTo;
      });
    }
    
    setFilteredPlans(filtered);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("http://localhost:3006/production-plans");
      if (res.ok) {
        const data = await res.json();
        const allPlans = Array.isArray(data) ? data : data.data || [];
        const reservedPlans = allPlans.filter((plan: ProductionPlan) => 
          plan.status === "reserved" || plan.status === "confirmed"
        );
        setPlans(reservedPlans);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const plan = plans.find(p => p.planCode === barcode.trim());
    if (!plan) {
      setMessage({ type: "error", text: "ไม่พบรหัสแผนนี้" });
      setBarcode("");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (plan.status === "confirmed") {
      setMessage({ type: "error", text: "แผนนี้ยืนยันแล้ว" });
      setBarcode("");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      // ยืนยันแผนและจ่ายออกวัตถุดิบ
      const res = await fetch(`http://localhost:3006/production-plans/${plan.id}/confirm-and-issue`, { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: `ยืนยันแผน ${plan.planCode} และจ่ายออกวัตถุดิบสำเร็จ` });
        setBarcode("");
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ message: "ไม่สามารถยืนยันแผนได้" }));
        setMessage({ type: "error", text: errorData.message || "ไม่สามารถยืนยันแผนได้" });
        setBarcode("");
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setBarcode("");
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="แผนผลิตที่จองสำเร็จแล้ว" />
        <ComponentCard title="แผนผลิตที่จองสำเร็จแล้ว">
          <div className="text-center py-8">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="แผนผลิตที่จองสำเร็จแล้ว" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">แผนผลิตที่จองสำเร็จแล้ว</h2>
          </div>
        </div>

        {message && <Alert variant={message.type} title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"} message={message.text} />}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <div className="flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="สแกนบาร์โค้ดรหัสแผนเพื่อยืนยันและจ่ายออกวัตถแดิบ"
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ยืนยันและจ่ายออก
            </button>
          </form>
        </div>

        <ComponentCard title={`แผนผลิตที่จองสำเร็จแล้ว (${filteredPlans.length})`}>
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="ค้นหา (รหัส, ชื่อแผน)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="reserved">จองแล้ว</option>
                <option value="confirmed">ยืนยันแล้ว</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterTimeFrom('');
                  setFilterTimeTo('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ล้างตัวกรอง
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">วันที่เริ่มต้น</label>
                <div className="relative">
                  <input
                    ref={dateFromPickerRef}
                    type="text"
                    readOnly
                    value={filterDateFrom}
                    placeholder="เลือกวันที่"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">วันที่สิ้นสุด</label>
                <div className="relative">
                  <input
                    ref={dateToPickerRef}
                    type="text"
                    readOnly
                    value={filterDateTo}
                    placeholder="เลือกวันที่"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">เวลาเริ่มต้น</label>
                <TimePicker
                  value={filterTimeFrom}
                  onChange={(time) => setFilterTimeFrom(time)}
                  placeholder="เลือกเวลา"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">เวลาสิ้นสุด</label>
                <TimePicker
                  value={filterTimeTo}
                  onChange={(time) => setFilterTimeTo(time)}
                  placeholder="เลือกเวลา"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => router.push("/pc/schedule/reservations/picking-slip")}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              ใบจัดสินค้า (ตามออเดอร์)
            </button>
            <button onClick={() => router.push('/pc/reservations')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ดูรายการจอง Material
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสแผน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อแผน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สินค้า</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      ไม่มีแผนผลิตที่จองสำเร็จ
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{plan.planCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{plan.planName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(plan.planDate).toLocaleDateString("th-TH", {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.planTime ? plan.planTime.substring(0, 5) : '00:00'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          plan.status === "reserved" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                          "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                        }`}>{statusConfig[plan.status].label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{plan.items?.length || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => router.push(`/pc/schedule/reservations/${plan.id}`)} className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded">
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
