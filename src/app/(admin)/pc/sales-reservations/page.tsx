import { redirect } from "next/navigation";

/** เดิมอยู่ที่ /pc/sales-reservations — ย้ายไป /production/sales-reservations */
export default function LegacySalesReservationsRedirect() {
  redirect("/production/sales-reservations");
}
