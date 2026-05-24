import { PERMISSIONS } from '@/constants/permissions';
import { departmentMatchesAnyUserDepartments } from '@/utils/departmentAccess';
import {
  isPcModuleRoute,
  userHasAssignedPcPermission,
} from '@/utils/pcMenuAccess';
import { userSatisfiesPermission } from '@/utils/permissionExpand';

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
  /** Dashboard — ผู้ใช้ที่ล็อกอินแล้วเข้าได้ทุกคน */
  {
    matcher: /^\/$/,
  },
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
  // Department-specific flows.
  {
    matcher: /^\/pc\/schedule(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.PRODUCTION_PLAN_READ,
      PERMISSIONS.PRODUCTION_PLAN_CREATE,
      PERMISSIONS.PRODUCTION_PLAN_UPDATE,
    ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'PC', 'PD'],
  },
  {
    matcher: /^\/production\/production-orders(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_ORDER_READ],
    allowedDepartments: ['WE', 'WELDING', 'PRESS', 'PD', 'PC'],
  },
  {
    matcher: /^\/production\/dept-step-scan(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.PRODUCTION_STEP_READ,
      PERMISSIONS.PRODUCTION_STEP_UPDATE,
      PERMISSIONS.PRODUCTION_LOT_UPDATE,
    ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'WELDING', 'PRESS', 'PD', 'PC'],
  },
  // PC module pages.
  {
    matcher: /^\/pc\/overview(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_READ, PERMISSIONS.PRODUCTION_ORDERS_READ],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/pc\/income(\/|$)/,
    requiredPermissions: [PERMISSIONS.INBOUND_CREATE, PERMISSIONS.INBOUND_READ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'PC', 'PD'],
  },
  {
    matcher: /^\/pc\/outcome(\/|$)/,
    requiredPermissions: [PERMISSIONS.OUTBOUND_CREATE, PERMISSIONS.OUTBOUND_READ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'PC', 'PD'],
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
    matcher: /^\/pc\/stock(\/|$)/,
    requiredPermissions: [PERMISSIONS.MATERIAL_READ],
    allowedDepartments: ['WE', 'PC', 'PD'],
  },
  {
    matcher: /^\/pc\/report(\/|$)/,
    requiredPermissions: [PERMISSIONS.REPORT_READ],
    allowedDepartments: ['WE', 'PC', 'PD'],
  },
  {
    matcher: /^\/pc\/product-stock(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCT_STOCK_READ],
  },
  {
    matcher: /^\/production\/product-stock(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCT_STOCK_READ],
  },
  {
    matcher: /^\/pc\/sales-reservations(\/|$)/,
    requiredPermissions: [PERMISSIONS.SALES_RESERVATION_READ, PERMISSIONS.SALES_RESERVATION_CREATE],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/production\/sales-reservations(\/|$)/,
    requiredPermissions: [PERMISSIONS.SALES_RESERVATION_READ, PERMISSIONS.SALES_RESERVATION_CREATE],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/balances\/overview(\/|$)/,
    requiredPermissions: [PERMISSIONS.STOCK_OVERVIEW_READ, PERMISSIONS.PRODUCT_STOCK_READ],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/pc(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.MATERIAL_READ,
      PERMISSIONS.INBOUND_READ,
      PERMISSIONS.OUTBOUND_READ,
      PERMISSIONS.PRODUCTION_PLAN_READ,
      PERMISSIONS.REPORT_READ,
    ],
    permissionMatch: 'any',
    allowedDepartments: ['WE', 'PC', 'PD'],
  },
  // Production module pages.
  {
    matcher: /^\/production\/overview(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.PRODUCTION_ORDER_READ,
      PERMISSIONS.PRODUCTION_STEP_READ,
    ],
    permissionMatch: 'any',
  },
  {
    matcher: /^\/production\/bom-add(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PLANS_CREATE],
  },
  {
    matcher: /^\/production\/products(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_PRODUCT_READ],
  },
  {
    matcher: /^\/production\/production-steps(\/|$)/,
    requiredPermissions: [PERMISSIONS.PRODUCTION_STEP_READ],
  },
  {
    matcher: /^\/production(\/|$)/,
    requiredPermissions: [
      PERMISSIONS.PRODUCTION_ORDER_READ,
      PERMISSIONS.PRODUCTION_STEP_READ,
      PERMISSIONS.PRODUCTION_PRODUCT_READ,
    ],
    permissionMatch: 'any',
  },
];

export function canAccessPolicy(
  policy: AccessPolicy,
  context: AccessContext,
  pathname?: string,
): boolean {
  if (context.isAdmin) {
    return true;
  }

  if (policy.adminOnly) {
    return false;
  }

  if (pathname && isPcModuleRoute(pathname)) {
    if (!userHasAssignedPcPermission(context.permissions)) {
      return false;
    }
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
    return policy.requiredPermissions.some((permission) =>
      userSatisfiesPermission(context.permissions, permission),
    );
  }

  return policy.requiredPermissions.every((permission) =>
    userSatisfiesPermission(context.permissions, permission),
  );
}

export function getRouteAccessPolicy(pathname: string): AccessPolicy | null {
  return ROUTE_POLICIES.find((policy) => policy.matcher.test(pathname)) ?? { adminOnly: true };
}

export function canAccessRoute(pathname: string, context: AccessContext): boolean {
  const policy = getRouteAccessPolicy(pathname);
  if (!policy) {
    return false;
  }
  return canAccessPolicy(policy, context, pathname);
}
