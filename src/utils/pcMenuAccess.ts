import { PERMISSIONS } from '@/constants/permissions';

const ASSIGNED_PC = new Set<string>([
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
]);

export function userHasAssignedPcPermission(assignedCodes: string[]): boolean {
  return assignedCodes.some((code) => ASSIGNED_PC.has(code));
}

export function isPcModuleRoute(pathname: string): boolean {
  if (!pathname.startsWith('/pc')) {
    return false;
  }
  if (/^\/pc\/production-(step-scan|tracking)(\/|$)/.test(pathname)) {
    return false;
  }
  return true;
}
