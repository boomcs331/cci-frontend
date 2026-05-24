/** Mirror backend permission-expand (PC + Production + Stock) */

export const PC_PERMISSION_IMPLIES_LEGACY: Record<string, readonly string[]> = {
  "inbound.create": ["production_plans.create"],
  "inbound.read": ["production_plans.read"],
  "inbound.update": ["production_plans.update"],
  "inbound.delete": ["production_plans.delete"],
  "outbound.create": ["production_plans.issue"],
  "outbound.read": ["production_plans.read"],
  "outbound.update": ["production_plans.update"],
  "outbound.delete": ["production_plans.delete"],
  "material.create": ["production_plans.create"],
  "material.read": ["production_plans.read"],
  "material.update": ["production_plans.update"],
  "material.delete": ["production_plans.delete"],
  "production_plan.create": ["production_plans.create"],
  "production_plan.read": ["production_plans.read"],
  "production_plan.update": ["production_plans.update"],
  "production_plan.delete": ["production_plans.delete"],
  "report.read": ["production_plans.read"],
  "report.create": ["production_plans.create", "production_plans.manage"],
  "report.update": ["production_plans.update", "production_plans.manage"],
  "report.delete": ["production_plans.delete", "production_plans.manage"],
};

export const PRODUCTION_STOCK_IMPLIES_LEGACY: Record<string, readonly string[]> = {
  "production_order.create": ["production_orders.create"],
  "production_order.read": ["production_orders.read"],
  "production_order.update": ["production_orders.update"],
  "production_order.delete": ["production_orders.delete"],
  "production_order.manage": ["production_orders.manage"],
  "production_step.create": ["production_orders.manage"],
  "production_step.read": ["production_orders.read"],
  "production_step.update": ["production_orders.update"],
  "production_step.delete": ["production_orders.manage"],
  "production_step.manage": ["production_orders.manage"],
  "production_lot.create": ["production_orders.create"],
  "production_lot.read": ["production_orders.read"],
  "production_lot.update": ["production_orders.update"],
  "production_lot.delete": ["production_orders.manage"],
  "production_lot.manage": ["production_orders.manage"],
  "production_product.create": ["production_orders.manage"],
  "production_product.read": ["production_orders.read"],
  "production_product.update": ["production_orders.manage"],
  "production_product.delete": ["production_orders.manage"],
  "production_product.manage": ["production_orders.manage"],
  "product_stock.create": ["products.stock.read"],
  "product_stock.read": ["products.stock.read"],
  "product_stock.update": ["products.stock.read"],
  "product_stock.delete": ["products.stock.read"],
  "product_stock.manage": ["products.stock.read"],
  "sales_reservation.create": ["products.sales.reserve"],
  "sales_reservation.read": ["products.sales.reserve"],
  "sales_reservation.update": ["products.sales.reserve"],
  "sales_reservation.delete": ["products.sales.reserve"],
  "sales_reservation.manage": ["products.sales.reserve"],
  "stock_overview.read": ["products.stock.read"],
  "stock_alert.read": ["products.stock.read"],
};

export const LEGACY_IMPLIES_PRODUCTION_STOCK: Record<string, readonly string[]> = {
  "production_orders.read": [
    "production_order.read",
    "production_step.read",
    "production_lot.read",
    "production_product.read",
  ],
  "production_orders.create": ["production_order.create", "production_lot.create"],
  "production_orders.update": [
    "production_order.update",
    "production_step.update",
    "production_lot.update",
  ],
  "production_orders.delete": ["production_order.delete"],
  "production_orders.manage": [
    "production_order.manage",
    "production_step.manage",
    "production_lot.manage",
    "production_product.manage",
  ],
  "products.stock.read": ["product_stock.read", "stock_alert.read"],
  "products.sales.reserve": [
    "sales_reservation.create",
    "sales_reservation.read",
    "sales_reservation.update",
    "sales_reservation.delete",
    "sales_reservation.manage",
  ],
};

const NEW_TO_LEGACY: Record<string, readonly string[]> = {
  ...PC_PERMISSION_IMPLIES_LEGACY,
  ...PRODUCTION_STOCK_IMPLIES_LEGACY,
};

const LEGACY_TO_NEW: Record<string, readonly string[]> = {
  ...LEGACY_IMPLIES_PRODUCTION_STOCK,
};

export function expandEffectivePermissions(userCodes: string[]): Set<string> {
  const expanded = new Set(userCodes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const code of [...expanded]) {
      for (const legacy of NEW_TO_LEGACY[code] ?? []) {
        if (!expanded.has(legacy)) {
          expanded.add(legacy);
          changed = true;
        }
      }
      for (const newer of LEGACY_TO_NEW[code] ?? []) {
        if (!expanded.has(newer)) {
          expanded.add(newer);
          changed = true;
        }
      }
    }
  }
  return expanded;
}

export function userSatisfiesPermission(
  userCodes: string[],
  required: string,
): boolean {
  return expandEffectivePermissions(userCodes).has(required);
}
