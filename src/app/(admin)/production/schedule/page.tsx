import { redirect } from "next/navigation";

/** แอลิแอส URL ภายใต้ Production — หน้าจริงอยู่ที่ /pc/schedule */
export default function ProductionSchedulePage() {
  redirect("/pc/schedule");
}
