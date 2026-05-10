"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import Alert from "@/components/ui/alert/Alert";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import TimePicker from "@/components/ui/TimePicker";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { apiFetch } from "@/utils/api";
import { exportPdf, exportXlsx, type ExportColumn } from "@/utils/export";
import {
  ensureThaiPdfFontsLoaded,
  registerThaiFontOnDoc,
  THAI_PDF_FONT,
} from "@/utils/jspdf-thai-font";
import { createPaginationHrefBuilder } from "@/lib/pagination";

interface Product {
  id: number;
  productCode: string;
  productName: string;
  bom?: BOMItem[];
}

interface BOMItem {
  materialId: number;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
}

interface Material {
  id: number;
  matCode: string;
  matName: string;
}

interface InsufficientMaterial {
  materialCode: string;
  materialName: string;
  required: number;
  available: number;
  unit: string;
}

interface Reservation {
  id: number;
  planId: number;
  materialId: number;
  reservedQuantity: string;
  lotNumber: string | null;
  receiveDate: string | null;
  material: Material;
}

interface PlanItem {
  id?: number;
  productId: number;
  quantity: number;
  unit: string;
  remarks?: string;
  product?: Product;
  bom?: BOMItem[];
}

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: "draft" | "reserved" | "confirmed" | "cancelled";
  remarks?: string;
  createDate: string;
  items?: PlanItem[];
  reservations?: Reservation[];
}

const statusConfig = {
  draft: { label: "ร่าง", color: "light", en: "Draft" },
  reserved: { label: "จองแล้ว", color: "warning", en: "Reserved" },
  confirmed: { label: "ยืนยันแล้ว", color: "success", en: "Confirmed" },
  cancelled: { label: "ยกเลิก", color: "error", en: "Cancelled" },
};

export default function PCSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [form, setForm] = useState({ planName: "", planDate: "", planTime: "", remarks: "", items: [] as PlanItem[] });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [insufficientMaterials, setInsufficientMaterials] = useState<InsufficientMaterial[]>([]);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [productSearches, setProductSearches] = useState<{[key: number]: string}>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<{[key: number]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>('');
  const [filterTimeTo, setFilterTimeTo] = useState<string>('');
  const datePickerRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<any>(null);
  const dateFromPickerRef = useRef<HTMLInputElement>(null);
  const dateToPickerRef = useRef<HTMLInputElement>(null);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const paginationHref = useMemo(
    () => createPaginationHrefBuilder(searchParams, limit),
    [searchParams.toString(), limit],
  );

  const fetchPlans = useCallback(async () => {
    try {
      const res = await apiFetch("/production-plans");
      if (res.ok) {
        const data = await res.json();
        let allPlans = [];
        if (Array.isArray(data)) {
          allPlans = data;
        } else if (data.data && Array.isArray(data.data)) {
          allPlans = data.data;
        }

        let filtered = allPlans;
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

        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPlans = filtered.slice(startIndex, endIndex);

        setPlans(paginatedPlans);
        setPagination({
          total,
          totalPages,
          currentPage: page,
          limit,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setPlans([]);
    }
  }, [page, limit, searchTerm, filterStatus, filterDateFrom, filterDateTo, filterTimeFrom, filterTimeTo]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiFetch("/products/all");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.all([fetchPlans(), fetchProducts()]);
      if (cancelled) return;
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchPlans, fetchProducts]);

  const planExportColumns = useMemo<ExportColumn<ProductionPlan>[]>(
    () => [
      { header: "รหัสแผน", accessor: (p) => p.planCode },
      { header: "ชื่อแผน", accessor: (p) => p.planName },
      {
        header: "วันที่",
        accessor: (p) => (p.planDate ? new Date(p.planDate).toLocaleDateString("th-TH") : ""),
      },
      { header: "เวลา", accessor: (p) => p.planTime ? p.planTime.substring(0, 5) : "" },
      { header: "สถานะ", accessor: (p) => p.status },
      {
        header: "จำนวนรายการ",
        accessor: (p) => (p.items ? p.items.length : 0),
      },
    ],
    [],
  );

  const handleExportPlansXlsx = () => {
    exportXlsx({
      filename: `production-plans_${new Date().toISOString().slice(0, 10)}`,
      columns: planExportColumns,
      rows: plans,
    });
  };

  const handleExportPlansPdf = () => {
    void exportPdf({
      filename: `production-plans_${new Date().toISOString().slice(0, 10)}`,
      columns: planExportColumns,
      rows: plans,
    }).catch((e) => console.error(e));
  };

  useEffect(() => {
    const fp1 = flatpickr(dateFromPickerRef.current!, {
      dateFormat: "Y-m-d",
      onChange: (_selectedDates, dateStr) => {
        setFilterDateFrom(dateStr);
      },
    });

    const fp2 = flatpickr(dateToPickerRef.current!, {
      dateFormat: "Y-m-d",
      onChange: (_selectedDates, dateStr) => {
        setFilterDateTo(dateStr);
      },
    });

    return () => {
      fp1.destroy();
      fp2.destroy();
    };
  }, []);

  useEffect(() => {
    if (showModal && datePickerRef.current && !flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(datePickerRef.current, {
        dateFormat: "Y-m-d",
        onChange: (_selectedDates, dateStr) => {
          setForm((prev) => ({ ...prev, planDate: dateStr }));
        },
        defaultDate: form.planDate || new Date(),
        clickOpens: true,
        allowInput: false,
      });
    }

    if (!showModal && flatpickrInstance.current) {
      flatpickrInstance.current.destroy();
      flatpickrInstance.current = null;
    }
  }, [showModal, form.planDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.planName || !form.planDate || form.items.length === 0) {
      setMessage({ type: "error", text: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }
    const invalidItem = form.items.find(item => item.productId === 0 || item.quantity <= 0);
    if (invalidItem) {
      setMessage({ type: "error", text: "กรุณาเลือกสินค้าและระบุจำนวนที่ถูกต้อง" });
      return;
    }
    try {
      console.log('Form data before submit:', form);
      // รวมวันที่และเวลาเข้าด้วยกัน
      const planDateTime = form.planTime && form.planTime.trim() !== '' 
        ? `${form.planDate}T${form.planTime}:00` 
        : `${form.planDate}T00:00:00`;
      
      console.log('Plan DateTime:', planDateTime);
      
      const submitData = {
        planName: form.planName,
        planDate: planDateTime,
        remarks: form.remarks,
        items: form.items
      };
      
      console.log('Submit data:', submitData);
      
      const path = editingPlan ? `/production-plans/${editingPlan.id}` : "/production-plans";
      const res = await apiFetch(path, {
        method: editingPlan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        setMessage({ type: "success", text: editingPlan ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ" });
        setShowModal(false);
        setForm({ planName: "", planDate: "", planTime: "", remarks: "", items: [] });
        setEditingPlan(null);
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.message || "เกิดข้อผิดพลาด" });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    }
  };

  const handleReserve = async (id: number) => {
    try {
      const res = await apiFetch(`/production-plans/${id}/reserve`, { method: "POST" });
      const data = await res.json();
      
      // ตรวจสอบ success จาก response body ไม่ใช่ res.ok
      if (res.ok && data.success !== false) {
        setMessage({
          type: "success",
          text: "จอง Material สำเร็จ — QR ล็อตผลิตจะสร้างหลังยืนยันและจ่ายออกวัตถุดิบแล้ว",
        });
        fetchPlans();
        setTimeout(() => setMessage(null), 3000);
      } else {
        // ตรวจสอบว่ามี insufficientMaterials array จาก API
        if (data.insufficientMaterials && Array.isArray(data.insufficientMaterials) && data.insufficientMaterials.length > 0) {
          // ใช้ข้อมูลจาก API โดยตรง
          const materials: InsufficientMaterial[] = data.insufficientMaterials.map((item: any) => ({
            materialCode: item.materialCode,
            materialName: item.materialName,
            required: parseFloat(item.required),
            available: parseFloat(item.available),
            unit: item.unit || 'หน่วย'
          }));
          
          setInsufficientMaterials(materials);
          setShowInsufficientModal(true);
        } else {
          // ถ้าไม่มี insufficientMaterials แสดง error message ธรรมดา
          setMessage({ type: "error", text: data.message || "ไม่สามารถจอง Material ได้" });
          setTimeout(() => setMessage(null), 5000);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setTimeout(() => setMessage(null), 5000);
    }
  };



  const handleEdit = (plan: ProductionPlan) => {
    setEditingPlan(plan);
    // แยกวันที่และเวลาออกจากกัน
    const dateStr = plan.planDate.split('T')[0];
    const timeStr = plan.planTime ? plan.planTime.substring(0, 5) : '00:00'; // HH:mm
    
    setForm({ 
      planName: plan.planName, 
      planDate: dateStr,
      planTime: timeStr,
      remarks: plan.remarks || "", 
      items: plan.items || [] 
    });
    setShowModal(true);
  };

  const handleViewDetail = async (plan: ProductionPlan) => {
    try {
      const res = await apiFetch(`/production-plans/${plan.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPlan(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleExportPDF = async (plan: ProductionPlan) => {
    try {
      const res = await apiFetch(`/production-plans/${plan.id}`);
      if (!res.ok) return;
      const data = await res.json();
      
      const pdf = new jsPDF();
      await ensureThaiPdfFontsLoaded();
      registerThaiFontOnDoc(pdf);
      const qrDataUrl = await QRCode.toDataURL(data.planCode, { width: 150, margin: 1 });
      
      pdf.setFont(THAI_PDF_FONT, "bold");
      pdf.setFontSize(18);
      pdf.text("Production Plan", 105, 20, { align: "center" });
      
      pdf.addImage(qrDataUrl, "PNG", 80, 30, 50, 50);
      
      pdf.setFontSize(14);
      pdf.text(data.planCode, 105, 90, { align: "center" });
      
      pdf.setFontSize(11);
      pdf.setFont(THAI_PDF_FONT, "normal");
      pdf.text(`Plan Name: ${data.planName}`, 20, 105);
      pdf.text(`Date: ${new Date(data.planDate).toLocaleDateString('en-GB')}`, 20, 115);
      const status = data.status as keyof typeof statusConfig;
      pdf.text(`Status: ${statusConfig[status]?.en || data.status}`, 20, 125);
      
      pdf.setFont(THAI_PDF_FONT, "bold");
      pdf.text("Products:", 20, 140);
      
      let y = 150;
      pdf.setFont(THAI_PDF_FONT, "normal");
      data.items?.forEach((item: any, i: number) => {
        pdf.text(`${i + 1}. ${item.product?.productName || '-'} - ${item.quantity} ${item.unit}`, 25, y);
        y += 8;
        if (item.bom && item.bom.length > 0) {
          pdf.setFontSize(9);
          pdf.text('Materials:', 30, y);
          y += 6;
          item.bom.forEach((bom: any) => {
            pdf.text(`- ${bom.materialCode}: ${bom.materialName} (${(bom.quantity * item.quantity).toFixed(2)} ${bom.unit})`, 35, y);
            y += 5;
          });
          pdf.setFontSize(11);
          y += 3;
        }
      });
      
      pdf.save(`Plan_${data.planCode}.pdf`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleExportAllPDF = async () => {
    try {
      const doc = new jsPDF();
      await ensureThaiPdfFontsLoaded();
      registerThaiFontOnDoc(doc);
      
      const qrData = [];
      
      for (const plan of plans) {
        const res = await apiFetch(`/production-plans/${plan.id}`);
        if (!res.ok) continue;
        const data = await res.json();
        
        const qrDataUrl = await QRCode.toDataURL(data.planCode, { width: 200, margin: 1 });
        
        const materialCodes = data.items?.flatMap((item: any) => 
          item.bom?.map((bom: any) => bom.materialCode) || []
        ).filter((code: string) => code) || [];
        const materials = materialCodes.length > 0 ? materialCodes.join(', ') : 'N/A';
        
        qrData.push({
          qr: qrDataUrl,
          code: data.planCode,
          name: data.planName,
          date: new Date(data.planDate).toLocaleDateString('en-GB'),
          status: statusConfig[data.status as keyof typeof statusConfig]?.en || data.status,
          materials: materials.substring(0, 50) + (materials.length > 50 ? '...' : '')
        });
      }
      
      const itemsPerRow = 4;
      const itemsPerPage = 20; // 5 rows x 4 columns
      const itemWidth = 48;
      const itemHeight = 55;
      const startX = 10;
      const startY = 10;
      const gapX = 2;
      const gapY = 2;
      
      qrData.forEach((item, index) => {
        if (index > 0 && index % itemsPerPage === 0) {
          doc.addPage();
        }
        
        const pageIndex = index % itemsPerPage;
        const row = Math.floor(pageIndex / itemsPerRow);
        const col = pageIndex % itemsPerRow;
        
        const x = startX + col * (itemWidth + gapX);
        const y = startY + row * (itemHeight + gapY);
        
        // Border
        doc.setDrawColor(200);
        doc.rect(x, y, itemWidth, itemHeight);
        
        // QR Code
        const qrSize = 35;
        const qrX = x + (itemWidth - qrSize) / 2;
        const qrY = y + 2;
        doc.addImage(item.qr, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Text
        doc.setFontSize(9);
        doc.setFont(THAI_PDF_FONT, 'bold');
        doc.text(item.code, x + itemWidth / 2, y + qrSize + 5, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setFont(THAI_PDF_FONT, 'normal');
        const nameLines = doc.splitTextToSize(item.name, itemWidth - 4);
        doc.text(nameLines[0] || '', x + itemWidth / 2, y + qrSize + 10, { align: 'center' });
        
        doc.setFontSize(6);
        doc.text(item.date, x + itemWidth / 2, y + qrSize + 14, { align: 'center' });
        doc.text(item.status, x + itemWidth / 2, y + qrSize + 17, { align: 'center' });
        
        doc.setFontSize(5);
        const matLines = doc.splitTextToSize(`Mat: ${item.materials}`, itemWidth - 4);
        doc.text(matLines[0] || '', x + itemWidth / 2, y + qrSize + 20, { align: 'center' });
      });
      
      doc.save(`Production_Plans_QR_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: 0, quantity: 0, unit: "ชิ้น", remarks: "", bom: [] }] });
  
  const debugMaterial = async (materialCode: string) => {
    try {
      const res = await apiFetch(`/production-plans/debug/material/${encodeURIComponent(materialCode)}`);
      const data = await res.json();
      console.log('=== Debug Material Data ===');
      console.log('Material:', data.material);
      console.log('Stock:', data.stock);
      console.log('Lots:', data.lots);
      console.log('Reservations:', data.reservations);
      console.log('Summary:', data.summary);
      alert(JSON.stringify(data.summary, null, 2));
    } catch (error) {
      console.error('Debug error:', error);
    }
  };
  
  const updateItem = async (index: number, field: keyof PlanItem, value: any) => {
    if (field === "quantity" && value < 0) return;
    
    if (field === "productId" && value > 0) {
      try {
        const res = await apiFetch(`/products/${value}/bom`);
        if (res.ok) {
          const result = await res.json();
          const bomData = (result.data || []).map((item: any) => ({
            materialId: item.materialId,
            materialCode: item.material?.matCode || '',
            materialName: item.material?.matName || '',
            quantity: parseFloat(item.quantityPerUnit || 0),
            unit: item.unit || ''
          }));
          
          const newItems = [...form.items];
          newItems[index] = { 
            ...newItems[index], 
            [field]: value,
            bom: bomData
          };
          setForm({ ...form, items: newItems });
          return;
        }
      } catch (error) {
        console.error("Error fetching BOM:", error);
      }
    }
    
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };
  const removeItem = (index: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  return (
    <div className="min-h-0">
      <PageBreadcrumb pageTitle="จัดงานล่วงหน้า" />
      <div className="mx-auto max-w-[1600px] space-y-5 sm:space-y-6 px-1 sm:px-0">
        <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900/80 sm:p-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">
            แผนการผลิต
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            ค้นหา กรองตามวันที่และเวลา จัดการแผน และส่งออกรายงาน — รองรับการใช้งานบนมือถือและแท็บเล็ต
          </p>
        </div>

        {message && message.type === "success" && (
          <Alert 
            variant={message.type} 
            title="สำเร็จ" 
            message={message.text} 
          />
        )}
        
        <ComponentCard title={`แผนการผลิตทั้งหมด (${pagination?.total || 0})`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleExportPlansXlsx}
              disabled={plans.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/80"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={handleExportPlansPdf}
              disabled={plans.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/80"
            >
              Export PDF
            </button>
          </div>
          <div className="mb-5 space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700/80 dark:bg-gray-900/30 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                placeholder="ค้นหา (รหัส, ชื่อแผน)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="draft">ร่าง</option>
                <option value="reserved">จองแล้ว</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterTimeFrom('');
                  setFilterTimeTo('');
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700 sm:w-auto"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ล้างตัวกรอง
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">วันที่เริ่มต้น</label>
                <div className="relative">
                  <input
                    ref={dateFromPickerRef}
                    type="text"
                    value={filterDateFrom}
                    onChange={() => {}}
                    placeholder="เลือกวันที่"
                    className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    value={filterDateTo}
                    onChange={() => {}}
                    placeholder="เลือกวันที่"
                    className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex shrink-0 items-center">
              <PaginationSelector currentLimit={limit} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/pc/reservations')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="hidden sm:inline">ดูรายการจอง Material</span>
                <span className="sm:hidden">จอง Material</span>
              </button>
              <button
                type="button"
                onClick={handleExportAllPDF}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(true);
                  setEditingPlan(null);
                  setForm({ planName: "", planDate: "", planTime: "", remarks: "", items: [] });
                  setProductSearches({});
                  setShowProductDropdowns({});
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มแผนใหม่
              </button>
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700 sm:mx-0">
            <table className="w-full min-w-[760px] table-auto text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/90 dark:border-gray-700 dark:bg-gray-800/90">
                  <th className="sticky left-0 z-[1] whitespace-nowrap bg-gray-50/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800/95 dark:text-gray-300 sm:px-4 sm:text-sm">รหัสแผน</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">ชื่อแผน</th>
                  <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">วันที่</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">สถานะ</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">สินค้า</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">Material</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plans.length === 0 ? (
                  <TableEmptyRow colSpan={7} />
                ) : (
                  plans.map((plan) => (
                  <tr key={plan.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                    <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white/95 px-3 py-3 text-sm font-medium text-gray-900 dark:border-gray-800 dark:bg-gray-900/95 dark:text-white sm:px-4">{plan.planCode}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white sm:max-w-xs sm:px-4" title={plan.planName}>{plan.planName}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-white sm:px-4">
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
                    <td className="px-3 py-3 text-center sm:px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400" :
                        plan.status === "reserved" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                        plan.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}>{statusConfig[plan.status].label}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm tabular-nums text-gray-900 dark:text-white sm:px-4">{plan.items?.length || 0}</td>
                    <td className="px-3 py-3 text-center text-sm tabular-nums text-gray-900 dark:text-white sm:px-4">
                      {plan.items?.reduce((acc, item) => acc + (item.bom?.length || 0), 0) || 0}
                    </td>
                    <td className="px-2 py-3 text-center sm:px-4">
                      <div className="mx-auto flex max-w-[220px] flex-wrap items-center justify-center gap-1">
                        {plan.status === "draft" && (
                          <>
                            <button type="button" onClick={() => handleEdit(plan)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/40">แก้ไข</button>
                            <button type="button" onClick={() => handleReserve(plan.id)} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/30">จอง</button>
                          </>
                        )}
                        {(plan.status === "reserved" || plan.status === "confirmed") && (
                          <button type="button" onClick={() => router.push(`/pc/schedule/${plan.id}`)} className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/30">รายละเอียด</button>
                        )}
                        <button type="button" onClick={() => handleExportPDF(plan)} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30">PDF</button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {pagination && (
            <PaginationFooter
              page={page}
              limit={limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              summaryLocale="th"
              hrefBuilder={paginationHref}
            />
          )}
        </ComponentCard>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-8 sm:py-5">
              <h3 className="min-w-0 text-lg font-semibold text-gray-900 dark:text-white sm:text-2xl">
                {editingPlan ? "แก้ไข" : "เพิ่ม"}แผนการผลิต
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-8" style={{ maxHeight: "calc(90vh - 100px)" }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อแผน *</label>
                    <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วันที่ *</label>
                    <div className="relative">
                      <input 
                        ref={datePickerRef}
                        type="text" 
                        value={form.planDate} 
                        onChange={(e) => setForm({ ...form, planDate: e.target.value })} 
                        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                        placeholder="เลือกวันที่"
                        required 
                      />
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <TimePicker
                    label="เวลา"
                    value={form.planTime}
                    onChange={(time) => setForm({ ...form, planTime: time })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หมายเหตุ</label>
                    <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300">รายการสินค้า *</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      เพิ่มรายการ
                    </button>
                  </div>
                  <div className="space-y-4">
                    {form.items.map((item, i) => {
                      const selectedProduct = products.find(p => p.id === item.productId);
                      const productSearch = productSearches[i] || '';
                      const filteredProducts = products.filter(p => 
                        productSearch === '' || 
                        p.productCode.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.productName.toLowerCase().includes(productSearch.toLowerCase())
                      );
                      
                      return (
                      <div key={`item-${i}-${item.productId}`} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                          <div className="relative min-w-0 flex-1">
                            <input
                              type="text"
                              value={productSearch || (selectedProduct ? `${selectedProduct.productCode} - ${selectedProduct.productName}` : '')}
                              onChange={(e) => {
                                setProductSearches({...productSearches, [i]: e.target.value});
                                setShowProductDropdowns({...showProductDropdowns, [i]: true});
                              }}
                              onFocus={() => setShowProductDropdowns({...showProductDropdowns, [i]: true})}
                              placeholder="ค้นหารหัสหรือชื่อสินค้า"
                              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              required
                            />
                            {showProductDropdowns[i] && filteredProducts.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredProducts.map((p) => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      updateItem(i, "productId", p.id);
                                      setProductSearches({...productSearches, [i]: `${p.productCode} - ${p.productName}`});
                                      setShowProductDropdowns({...showProductDropdowns, [i]: false});
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white">{p.productCode}</div>
                                    <div className="text-xs text-gray-500">{p.productName}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:shrink-0">
                            <input
                              type="number"
                              placeholder="จำนวน"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(i, "quantity", +e.target.value)}
                              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-28"
                              required
                            />
                            <input
                              type="text"
                              placeholder="หน่วย"
                              value={item.unit}
                              onChange={(e) => updateItem(i, "unit", e.target.value)}
                              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-24"
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(i)}
                              className="w-full shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 sm:w-auto"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                        {item.productId > 0 && (
                          <div className="px-4 pb-4">
                            {item.bom && item.bom.length > 0 ? (
                              <>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Material ที่ต้องใช้:</div>
                                <div className="overflow-x-auto rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                  <table className="w-full min-w-[520px] text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">รหัส</th>
                                        <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">ชื่อ Material</th>
                                        <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">ต่อหน่วย</th>
                                        <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">รวม</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {item.bom.map((bom, bi) => (
                                        <tr key={bi}>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white">{bom.materialCode}</td>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white">{bom.materialName}</td>
                                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{bom.quantity} {bom.unit}</td>
                                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{(bom.quantity * (item.quantity || 0)).toFixed(2)} {bom.unit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded border border-amber-200 dark:border-amber-800">
                                ⚠️ สินค้านี้ยังไม่มี BOM (Bill of Materials) กรุณาเพิ่ม BOM ก่อนสร้างแผนการผลิต
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full rounded-lg bg-gray-500 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-gray-600 sm:w-auto sm:shrink-0"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 sm:flex-1"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
              <h3 className="min-w-0 break-words text-base font-semibold text-gray-900 dark:text-white sm:text-xl">
                รายละเอียดแผนการผลิต — {selectedPlan.planCode}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ชื่อแผน</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.planName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่และเวลา</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(selectedPlan.planDate).toLocaleDateString("th-TH")}
                      {' '}
                      {selectedPlan.planTime ? selectedPlan.planTime.substring(0, 5) : '00:00'} น.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">รายการสินค้า</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full min-w-[360px] text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">สินค้า</th>
                          <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">จำนวน</th>
                          <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">หน่วย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {(selectedPlan.items?.length ?? 0) === 0 ? (
                          <TableEmptyRow colSpan={3} />
                        ) : (
                          (selectedPlan.items ?? []).map((item, i) => (
                          <React.Fragment key={i}>
                            <tr>
                              <td className="px-4 py-3 text-gray-900 dark:text-white">{item.product?.productName || "-"}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.unit}</td>
                            </tr>
                            {item.bom && item.bom.length > 0 && (
                              <tr>
                                <td colSpan={3} className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Material ที่ต้องใช้:</div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-600 dark:text-gray-400">
                                        <th className="px-2 py-1 text-left">รหัส Material</th>
                                        <th className="px-2 py-1 text-left">ชื่อ Material</th>
                                        <th className="px-2 py-1 text-right">จำนวน</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.bom.map((bom, bi) => (
                                        <tr key={bi}>
                                          <td className="px-2 py-1 text-gray-900 dark:text-white">{bom.materialCode}</td>
                                          <td className="px-2 py-1 text-gray-900 dark:text-white">{bom.materialName}</td>
                                          <td className="px-2 py-1 text-right text-gray-900 dark:text-white">{(bom.quantity * item.quantity).toFixed(2)} {bom.unit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedPlan.reservations && selectedPlan.reservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Material ที่จอง (QR No.)</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">รหัส Material</th>
                            <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">ชื่อ Material</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">จำนวนที่จอง</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Lot No.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedPlan.reservations.map((res) => (
                            <tr key={res.id}>
                              <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{res.material.matCode}</td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white">{res.material.matName}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{parseFloat(res.reservedQuantity).toFixed(2)}</td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{res.lotNumber || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showInsufficientModal && insufficientMaterials.length > 0 && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in border-2 border-red-500 dark:border-red-600 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <span className="text-4xl">⛔</span>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">ไม่สามารถจองได้</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                วัตถุดิบต่อไปนี้มีจำนวนไม่เพียงพอ กรุณาเติม Stock ก่อนทำการจองใหม่
              </p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-4">
                {insufficientMaterials.map((m, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{m.materialName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">รหัส: {m.materialCode}</p>
                      </div>
                      <span className="shrink-0 self-start rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        ขาด {(m.required - m.available).toLocaleString()} {m.unit}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนที่ต้องการ</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{m.required.toLocaleString()} <span className="text-sm text-gray-500">{m.unit}</span></p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">คงเหลือปัจจุบัน</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{m.available.toLocaleString()} <span className="text-sm text-red-500">{m.unit}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 sm:text-left">
                  กรุณาไปที่หน้า Material Receiving เพื่อเติม Stock
                </p>
                <button
                  onClick={() => setShowInsufficientModal(false)}
                  className="w-full rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700 sm:w-auto"
                >
                  รับทราบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
