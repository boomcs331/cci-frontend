/** ชื่อสิทธิ์ภาษาไทยสำหรับ UI และข้อความ error */
export const PERMISSION_LABELS_TH: Record<string, string> = {
  "production_orders.read": "ดูคำสั่งผลิต / QR",
  "production_orders.create": "สร้างคำสั่งผลิต",
  "production_orders.update": "ดำเนินการคำสั่งผลิต (เริ่ม/ปิดขั้น / Split)",
  "production_orders.manage": "จัดการคำสั่งผลิต",
  "production_plans.read": "ดูแผนผลิต (legacy)",
  "production_plans.create": "สร้างแผนผลิต (legacy)",
  "production_plans.update": "แก้ไขแผนผลิต (legacy)",
  "production_plans.delete": "ลบแผนผลิต (legacy)",
  "production_plans.reserve": "จองวัตถุดิบ (รายการจอง)",
  "production_plans.generate_orders": "สร้างคำสั่งผลิตจากแผน",
  "production_plans.approve": "อนุมัติแผนผลิต",
  "production_plans.issue": "จ่ายออก / รายการจ่าย (legacy)",
  "production_plans.cancel": "ยกเลิกแผนผลิต",
  "production_plans.manage": "จัดการแผนผลิต (ระบบ)",

  "inbound.create": "รับเข้า — สร้าง",
  "inbound.read": "รับเข้า — ดู",
  "inbound.update": "รับเข้า — แก้ไข",
  "inbound.delete": "รับเข้า — ลบ",
  "outbound.create": "จ่ายออก — สร้าง",
  "outbound.read": "จ่ายออก — ดู",
  "outbound.update": "จ่ายออก — แก้ไข",
  "outbound.delete": "จ่ายออก — ลบ",
  "material.create": "วัตถุดิบ — สร้าง",
  "material.read": "วัตถุดิบ — ดู",
  "material.update": "วัตถุดิบ — แก้ไข",
  "material.delete": "วัตถุดิบ — ลบ",
  "production_plan.create": "แผนจองสำเร็จ — สร้าง",
  "production_plan.read": "แผนจองสำเร็จ — ดู",
  "production_plan.update": "แผนจองสำเร็จ — แก้ไข",
  "production_plan.delete": "แผนจองสำเร็จ — ลบ",
  "report.create": "รายงาน — สร้าง",
  "report.read": "รายงาน — ดู",
  "report.update": "รายงาน — แก้ไข",
  "report.delete": "รายงาน — ลบ",

  "production_order.create": "คำสั่งผลิต — สร้าง",
  "production_order.read": "คำสั่งผลิต — ดู",
  "production_order.update": "คำสั่งผลิต — ดำเนินการ",
  "production_order.delete": "คำสั่งผลิต — ลบ",
  "production_order.manage": "คำสั่งผลิต — จัดการระบบ",
  "production_step.create": "ขั้นตอนผลิต — สร้าง",
  "production_step.read": "ขั้นตอนผลิต — ดู",
  "production_step.update": "ขั้นตอนผลิต — ดำเนินการ (QR แผนก)",
  "production_step.delete": "ขั้นตอนผลิต — ลบ",
  "production_step.manage": "ขั้นตอนผลิต — จัดการระบบ",
  "production_lot.create": "ล็อตผลิต — สร้าง",
  "production_lot.read": "ล็อตผลิต — ดู",
  "production_lot.update": "ล็อตผลิต — ดำเนินการ (split)",
  "production_lot.delete": "ล็อตผลิต — ลบ",
  "production_lot.manage": "ล็อตผลิต — จัดการระบบ",
  "production_product.create": "สินค้า (Production) — สร้าง",
  "production_product.read": "สินค้า (Production) — ดู",
  "production_product.update": "สินค้า (Production) — แก้ไข",
  "production_product.delete": "สินค้า (Production) — ลบ",
  "production_product.manage": "สินค้า (Production) — จัดการระบบ",

  "product_stock.create": "สต็อกสินค้า — สร้าง",
  "product_stock.read": "สต็อกสินค้า — ดู",
  "product_stock.update": "สต็อกสินค้า — แก้ไข",
  "product_stock.delete": "สต็อกสินค้า — ลบ",
  "product_stock.manage": "สต็อกสินค้า — จัดการระบบ",
  "sales_reservation.create": "จองขาย — สร้าง",
  "sales_reservation.read": "จองขาย — ดู",
  "sales_reservation.update": "จองขาย — แก้ไข",
  "sales_reservation.delete": "จองขาย — ลบ",
  "sales_reservation.manage": "จองขาย — จัดการระบบ",
  "stock_overview.read": "ภาพรวมสต็อก — ดู",
  "stock_alert.read": "แจ้งเตือนสต็อก — ดู",
};

export const MODULE_LABELS_TH: Record<string, string> = {
  production_plans: "แผนผลิต (legacy)",
  production_orders: "คำสั่งผลิต (legacy)",
  production: "การผลิต",
  stock: "สต็อก / สินค้าขาย",
  pc: "PC",
  products: "สินค้า (legacy)",
};

export const ROLE_LABELS_TH: Record<string, string> = {
  PC_STAFF: "PC Staff — ปฏิบัติการ PC",
  PC_ADMIN: "PC Admin — จัดการ PC เต็มรูปแบบ",
};

export function permissionLabelTh(code: string, fallbackName?: string): string {
  return PERMISSION_LABELS_TH[code] ?? fallbackName ?? code;
}

export function moduleLabelTh(module: string): string {
  return MODULE_LABELS_TH[module] ?? module;
}
