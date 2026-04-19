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
} as const;

export const ADMIN_ROLE_CODE = 'ADMIN_GLOBAL';

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every((permission) => userPermissions.includes(permission));
}
