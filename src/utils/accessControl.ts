import { PERMISSIONS } from '@/constants/permissions';
import { departmentMatchesAnyUserDepartments } from '@/utils/departmentAccess';

export type PermissionMatchMode = 'all' | 'any';

export interface AccessPolicy {
  requiredPermissions?: string[];
  permissionMatch?: PermissionMatchMode;
  allowedDepartments?: string[];
  adminOnly?: boolean;
}

export interface AccessContext {
  isAdmin: boolean;
  permissions: string[];
  departmentCode?: string | null;
  /** ทุกแผนกของผู้ใช้ — ใช้ตรวจ route policy */
  departmentCodes?: string[];
}

interface RoutePolicy extends AccessPolicy {
  matcher: RegExp;
}

const ROUTE_POLICIES: RoutePolicy[] = [
  // Admin tools and template pages are restricted to global admin.
  {
    matcher: /^\/users(\/|$)/,
    adminOnly: true,
  },
  /** ผู้ใช้ที่ล็อกอินแล้วดูข้อมูล session ของตัวเองได้ทุกคน */
  {
    matcher: /^\/session(\/|$)/,
  },
  {
    matcher: /^\/master-data(\/|$)/,
    adminOnly: true,
  },
  {
    matcher: /^\/balances\/overview(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTS_STOCK_READ],
    permissionMatch: 'any',
  },
  // Department-specific flows.
  {
    matcher: /^\/pc\/schedule(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ],
    allowedDepartments: ['WE'],
  },
  {
    matcher: /^\/production\/production-orders(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_ORDERS_READ],
    allowedDepartments: ['WE', 'WELDING', 'PRESS', 'PD'],
  },
  {
    matcher: /^\/production\/dept-step-scan(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.PRODUCTION_ORDERS_READ,
      PERMISSIONS.PRODUCTION_ORDERS_UPDATE,
    ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'WELDING', 'PRESS', 'PD'],
  },
  // PC module pages.
  {
    matcher: /^\/pc\/overview(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/pc\/income(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_CREATE],
  },
  {
    matcher: /^\/pc\/outcome(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_ISSUE],
  },
  {
    matcher: /^\/pc\/reservations(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_RESERVE],
  },
  {
    matcher: /^\/pc\/(production-step-scan|production-tracking)(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_ORDERS_READ],
  },
  {
    matcher: /^\/pc\/(stock|report)(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ],
  },
  {
    matcher: /^\/pc\/product-stock(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTS_STOCK_READ],
  },
  {
    matcher: /^\/pc\/sales-reservations(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTS_STOCK_READ, PERMISSIONS.PRODUCTS_SALES_RESERVE],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/pc(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
  // Production module pages.
  {
    matcher: /^\/production\/overview(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/production\/bom-add(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_CREATE],
  },
  {
    matcher: /^\/production\/product-stock(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTS_STOCK_READ],
  },
  {
    matcher: /^\/production\/sales-reservations(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTS_STOCK_READ, PERMISSIONS.PRODUCTS_SALES_RESERVE],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/production\/products(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_ORDERS_READ],
  },
  {
    matcher: /^\/production\/production-steps(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_ORDERS_READ],
  },
  {
    matcher: /^\/production(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
  // Dashboard default for non-admin users.
  {
    matcher: /^\/$/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
];

export function canAccessPolicy(policy: AccessPolicy, context: AccessContext): boolean {
  if (context.isAdmin) {
    return true;
  }

  if (policy.adminOnly) {
    return false;
  }

  if (policy.allowedDepartments?.length) {
    const codes = context.departmentCodes?.length
      ? context.departmentCodes
      : context.departmentCode
        ? [context.departmentCode]
        : [];
    if (
      !departmentMatchesAnyUserDepartments(codes, policy.allowedDepartments)
    ) {
      return false;
    }
  }

  if (!policy.requiredPermissions || policy.requiredPermissions.length === 0) {
    return true;
  }

  if ((policy.permissionMatch ?? 'all') === 'any') {
    return policy.requiredPermissions.some((permission) => context.permissions.includes(permission));
  }

  return policy.requiredPermissions.every((permission) => context.permissions.includes(permission));
}

export function getRouteAccessPolicy(pathname: string): AccessPolicy | null {
  return ROUTE_POLICIES.find((policy) => policy.matcher.test(pathname)) ?? { adminOnly: true };
}
