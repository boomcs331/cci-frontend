// Application routes

export const ROUTES = {
  // Auth
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  RESET_PASSWORD: '/reset-password',

  // Dashboard
  DASHBOARD: '/',

  // PC Module
  PC: '/pc',
  PC_INCOME: '/pc/income',
  PC_OUTCOME: '/pc/outcome',
  PC_SCHEDULE: '/pc/schedule',
  /** จัดงานล่วงหน้า (alias → /pc/schedule) */
  PRODUCTION_SCHEDULE: '/production/schedule',
  PC_REPORT: '/pc/report',

  // Sales Module
  SALES: '/sales',
  SALES_ORDERS: '/sales/orders',
  SALES_ORDER_NEW: '/sales/orders/new',
  SALES_ORDER_DETAIL: (id: string | number) => `/sales/orders/${id}`,
  SALES_APPROVALS: '/sales/approvals',

  // Users
  USERS: '/users',
  USERS_ADD: '/users/add',
  USERS_ROLES: '/users/roles',
  USERS_PERMISSIONS: '/users/permissions',
  USER_EDIT: (id: string | number) => `/users/${id}/edit`,

  // Session
  SESSION: '/session',

  // Profile
  PROFILE: '/profile',

  // Error Pages
  ERROR_404: '/error-404',
  ERROR_500: '/error-500',
} as const;

// Public routes (no authentication required)
export const PUBLIC_ROUTES = [
  ROUTES.SIGNIN,
  ROUTES.SIGNUP,
  ROUTES.RESET_PASSWORD,
  ROUTES.ERROR_404,
  ROUTES.ERROR_500,
] as const;

// Helper function
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname as any);
}
