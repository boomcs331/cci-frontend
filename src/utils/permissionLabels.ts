/** ชื่อสิทธิ์ภาษาไทยสำหรับ UI และข้อความ error */
export const PERMISSION_LABELS_TH: Record<string, string> = {
  "production_orders.read": "ดูคำสั่งผลิต / QR",
  "production_orders.create": "สร้างคำสั่งผลิต",
  "production_orders.update": "ดำเนินการคำสั่งผลิต (เริ่ม/ปิดขั้น / Split)",
  "production_orders.manage": "จัดการคำสั่งผลิต",
  "production_plans.read": "ดูแผนผลิต",
  "production_plans.create": "สร้างแผนผลิต",
  "production_plans.update": "แก้ไขแผนผลิต",
  "production_plans.delete": "ลบแผนผลิต",
  "production_plans.reserve": "จองวัตถุดิบ",
  "production_plans.generate_orders": "สร้างคำสั่งผลิตจากแผน",
  "production_plans.approve": "อนุมัติแผนผลิต",
  "production_plans.issue": "จ่ายวัตถุดิบ",
  "production_plans.cancel": "ยกเลิกแผนผลิต",
  "production_plans.manage": "จัดการแผนผลิต (ระบบ)",
};

export const MODULE_LABELS_TH: Record<string, string> = {
  production_plans: "แผนผลิต",
  production_orders: "คำสั่งผลิต",
};

export function permissionLabelTh(code: string, fallbackName?: string): string {
  return PERMISSION_LABELS_TH[code] ?? fallbackName ?? code;
}

export function moduleLabelTh(module: string): string {
  return MODULE_LABELS_TH[module] ?? module;
}
