"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import Alert from "@/components/ui/alert/Alert";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import TimePicker from "@/components/ui/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
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
import { getSession } from "@/utils/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faClipboardList,
  faDiagramProject,
  faFileLines,
  faFilePdf,
  faPenToSquare,
  faPlus,
  faPrint,
  faRotateRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface ApiBomRow {
  materialId: number;
  quantityPerUnit?: string | number;
  unit?: string;
  isActive?: boolean;
  material?: { matCode?: string; matName?: string };
}

interface Product {
  id: number;
  productCode: string;
  productName: string;
  bom?: BOMItem[];
  boms?: ApiBomRow[];
}

function mapApiBomRows(rows: ApiBomRow[] | undefined | null): BOMItem[] {
  return (rows ?? [])
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      materialId: item.materialId,
      materialCode: item.material?.matCode ?? "",
      materialName: item.material?.matName ?? "",
      quantity: parseFloat(String(item.quantityPerUnit ?? 0)),
      unit: item.unit ?? "",
    }));
}

function bomFromProduct(product: Product | undefined): BOMItem[] {
  if (!product) return [];
  if (product.bom?.length) return product.bom;
  if (product.boms?.length) return mapApiBomRows(product.boms);
  return [];
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
  /** บาง response ใช้ snake_case */
  product_code?: string;
  bom?: BOMItem[];
}

/** รหัสชิ้นงาน = รหัสสินค้าในแต่ละรายการแผน (ไม่ซ้ำ) */
function planWorkpieceEntries(plan: ProductionPlan): { code: string; name?: string }[] {
  const items = plan.items ?? [];
  const seen = new Set<string>();
  const out: { code: string; name?: string }[] = [];
  for (const it of items) {
    const code = (
      it.product?.productCode ??
      it.product_code ??
      ""
    )
      .toString()
      .trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const name = it.product?.productName?.toString().trim();
    out.push({ code, name: name || undefined });
  }
  return out;
}

function planMatchesSearch(plan: ProductionPlan, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (plan.planCode?.toLowerCase().includes(needle)) return true;
  if (plan.planName?.toLowerCase().includes(needle)) return true;
  for (const { code, name } of planWorkpieceEntries(plan)) {
    if (code.toLowerCase().includes(needle)) return true;
    if (name?.toLowerCase().includes(needle)) return true;
  }
  return false;
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

/** ปุ่มหน้าจัดงานล่วงหน้า — โฟกัส/โฮเวอร์/กดสม่ำเสมอ */
const SCH = {
  focus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98] transition disabled:pointer-events-none disabled:opacity-45",
  lgOutline:
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm hover:shadow sm:w-auto",
  lgSolid:
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-md hover:shadow sm:w-auto",
  smOutline:
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow",
  iconClose:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200",
} as const;

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
          filtered = filtered.filter((p: ProductionPlan) => planMatchesSearch(p, searchTerm));
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

  const loadBomForProduct = useCallback(
    async (productId: number): Promise<BOMItem[]> => {
      const fromCache = bomFromProduct(products.find((p) => p.id === productId));
      if (fromCache.length > 0) return fromCache;

      try {
        const res = await apiFetch(`/products/${productId}/bom`);
        if (!res.ok) return [];
        const result = await res.json();
        return mapApiBomRows(result.data || []);
      } catch (error) {
        console.error("Error fetching BOM:", error);
        return [];
      }
    },
    [products],
  );

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
        header: "รหัสชิ้นงาน",
        accessor: (p) =>
          planWorkpieceEntries(p)
            .map((x) => x.code)
            .join(", "),
      },
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
    const itemWithoutBom = form.items.find(
      (item) => item.productId > 0 && (!item.bom || item.bom.length === 0),
    );
    if (itemWithoutBom) {
      const product = products.find((p) => p.id === itemWithoutBom.productId);
      const label = product?.productName || product?.productCode || "สินค้าที่เลือก";
      setMessage({
        type: "error",
        text: `สินค้า "${label}" ยังไม่มี BOM กรุณาเพิ่ม BOM ก่อนบันทึกแผนการผลิต`,
      });
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



  const handleEdit = async (plan: ProductionPlan) => {
    setEditingPlan(plan);
    const dateStr = plan.planDate.split("T")[0];
    const timeStr = plan.planTime ? plan.planTime.substring(0, 5) : "00:00";

    const baseItems = plan.items || [];
    const itemsWithBom = await Promise.all(
      baseItems.map(async (item) => ({
        ...item,
        bom: item.productId > 0 ? await loadBomForProduct(item.productId) : [],
      })),
    );

    setForm({
      planName: plan.planName,
      planDate: dateStr,
      planTime: timeStr,
      remarks: plan.remarks || "",
      items: itemsWithBom,
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
      const data = (await res.json()) as ProductionPlan;

      await ensureThaiPdfFontsLoaded();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      registerThaiFontOnDoc(doc);

      const session = getSession();
      const printedBy =
        session?.user?.username?.trim() ||
        session?.user?.email?.trim() ||
        (session?.user?.id != null ? String(session.user.id) : "") ||
        "—";

      const printedAt = new Date().toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const statusKey = data.status as keyof typeof statusConfig;
      const statusTh = statusConfig[statusKey]?.label ?? String(data.status);

      const workpieces = planWorkpieceEntries(data);
      const workpieceLine =
        workpieces.length > 0 ? workpieces.map((w) => `${w.code}`).join(" · ") : "—";

      const qrDataUrl = await QRCode.toDataURL(data.planCode, {
        width: 200,
        margin: 0,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const margin = 10;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      /** โทนสว่างประหยัดหมึก — หัวตารางเทาอ่อน ไม่ใช้พื้นดำ */
      const tableDefaults = {
        styles: {
          font: THAI_PDF_FONT,
          fontStyle: "normal" as const,
          fontSize: 8,
          cellPadding: 1.2,
          overflow: "linebreak" as const,
          textColor: [25, 25, 25] as [number, number, number],
          lineColor: [200, 200, 200] as [number, number, number],
          lineWidth: 0.08,
        },
        headStyles: {
          font: THAI_PDF_FONT,
          fontStyle: "bold" as const,
          fillColor: [236, 236, 236] as [number, number, number],
          textColor: [35, 35, 35] as [number, number, number],
        },
      };

      let y = margin;

      doc.setDrawColor(190, 190, 190);
      doc.setLineWidth(0.25);
      doc.line(margin, y + 16, pageW - margin, y + 16);

      doc.setTextColor(0, 0, 0);
      doc.setFont(THAI_PDF_FONT, "bold");
      doc.setFontSize(12);
      doc.text("แผนการผลิต", margin, y + 5);
      doc.setFont(THAI_PDF_FONT, "normal");
      doc.setFontSize(9);
      doc.text(data.planCode ?? "", margin, y + 10);

      const qrMm = 18;
      doc.addImage(qrDataUrl, "PNG", pageW - margin - qrMm, y, qrMm, qrMm);

      y += 18;

      const planDateStr = new Date(data.planDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const planTimeStr = data.planTime ? data.planTime.substring(0, 5) : "00:00";

      const metaBody: string[][] = [
        ["ชื่อแผน", data.planName ?? "—"],
        ["รหัสแผน", data.planCode ?? "—"],
        ["วันที่", planDateStr],
        ["เวลา", `${planTimeStr} น.`],
        ["สถานะ", statusTh],
        ["รหัสชิ้นงาน", workpieceLine],
        ["ผู้พิมพ์", printedBy],
        ["พิมพ์เมื่อ", printedAt],
      ];
      if (data.remarks?.trim()) {
        metaBody.push(["หมายเหตุ", data.remarks.trim()]);
      }

      autoTable(doc, {
        startY: y + 1,
        head: [["รายการ", "ค่า"]],
        body: metaBody,
        theme: "plain",
        margin: { left: margin, right: margin },
        columnStyles: {
          0: {
            cellWidth: 34,
            fontStyle: "bold",
            fillColor: [250, 250, 250],
            textColor: [45, 45, 45],
          },
          1: { cellWidth: pageW - margin * 2 - 34 },
        },
        ...tableDefaults,
      });

      const afterMeta =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

      const productRows =
        (data.items ?? []).map((item) => {
          const code =
            item.product?.productCode?.trim() ||
            item.product_code?.toString().trim() ||
            "—";
          return [
            code,
            item.product?.productName ?? "—",
            String(item.quantity ?? ""),
            item.unit ?? "—",
          ];
        }) ?? [];

      autoTable(doc, {
        startY: afterMeta,
        head: [["รหัสชิ้นงาน", "ชื่อสินค้า", "จำนวน", "หน่วย"]],
        body: productRows.length > 0 ? productRows : [["—", "ไม่มีรายการ", "", ""]],
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 28, halign: "center" },
          1: { cellWidth: pageW - margin * 2 - 28 - 22 - 18 },
          2: { cellWidth: 22, halign: "right" },
          3: { cellWidth: 18, halign: "center" },
        },
        ...tableDefaults,
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont(THAI_PDF_FONT, "normal");
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(
          `CCI · แผนการผลิต ${data.planCode ?? ""} · ${i}/${totalPages}`,
          pageW / 2,
          pageH - 6,
          { align: "center" },
        );
      }

      doc.save(`Plan_${data.planCode}.pdf`);
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
        
        const qrDataUrl = await QRCode.toDataURL(data.planCode, {
          width: 200,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        
        const materialCodes = data.items?.flatMap((item: any) => 
          item.bom?.map((bom: any) => bom.materialCode) || []
        ).filter((code: string) => code) || [];
        const materials = materialCodes.length > 0 ? materialCodes.join(', ') : 'N/A';
        
        qrData.push({
          qr: qrDataUrl,
          code: data.planCode,
          name: data.planName,
          date: new Date(data.planDate).toLocaleDateString('en-GB'),
          status: statusConfig[data.status as keyof typeof statusConfig]?.label || data.status,
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

    if (field === "productId") {
      const newItems = [...form.items];
      if (value > 0) {
        const bomData = await loadBomForProduct(value);
        newItems[index] = { ...newItems[index], productId: value, bom: bomData };
      } else {
        newItems[index] = { ...newItems[index], productId: value, bom: [] };
      }
      setForm({ ...form, items: newItems });
      return;
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
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-5 shadow-md dark:border-indigo-900/40 dark:from-indigo-950/50 dark:via-gray-900 dark:to-slate-950 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-600/20" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-700/15" aria-hidden />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-800 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200">
                <FontAwesomeIcon icon={faDiagramProject} className="h-3.5 w-3.5" aria-hidden />
                แผนการผลิต
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                จัดงานล่วงหน้า
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                ค้นหาตามรหัสแผน ชื่อแผน หรือ<strong className="font-semibold text-gray-800 dark:text-gray-200"> รหัสชิ้นงาน (รหัสสินค้า)</strong> — กรองวันเวลา จัดการแผน และส่งออกรายงาน
              </p>
            </div>
          </div>
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
              className={`${SCH.lgOutline} ${SCH.focus} border-emerald-200/90 bg-gradient-to-b from-white to-emerald-50/80 text-emerald-900 hover:border-emerald-300 hover:to-emerald-100 focus-visible:ring-emerald-400 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-emerald-900/40 dark:text-emerald-100`}
            >
              <FontAwesomeIcon icon={faFileLines} className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              Export XLSX
            </button>
            <button
              type="button"
              onClick={handleExportPlansPdf}
              disabled={plans.length === 0}
              className={`${SCH.lgOutline} ${SCH.focus} border-rose-200/90 bg-gradient-to-b from-white to-rose-50/80 text-rose-900 hover:border-rose-300 hover:to-rose-100 focus-visible:ring-rose-400 dark:border-rose-500/30 dark:from-rose-950/30 dark:to-rose-900/40 dark:text-rose-100`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              Export PDF
            </button>
          </div>
          <div className="mb-5 space-y-4 rounded-2xl border border-indigo-100/70 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20 p-4 shadow-sm dark:border-gray-700/90 dark:from-gray-900 dark:via-gray-900/80 dark:to-indigo-950/20 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                placeholder="รหัสแผน, ชื่อแผน, รหัสชิ้นงาน, ชื่อสินค้า…"
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
                className={`${SCH.lgSolid} ${SCH.focus} border-slate-600 bg-gradient-to-b from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600 focus-visible:ring-slate-500`}
              >
                <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                ล้างตัวกรอง
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">วันที่เริ่มต้น</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={filterDateFrom ? dayjs(filterDateFrom) : null}
                    onChange={(newValue) => setFilterDateFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'เลือกวันที่',
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.75rem', height: '44px' } },
                      },
                      popper: { sx: { zIndex: 999999 } },
                      dialog: { sx: { zIndex: 999999 } },
                    }}
                  />
                </LocalizationProvider>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">วันที่สิ้นสุด</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={filterDateTo ? dayjs(filterDateTo) : null}
                    onChange={(newValue) => setFilterDateTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'เลือกวันที่',
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.75rem', height: '44px' } },
                      },
                      popper: { sx: { zIndex: 999999 } },
                      dialog: { sx: { zIndex: 999999 } },
                    }}
                  />
                </LocalizationProvider>
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
 {/*              <button
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
              </button> */}
              <button
                type="button"
                onClick={() => {
                  setShowModal(true);
                  setEditingPlan(null);
                  setForm({ planName: "", planDate: "", planTime: "", remarks: "", items: [] });
                  setProductSearches({});
                  setShowProductDropdowns({});
                }}
                className={`${SCH.lgSolid} ${SCH.focus} border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 focus-visible:ring-blue-500`}
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                เพิ่มแผนใหม่
              </button>
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-gray-950/40 dark:ring-white/[0.06] sm:mx-0">
            <div className="space-y-3">
                {plans.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div className="text-center">
                      <div className="text-base font-medium text-gray-600 dark:text-gray-300">ไม่พบแผนการผลิต</div>
                      <div className="text-sm text-gray-400 mt-1">ลองปรับตัวกรองหรือเพิ่มแผนใหม่</div>
                    </div>
                  </div>
                ) : (
                  plans.map((plan) => {
                    const workpieces = planWorkpieceEntries(plan);
                    const badgeTone = [
                      "border-indigo-200/80 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/45 dark:text-indigo-100",
                      "border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/45 dark:text-sky-100",
                      "border-violet-200/80 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/45 dark:text-violet-100",
                      "border-teal-200/80 bg-teal-50 text-teal-900 dark:border-teal-500/30 dark:bg-teal-950/45 dark:text-teal-100",
                    ];
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleViewDetail(plan)}
                        className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                                {plan.planCode}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                plan.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400" :
                                plan.status === "reserved" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                                plan.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                                "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                              }`}>{statusConfig[plan.status].label}</span>
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{plan.planName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {new Date(plan.planDate).toLocaleDateString("th-TH", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} • {plan.planTime ? plan.planTime.substring(0, 5) : '00:00'} น.
                            </div>
                            {workpieces.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {workpieces.slice(0, 3).map((wp, wi) => (
                                  <span
                                    key={wp.code}
                                    title={wp.name ? `${wp.name}` : wp.code}
                                    className={`inline-flex max-w-[9rem] truncate rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold shadow-sm ${badgeTone[wi % badgeTone.length]}`}
                                  >
                                    {wp.code}
                                  </span>
                                ))}
                                {workpieces.length > 3 && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">+{workpieces.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-xs text-gray-400 dark:text-gray-500">สินค้า</div>
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{plan.items?.length || 0}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400 dark:text-gray-500">Material</div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{plan.items?.reduce((acc, item) => acc + (item.bom?.length || 0), 0) || 0}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {plan.status === "draft" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(plan); }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105"
                                    title="แก้ไข"
                                  >
                                    <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleReserve(plan.id); }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:text-amber-400 dark:hover:bg-amber-900/30 transition-all duration-200 hover:scale-105"
                                    title="จอง"
                                  >
                                    <FontAwesomeIcon icon={faBookmark} className="h-4 w-4" aria-hidden />
                                  </button>
                                </>
                              )}
                              {(plan.status === "reserved" || plan.status === "confirmed") && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/pc/schedule/${plan.id}`); }}
                                  className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:text-violet-400 dark:hover:bg-violet-900/30 transition-all duration-200 hover:scale-105"
                                  title="รายละเอียด"
                                >
                                  <FontAwesomeIcon icon={faClipboardList} className="h-4 w-4" aria-hidden />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`${SCH.iconClose} ${SCH.focus} focus-visible:ring-gray-400`}
                aria-label="ปิด"
              >
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
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={form.planDate ? dayjs(form.planDate) : null}
                        onChange={(newValue) => setForm({ ...form, planDate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'เลือกวันที่',
                            required: true,
                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', height: '44px' } },
                          },
                          popper: { sx: { zIndex: 999999 } },
                          dialog: { sx: { zIndex: 999999 } },
                        }}
                      />
                    </LocalizationProvider>
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
                      className={`${SCH.lgOutline} ${SCH.focus} min-h-10 border-blue-200/90 bg-gradient-to-b from-white to-blue-50/90 text-blue-900 hover:border-blue-300 hover:to-blue-100 focus-visible:ring-blue-400 dark:border-blue-500/35 dark:from-blue-950/25 dark:to-blue-900/35 dark:text-blue-100`}
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
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
                              className={`${SCH.smOutline} ${SCH.focus} w-full border-red-200/90 bg-gradient-to-b from-white to-red-50/80 text-red-800 hover:border-red-300 hover:to-red-100 sm:w-auto dark:border-red-500/35 dark:from-red-950/25 dark:to-red-900/35 dark:text-red-100`}
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5 opacity-90" aria-hidden />
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
                                ⚠️ สินค้านี้ยังไม่มี BOM (Bill of Materials) กรุณา{" "}
                                <Link
                                  href={`/production/products/${item.productId}/bom`}
                                  className="font-medium underline hover:text-amber-800 dark:hover:text-amber-200"
                                >
                                  เพิ่ม BOM
                                </Link>{" "}
                                ก่อนสร้างแผนการผลิต
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
                    className={`${SCH.lgOutline} ${SCH.focus} border-slate-300/90 bg-gradient-to-b from-white to-slate-50 text-slate-800 hover:border-slate-400 hover:to-slate-100 focus-visible:ring-slate-400 sm:w-auto sm:shrink-0 sm:px-8`}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className={`${SCH.lgSolid} ${SCH.focus} border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 focus-visible:ring-blue-500 sm:flex-1`}
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
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className={`${SCH.iconClose} ${SCH.focus} focus-visible:ring-gray-400`}
                aria-label="ปิด"
              >
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
                    <table className="w-full min-w-[420px] text-sm">
                      <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">รหัสชิ้นงาน</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">สินค้า</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200">จำนวน</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200">หน่วย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {(selectedPlan.items?.length ?? 0) === 0 ? (
                          <TableEmptyRow colSpan={4} />
                        ) : (
                          (selectedPlan.items ?? []).map((item, i) => {
                            const wpCode =
                              item.product?.productCode?.trim() ||
                              item.product_code?.toString().trim() ||
                              "—";
                            return (
                          <React.Fragment key={i}>
                            <tr className="bg-white/50 dark:bg-gray-900/30">
                              <td className="px-4 py-3 align-top">
                                <span className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-100">
                                  {wpCode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white">{item.product?.productName || "-"}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{item.unit}</td>
                            </tr>
                            {item.bom && item.bom.length > 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50">
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
                            );
                          })
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
                  type="button"
                  onClick={() => setShowInsufficientModal(false)}
                  className={`${SCH.lgSolid} ${SCH.focus} w-full border-slate-700 bg-gradient-to-b from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 focus-visible:ring-slate-500 sm:w-auto sm:px-8`}
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
