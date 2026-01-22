// Session management utilities

export interface SessionData {
  token: string;
  user: any;
  expiresAt?: number; // timestamp
}

// ตั้งค่าเวลา session timeout (1 ชั่วโมง = 3600000 มิลลิวินาที)
const SESSION_TIMEOUT = 3600000; // 1 hour

/**
 * บันทึก session พร้อมกำหนดเวลาหมดอายุ
 */
export function setSession(data: any): void {
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

  const permissions: string[] = [];
  session.user?.roles?.forEach((role: any) => {
    role.permissions?.forEach((permission: any) => {
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

  return session.user?.roles?.some((role: any) => role.id === "1") || false;
}
