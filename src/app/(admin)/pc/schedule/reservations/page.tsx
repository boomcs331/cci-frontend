"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  DataTable,
  type Column,
  StatusBadge,
  ActionButton,
  LoadingState,
  FormField,
} from "@/components/shared";
import Alert from "@/components/ui/alert/Alert";
import { reservationsService } from "@/services";
import { formatMaterialIssuedByDisplay } from "@/utils/resolveStoredUserLabel";
import { getSession } from "@/utils/session";
import {
  syncPlanItemsFromProductionQrGeneration,
} from "@/utils/ensureProductionLotsAfterReserve";

interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: "reserved" | "confirmed";
  materialIssuedBy?: string[];
  items?: {
    product?: { productName: string };
    quantity: number;
    unit: string;
  }[];
}

export default function ScheduleReservationsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");

  const sessionUser = useMemo(() => getSession()?.user, []);

  const stats = useMemo(() => {
    const reserved = plans.filter((p) => p.status === "reserved").length;
    const confirmed = plans.filter((p) => p.status === "confirmed").length;
    return { total: plans.length, reserved, confirmed };
  }, [plans]);

  const fetchPlans = useCallback(async (options?: { showInitialSpinner?: boolean }) => {
    const showSpinner = options?.showInitialSpinner ?? true;
    if (showSpinner) setLoading(true);
    try {
      const reservedPlans = await reservationsService.fetchReservations();
      setPlans(reservedPlans);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans({ showInitialSpinner: true });
  }, [fetchPlans]);

  const applyFilters = useCallback(() => {
    let filtered = [...plans];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p: ProductionPlan) =>
          p.planCode?.toLowerCase().includes(q) ||
          p.planName?.toLowerCase().includes(q),
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(
        (p: ProductionPlan) =>
          p.status.toLowerCase() === filterStatus.toLowerCase(),
      );
    }
    if (filterDateFrom) {
      filtered = filtered.filter(
        (p: ProductionPlan) => new Date(p.planDate) >= new Date(filterDateFrom),
      );
    }
    if (filterDateTo) {
      filtered = filtered.filter(
        (p: ProductionPlan) => new Date(p.planDate) <= new Date(filterDateTo),
      );
    }
    if (filterTimeFrom) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return planTime >= filterTimeFrom;
      });
    }
    if (filterTimeTo) {
      filtered = filtered.filter((p: ProductionPlan) => {
        const planTime = p.planTime ? p.planTime.substring(0, 5) : "00:00";
        return planTime <= filterTimeTo;
      });
    }

    setFilteredPlans(filtered);
  }, [
    plans,
    searchTerm,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterTimeFrom,
    filterTimeTo,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlans({ showInitialSpinner: false });
    } finally {
      setRefreshing(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const plan = plans.find((p) => p.planCode === barcode.trim());
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
      const body = await reservationsService.confirmAndIssue(plan.id);
      try {
        const lotPlan = await reservationsService.fetchDetails(plan.id);
        await syncPlanItemsFromProductionQrGeneration(
          lotPlan,
          body.productionQrGeneration,
        );
      } catch (e) {
        console.warn("sync production QR after barcode confirm failed", e);
      }
      setMessage({
        type: "success",
        text: `ยืนยันแผน ${plan.planCode} และจ่ายออกวัตถุดิบสำเร็จ — สร้าง QR ล็อตผลิตแล้ว`,
      });
      setBarcode("");
      await fetchPlans({ showInitialSpinner: false });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "ไม่สามารถยืนยันแผนได้",
      });
      setBarcode("");
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTimeFrom("");
    setFilterTimeTo("");
  };

  const columns = useMemo<Column<ProductionPlan>[]>(
    () => [
      {
        key: "planCode",
        title: "รหัสแผน",
        render: (_, row) => (
          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
            {row.planCode}
          </span>
        ),
      },
      {
        key: "planName",
        title: "ชื่อแผน",
        render: (_, row) => (
          <span className="line-clamp-2 whitespace-normal max-w-[220px]" title={row.planName}>
            {row.planName}
          </span>
        ),
      },
      {
        key: "planDate",
        title: "วัน / เวลา",
        render: (_, row) => (
          <div>
            <span className="font-medium">
              {new Date(row.planDate).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {row.planTime ? `${row.planTime.substring(0, 5)} น.` : "00:00 น."}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        title: "สถานะ",
        align: "center",
        render: (_, row) => <StatusBadge status={row.status} />,
      },
      {
        key: "items",
        title: "บรรทัดสินค้า",
        align: "center",
        render: (_, row) => (
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium tabular-nums text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {row.items?.length ?? 0}
          </span>
        ),
      },
      {
        key: "issuedBy",
        title: "จ่ายออกโดย",
        render: (_, row) => {
          const issuedByLabel = formatMaterialIssuedByDisplay(
            {
              status: row.status,
              materialIssuedBy: row.materialIssuedBy ?? [],
            },
            sessionUser,
          );
          if (issuedByLabel == null) {
            return <span className="text-gray-400">—</span>;
          }
          return (
            <span className="line-clamp-2 whitespace-normal max-w-[160px]" title={issuedByLabel}>
              {issuedByLabel}
            </span>
          );
        },
      },
      {
        key: "actions",
        title: "การทำงาน",
        align: "right",
        render: (_, row) => (
          <ActionButton
            variant="success"
            size="sm"
            onClick={() => router.push(`/pc/schedule/reservations/${row.id}`)}
          >
            รายละเอียด
          </ActionButton>
        ),
      },
    ],
    [router, sessionUser],
  );

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="แผนผลิตที่จองสำเร็จแล้ว" />
        <LoadingState message="กำลังโหลดข้อมูล..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="แผนผลิตที่จองสำเร็จแล้ว"
        description="แสดงเฉพาะแผนที่จองวัตถุดิบแล้วหรือยืนยันและจ่ายออกแล้ว — สแกนรหัสแผนเพื่อยืนยันรวดเร็ว หรือเปิดรายละเอียดเพื่อจ่ายทีละบรรทัด"
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:inline">
                อัปเดตล่าสุด {lastUpdated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <ActionButton
              variant="secondary"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              }
            >
              {refreshing ? "กำลังรีเฟรช…" : "รีเฟรชข้อมูล"}
            </ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">แผนทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              แผนการผลิตทั้งหมดในระบบ
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">รอจ่ายออก (จองแล้ว)</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.reserved.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              แผนที่รอการยืนยันและจ่ายออก
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">ยืนยันแล้ว</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.confirmed.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              แผนที่ยืนยันและจ่ายออกแล้ว
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-500 text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6">
          <Alert
            variant={message.type}
            title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}
            message={message.text}
          />
        </div>
      )}

      <ContentCard
        title="ค้นหาและกรองแผนผลิต"
        subtitle="กรองแผนผลิตตามรหัส ชื่อ สถานะ และช่วงวันเวลาที่ต้องการ หรือสแกนรหัสแผนเพื่อยืนยันรวดเร็ว"
        className="mb-6"
      >
        <form onSubmit={handleBarcodeSubmit} className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18M7 3v18M17 3v18" />
              </svg>
            </div>
            <FormField
              label="รหัสแผนสำหรับสแกน / Plan code"
              name="plan-barcode"
              value={barcode}
              onChange={(value) => setBarcode(String(value))}
              placeholder="ค้นหาด้วยรหัสแผน / Plan code — สแกนเพื่อยืนยันและจ่ายออกทันที"
              className="h-12 pl-12"
              hideLabel
            />
          </div>
          <ActionButton
            type="submit"
            variant="success"
            size="md"
            className="h-12 shrink-0"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            ยืนยันและจ่ายออก
          </ActionButton>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="ค้นหา"
            name="search"
            value={searchTerm}
            onChange={(value) => setSearchTerm(String(value))}
            placeholder="รหัสแผน / ชื่อแผน"
          />
          <FormField
            label="สถานะ"
            name="status"
            type="select"
            value={filterStatus}
            onChange={(value) => setFilterStatus(String(value))}
            options={[
              { value: "", label: "ทุกสถานะ" },
              { value: "reserved", label: "จองแล้ว" },
              { value: "confirmed", label: "ยืนยันแล้ว" },
            ]}
          />
          <FormField
            label="วันที่เริ่มต้น"
            name="dateFrom"
            type="date"
            value={filterDateFrom}
            onChange={(value) => setFilterDateFrom(String(value))}
          />
          <FormField
            label="วันที่สิ้นสุด"
            name="dateTo"
            type="date"
            value={filterDateTo}
            onChange={(value) => setFilterDateTo(String(value))}
          />
          <FormField
            label="เวลาเริ่มต้น"
            name="timeFrom"
            type="time"
            value={filterTimeFrom}
            onChange={(value) => setFilterTimeFrom(String(value))}
            placeholder="เลือกเวลา"
          />
          <FormField
            label="เวลาสิ้นสุด"
            name="timeTo"
            type="time"
            value={filterTimeTo}
            onChange={(value) => setFilterTimeTo(String(value))}
            placeholder="เลือกเวลา"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <ActionButton variant="secondary" onClick={clearFilters}>
            ล้างตัวกรอง
          </ActionButton>
        </div>
      </ContentCard>

      <ContentCard
        title={`รายการแผน (${filteredPlans.length.toLocaleString()} รายการ)`}
        subtitle="คลิก รายละเอียด เพื่อดูข้อมูลแผนผลิตและจ่ายออกวัตถุดิบทีละบรรทัด"
      >
        <DataTable
          columns={columns}
          data={filteredPlans}
          rowKey="id"
          emptyMessage="ไม่พบแผนที่ตรงกับตัวกรอง — ลองปรับเปลี่ยนตัวกรองหรือค้นหาด้วยข้อมูลอื่น"
        />
      </ContentCard>
    </PageContainer>
  );
}
