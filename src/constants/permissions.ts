import { userSatisfiesPermission } from '@/utils/permissionExpand';

// Permission codes aligned with backend RBAC module.
export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_CREATE: 'permissions.create',
  PERMISSIONS_UPDATE: 'permissions.update',
  PERMISSIONS_DELETE: 'permissions.delete',

  DEPARTMENTS_READ: 'departments.read',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_DELETE: 'departments.delete',

  PRODUCTION_ORDERS_READ: 'production_orders.read',
  PRODUCTION_ORDERS_CREATE: 'production_orders.create',
  PRODUCTION_ORDERS_UPDATE: 'production_orders.update',
  PRODUCTION_ORDERS_MANAGE: 'production_orders.manage',

  PRODUCTION_PLANS_READ: 'production_plans.read',
  PRODUCTION_PLANS_CREATE: 'production_plans.create',
  PRODUCTION_PLANS_UPDATE: 'production_plans.update',
  PRODUCTION_PLANS_DELETE: 'production_plans.delete',
  PRODUCTION_PLANS_RESERVE: 'production_plans.reserve',
  PRODUCTION_PLANS_GENERATE_ORDERS: 'production_plans.generate_orders',
  PRODUCTION_PLANS_APPROVE: 'production_plans.approve',
  PRODUCTION_PLANS_ISSUE: 'production_plans.issue',
  PRODUCTION_PLANS_CANCEL: 'production_plans.cancel',
  PRODUCTION_PLANS_MANAGE: 'production_plans.manage',

  PRODUCTS_STOCK_READ: 'products.stock.read',
  PRODUCTS_SALES_RESERVE: 'products.sales.reserve',

  /** PC module — resource.action */
  INBOUND_CREATE: 'inbound.create',
  INBOUND_READ: 'inbound.read',
  INBOUND_UPDATE: 'inbound.update',
  INBOUND_DELETE: 'inbound.delete',
  OUTBOUND_CREATE: 'outbound.create',
  OUTBOUND_READ: 'outbound.read',
  OUTBOUND_UPDATE: 'outbound.update',
  OUTBOUND_DELETE: 'outbound.delete',
  MATERIAL_CREATE: 'material.create',
  MATERIAL_READ: 'material.read',
  MATERIAL_UPDATE: 'material.update',
  MATERIAL_DELETE: 'material.delete',
  PRODUCTION_PLAN_CREATE: 'production_plan.create',
  PRODUCTION_PLAN_READ: 'production_plan.read',
  PRODUCTION_PLAN_UPDATE: 'production_plan.update',
  PRODUCTION_PLAN_DELETE: 'production_plan.delete',
  REPORT_CREATE: 'report.create',
  REPORT_READ: 'report.read',
  REPORT_UPDATE: 'report.update',
  REPORT_DELETE: 'report.delete',

  /** Production floor — resource.action */
  PRODUCTION_ORDER_CREATE: 'production_order.create',
  PRODUCTION_ORDER_READ: 'production_order.read',
  PRODUCTION_ORDER_UPDATE: 'production_order.update',
  PRODUCTION_ORDER_DELETE: 'production_order.delete',
  PRODUCTION_ORDER_MANAGE: 'production_order.manage',
  PRODUCTION_STEP_CREATE: 'production_step.create',
  PRODUCTION_STEP_READ: 'production_step.read',
  PRODUCTION_STEP_UPDATE: 'production_step.update',
  PRODUCTION_STEP_DELETE: 'production_step.delete',
  PRODUCTION_STEP_MANAGE: 'production_step.manage',
  PRODUCTION_LOT_CREATE: 'production_lot.create',
  PRODUCTION_LOT_READ: 'production_lot.read',
  PRODUCTION_LOT_UPDATE: 'production_lot.update',
  PRODUCTION_LOT_DELETE: 'production_lot.delete',
  PRODUCTION_LOT_MANAGE: 'production_lot.manage',
  PRODUCTION_PRODUCT_CREATE: 'production_product.create',
  PRODUCTION_PRODUCT_READ: 'production_product.read',
  PRODUCTION_PRODUCT_UPDATE: 'production_product.update',
  PRODUCTION_PRODUCT_DELETE: 'production_product.delete',
  PRODUCTION_PRODUCT_MANAGE: 'production_product.manage',

  /** Stock — resource.action */
  PRODUCT_STOCK_CREATE: 'product_stock.create',
  PRODUCT_STOCK_READ: 'product_stock.read',
  PRODUCT_STOCK_UPDATE: 'product_stock.update',
  PRODUCT_STOCK_DELETE: 'product_stock.delete',
  PRODUCT_STOCK_MANAGE: 'product_stock.manage',
  SALES_RESERVATION_CREATE: 'sales_reservation.create',
  SALES_RESERVATION_READ: 'sales_reservation.read',
  SALES_RESERVATION_UPDATE: 'sales_reservation.update',
  SALES_RESERVATION_DELETE: 'sales_reservation.delete',
  SALES_RESERVATION_MANAGE: 'sales_reservation.manage',
  STOCK_OVERVIEW_READ: 'stock_overview.read',
  STOCK_ALERT_READ: 'stock_alert.read',
} as const;

export const PRODUCTION_PERMISSION_LIST = [
  PERMISSIONS.PRODUCTION_ORDER_CREATE,
  PERMISSIONS.PRODUCTION_ORDER_READ,
  PERMISSIONS.PRODUCTION_ORDER_UPDATE,
  PERMISSIONS.PRODUCTION_ORDER_DELETE,
  PERMISSIONS.PRODUCTION_ORDER_MANAGE,
  PERMISSIONS.PRODUCTION_STEP_CREATE,
  PERMISSIONS.PRODUCTION_STEP_READ,
  PERMISSIONS.PRODUCTION_STEP_UPDATE,
  PERMISSIONS.PRODUCTION_STEP_DELETE,
  PERMISSIONS.PRODUCTION_STEP_MANAGE,
  PERMISSIONS.PRODUCTION_LOT_CREATE,
  PERMISSIONS.PRODUCTION_LOT_READ,
  PERMISSIONS.PRODUCTION_LOT_UPDATE,
  PERMISSIONS.PRODUCTION_LOT_DELETE,
  PERMISSIONS.PRODUCTION_LOT_MANAGE,
  PERMISSIONS.PRODUCTION_PRODUCT_CREATE,
  PERMISSIONS.PRODUCTION_PRODUCT_READ,
  PERMISSIONS.PRODUCTION_PRODUCT_UPDATE,
  PERMISSIONS.PRODUCTION_PRODUCT_DELETE,
  PERMISSIONS.PRODUCTION_PRODUCT_MANAGE,
] as const;

export const STOCK_PERMISSION_LIST = [
  PERMISSIONS.PRODUCT_STOCK_CREATE,
  PERMISSIONS.PRODUCT_STOCK_READ,
  PERMISSIONS.PRODUCT_STOCK_UPDATE,
  PERMISSIONS.PRODUCT_STOCK_DELETE,
  PERMISSIONS.PRODUCT_STOCK_MANAGE,
  PERMISSIONS.SALES_RESERVATION_CREATE,
  PERMISSIONS.SALES_RESERVATION_READ,
  PERMISSIONS.SALES_RESERVATION_UPDATE,
  PERMISSIONS.SALES_RESERVATION_DELETE,
  PERMISSIONS.SALES_RESERVATION_MANAGE,
  PERMISSIONS.STOCK_OVERVIEW_READ,
  PERMISSIONS.STOCK_ALERT_READ,
] as const;

export const PC_PERMISSION_LIST = [
  PERMISSIONS.INBOUND_CREATE,
  PERMISSIONS.INBOUND_READ,
  PERMISSIONS.INBOUND_UPDATE,
  PERMISSIONS.INBOUND_DELETE,
  PERMISSIONS.OUTBOUND_CREATE,
  PERMISSIONS.OUTBOUND_READ,
  PERMISSIONS.OUTBOUND_UPDATE,
  PERMISSIONS.OUTBOUND_DELETE,
  PERMISSIONS.MATERIAL_CREATE,
  PERMISSIONS.MATERIAL_READ,
  PERMISSIONS.MATERIAL_UPDATE,
  PERMISSIONS.MATERIAL_DELETE,
  PERMISSIONS.PRODUCTION_PLAN_CREATE,
  PERMISSIONS.PRODUCTION_PLAN_READ,
  PERMISSIONS.PRODUCTION_PLAN_UPDATE,
  PERMISSIONS.PRODUCTION_PLAN_DELETE,
  PERMISSIONS.REPORT_CREATE,
  PERMISSIONS.REPORT_READ,
  PERMISSIONS.REPORT_UPDATE,
  PERMISSIONS.REPORT_DELETE,
] as const;

export const ADMIN_ROLE_CODE = 'ADMIN_GLOBAL';

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userSatisfiesPermission(userPermissions, required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((permission) => userSatisfiesPermission(userPermissions, permission));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every((permission) => userSatisfiesPermission(userPermissions, permission));
}
