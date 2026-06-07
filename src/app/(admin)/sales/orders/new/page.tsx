"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";
import {
  createSalesOrder,
  submitSalesOrder,
  type CreateOrderInput,
} from "@/services/sales/salesOrderService";
import DatePicker from "@/components/form/date-picker";

type CustomerOption = { id: number; name: string; code: string };
type ProductOption = { id: number; productCode: string; productName: string };

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          apiFetch("/masters/products/customers/all"),
          apiFetch("/products/all"),
        ]);
        if (cRes.ok) {
          const cData = await cRes.json();
          const list = Array.isArray(cData) ? cData : cData.data ?? [];
          setCustomers(
            list.map((c: { id: number; name?: string; code?: string; customerName?: string; customerCode?: string }) => ({
              id: c.id,
              name: c.name ?? c.customerName ?? String(c.id),
              code: c.code ?? c.customerCode ?? "",
            })),
          );
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          const list = Array.isArray(pData) ? pData : pData.data ?? [];
          setProducts(
            list.map((p: { id: number; productCode: string; productName: string }) => ({
              id: p.id,
              productCode: p.productCode,
              productName: p.productName,
            })),
          );
        }
      } catch {
        setError("โหลดข้อมูล master ไม่สำเร็จ");
      }
    })();
  }, []);

  const buildPayload = (status: "DRAFT" | "PENDING"): CreateOrderInput => ({
    customerId: Number(customerId),
    deliveryDate: deliveryDate ? deliveryDate.toISOString().split('T')[0] : undefined,
    note: note || undefined,
    status,
    items: [
      {
        productId: Number(productId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      },
    ],
  });

  const save = async (asPending: boolean) => {
    if (!customerId || !productId || Number(quantity) <= 0) {
      setError("กรุณาเลือกลูกค้า สินค้า และจำนวน");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const order = await createSalesOrder(
        buildPayload(asPending ? "PENDING" : "DRAFT"),
      );
      if (asPending && order.status === "DRAFT") {
        await submitSalesOrder(order.id);
      }
      router.push(`/sales/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="สร้างออเดอร์ขาย" />
      <Link href="/sales/orders" className="text-sm text-brand-500 hover:underline">
        ← กลับรายการ
      </Link>

      <div className="mt-4">
        <ComponentCard title="ข้อมูลออเดอร์ใหม่">
          {error && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">ลูกค้า</label>
              <select
                className={inputClass}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- เลือก --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <DatePicker
                id="delivery-date"
                label="วันจัดส่ง"
                placeholder="เลือกวันจัดส่ง"
                defaultDate={deliveryDate || undefined}
                onChange={(selectedDates) => {
                  if (selectedDates && selectedDates.length > 0) {
                    setDeliveryDate(selectedDates[0]);
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">สินค้า</label>
              <select
                className={inputClass}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">-- เลือก --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} — {p.productName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">จำนวน</label>
                <input
                  type="number"
                  min={0.0001}
                  step="any"
                  className={inputClass}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">ราคาต่อหน่วย</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">หมายเหตุ</label>
              <textarea
                className={`${inputClass} min-h-[80px] py-2`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700"
            >
              บันทึกร่าง
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
            >
              ส่งคำขอขาย
            </button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
