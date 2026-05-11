// Session management utilities
import { ADMIN_ROLE_CODE } from '@/constants/permissions';
import type { MenuItem } from '@/types/user';

export interface SessionRole {
  id: string;
  code?: string;
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
  roles?: SessionRole[];
  departmentId?: string | null;
  department?: SessionDepartment | null;
}

export interface SessionData {
  token?: string;
  message?: string;
  user?: SessionUser;
  permissions?: string[];
  menus?: MenuItem[];
  expiresAt?: number; // timestamp
}

// ตั้งค่าเวลา session timeout (1 ชั่วโมง = 3600000 มิลลิวินาที)
const SESSION_TIMEOUT = 3600000; // 1 hour

/**
 * บันทึก session พร้อมกำหนดเวลาหมดอายุ
 */
export function setSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  const sessionData: SessionData = {
    ...data,
    expiresAt: Date.now() + SESSION_TIMEOUT,
  };
  localStorage.setItem('session', JSON.stringify(sessionData));
}

/**
 * ดึงข้อมูล session และตรวจสอบว่าหมดอายุหรือไม่
 */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) return null;

    const session: SessionData = JSON.parse(sessionStr);
    
    // ตรวจสอบว่า session หมดอายุหรือไม่
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

/**
 * ลบ session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('session');
}

/**
 * ตรวจสอบว่า session ยังใช้งานได้หรือไม่
 */
export function isSessionValid(): boolean {
  return getSession() !== null;
}

/**
 * ดึง permissions จาก session
 */
export function getUserPermissions(): string[] {
  const session = getSession();
  if (!session) return [];

  // Preferred source: backend login response sends flattened permissions list.
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

/**
 * ตรวจสอบว่าผู้ใช้มี role id = 1 หรือไม่ (Admin)
 */
export function isAdmin(): boolean {
  const session = getSession();
  if (!session) return false;

  return session.user?.roles?.some((role) => role.code === ADMIN_ROLE_CODE) || false;
}

/**
 * Department code of current user, ex: WE, PD
 */
export function getUserDepartmentCode(): string | null {
  const session = getSession();
  return session?.user?.department?.code || null;
}

export function getUserMenus(): MenuItem[] {
  const session = getSession();
  return session?.menus ?? [];
}
