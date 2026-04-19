import { redirect } from "next/navigation";

/** เดิมอยู่ที่ /pc/product-stock — ย้ายไป /production/product-stock */
export default function LegacyProductStockRedirect() {
  redirect("/production/product-stock");
}
