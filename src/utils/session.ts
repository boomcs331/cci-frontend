// Session management utilities
import { ADMIN_ROLE_CODE } from '@/constants/permissions';
import type { MenuItem } from '@/types/user';

export interface SessionRole {
  id: string;
  code?: string;
  name?: string;
  permissions?: Array<{ code: string }>;
}

export interface SessionDepartment {
  id: string;
  code?: string;
  name?: string;
}

export interface SessionUser {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: SessionRole[];
  departmentId?: string | null;
  department?: SessionDepartment | null;
  /** ทุกแผนกที่ผู้ใช้สังกัด (จาก login / user_departments) */
  departments?: SessionDepartment[];
}

export interface SessionData {
  token?: string;
  message?: string;
  user?: SessionUser;
  permissions?: string[];
  menus?: MenuItem[];
  expiresAt?: number;
  /** แผนกที่เลือกใช้งาน (ส่ง x-department-id) */
  activeDepartmentId?: string | null;
  /** ผู้ใช้หลายแผนกยืนยันการเลือกแผนกแล้ว (ต้องเลือกก่อนเข้าระบบ) */
  departmentChosen?: boolean;
}

export const SESSION_UPDATED_EVENT = 'cci-session-updated';

const SESSION_TIMEOUT = 3600000;

function resolveDepartments(user?: SessionUser): SessionDepartment[] {
  if (!user) return [];
  if (user.departments?.length) return user.departments;
  if (user.department) return [user.department];
  return [];
}

function pickActiveDepartmentId(session: SessionData): string | null {
  const depts = resolveDepartments(session.user);
  if (!depts.length) return null;

  const multiDept = depts.length > 1;
  const chosen = session.departmentChosen === true || !multiDept;

  if (multiDept && !chosen) {
    return null;
  }

  const preferred = session.activeDepartmentId;
  if (preferred && depts.some((d) => String(d.id) === String(preferred))) {
    return String(preferred);
  }
  const primary = session.user?.departmentId;
  if (primary && depts.some((d) => String(d.id) === String(primary))) {
    return String(primary);
  }
  return String(depts[0].id);
}

function applyActiveDepartmentToUser(
  user: SessionUser,
  activeDepartmentId: string | null,
): SessionUser {
  const depts = resolveDepartments(user);
  if (!activeDepartmentId || !depts.length) return user;
  const active = depts.find((d) => String(d.id) === String(activeDepartmentId));
  if (!active) return user;
  return {
    ...user,
    departments: depts,
    departmentId: activeDepartmentId,
    department: active,
  };
}

/**
 * บันทึก session พร้อมกำหนดเวลาหมดอายุ
 */
export function setSession(data: SessionData): void {
  if (typeof window === 'undefined') return;

  const depts = resolveDepartments(data.user);
  const baseUser = data.user
    ? {
        ...data.user,
        departments: depts.length ? depts : data.user.departments,
      }
    : data.user;

  const multiDept = depts.length > 1;
  const departmentChosen =
    data.departmentChosen === true || (!multiDept && depts.length >= 1);

  const draft: SessionData = {
    ...data,
    user: baseUser,
    departmentChosen,
    expiresAt: Date.now() + SESSION_TIMEOUT,
  };

  const activeDepartmentId = departmentChosen
    ? pickActiveDepartmentId(draft)
    : null;

  let user: SessionUser | undefined = baseUser;
  if (baseUser) {
    if (departmentChosen && activeDepartmentId) {
      user = applyActiveDepartmentToUser(baseUser, activeDepartmentId);
    } else if (multiDept && !departmentChosen) {
      user = {
        ...baseUser,
        departments: depts,
        departmentId: null,
        department: null,
      };
    }
  }

  const sessionData: SessionData = {
    ...draft,
    user,
    activeDepartmentId,
    departmentChosen,
  };

  localStorage.setItem('session', JSON.stringify(sessionData));
  window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT));
}

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) return null;

    const session: SessionData = JSON.parse(sessionStr);

    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to parse session:', error);
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('session');
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

export function getUserPermissions(): string[] {
  const session = getSession();
  if (!session) return [];

  if (Array.isArray(session.permissions) && session.permissions.length > 0) {
    return [...new Set(session.permissions)];
  }

  const permissions: string[] = [];
  session.user?.roles?.forEach((role) => {
    role.permissions?.forEach((permission) => {
      if (!permissions.includes(permission.code)) {
        permissions.push(permission.code);
      }
    });
  });

  return permissions;
}

export function isAdmin(): boolean {
  const session = getSession();
  if (!session) return false;

  return (
    session.user?.roles?.some((role) => role.code === ADMIN_ROLE_CODE) || false
  );
}

export function getUserDepartments(): SessionDepartment[] {
  return resolveDepartments(getSession()?.user);
}

/** รหัสแผนกทั้งหมดของผู้ใช้ */
export function getUserDepartmentCodes(): string[] {
  return getUserDepartments()
    .map((d) => d.code)
    .filter((c): c is string => Boolean(c?.trim()));
}

/** แผนกที่เลือกใช้งาน (primary / สลับจาก header) */
export function getActiveDepartmentId(): string | null {
  const session = getSession();
  if (!session) return null;
  return pickActiveDepartmentId(session);
}

/** รหัสแผนกที่เลือกใช้งาน */
export function getUserDepartmentCode(): string | null {
  const session = getSession();
  return session?.user?.department?.code ?? null;
}

/** ต้องเลือกแผนกก่อนเข้าใช้งานหรือไม่ */
export function needsDepartmentSelection(): boolean {
  const session = getSession();
  if (!session?.user) return false;
  const depts = resolveDepartments(session.user);
  return depts.length > 1 && session.departmentChosen !== true;
}

export function getPostLoginPath(): string {
  return needsDepartmentSelection() ? '/select-department' : '/';
}

/** ยืนยันแผนกที่ใช้งาน (หลังเลือกหน้า select-department หรือสลับจาก header) */
export function confirmActiveDepartment(
  departmentId: string,
  options?: { reload?: boolean },
): void {
  if (typeof window === 'undefined') return;
  const session = getSession();
  if (!session?.user) return;

  const depts = resolveDepartments(session.user);
  if (!depts.some((d) => String(d.id) === String(departmentId))) return;

  const previousId =
    session.activeDepartmentId ?? session.user.departmentId ?? null;
  const changed = String(previousId ?? '') !== String(departmentId);

  setSession({
    ...session,
    departmentChosen: true,
    activeDepartmentId: departmentId,
    user: applyActiveDepartmentToUser(session.user, departmentId),
  });

  if (changed && options?.reload !== false) {
    window.location.reload();
  }
}

export function setActiveDepartmentId(departmentId: string): void {
  confirmActiveDepartment(departmentId);
}

export function getUserMenus(): MenuItem[] {
  const session = getSession();
  return session?.menus ?? [];
}
