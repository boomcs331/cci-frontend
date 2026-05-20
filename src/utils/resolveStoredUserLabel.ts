import type { SessionUser } from '@/utils/session';
import { getSession } from '@/utils/session';

/** ชื่อแสดงจาก session (ชื่อ-นามสกุล หรือ username) */
export function sessionDisplayName(user: SessionUser | undefined | null): string {
  if (!user) return '';
  const fn = (user.firstName ?? '').trim();
  const ln = (user.lastName ?? '').trim();
  const combo = `${fn} ${ln}`.trim();
  return combo || (user.username ?? '').trim();
}

/**
 * ถ้าค่าที่เก็บใน DB ตรงกับ username ผู้ล็อกอิน — แสดงชื่อจาก session
 * มิฉะนั้นแสดงค่าจากระบบ (เช่น username คนอื่น)
 */
export function resolveStoredUserLabel(
  storedLabel: string | undefined | null,
  sessionUser?: SessionUser | null,
): string {
  const s = (storedLabel ?? '').trim();
  if (!s) return '—';
  const u = sessionUser ?? getSession()?.user;
  const un = (u?.username ?? '').trim().toLowerCase();
  if (un && s.toLowerCase() === un) {
    const dn = sessionDisplayName(u);
    return dn || s;
  }
  return s;
}

export function resolveStoredUserLabels(
  storedLabels: string[],
  sessionUser?: SessionUser | null,
): string {
  if (!storedLabels.length) return '';
  return storedLabels
    .map((x) => resolveStoredUserLabel((x ?? '').trim(), sessionUser))
    .filter((x) => x !== '—')
    .join(', ');
}

/** หลังยืนยันแล้ว — เติม username ผู้ล็อกอินลงรายการจ่ายออก (ถ้ายังไม่มีใน API) */
export function applyMaterialIssuerAfterConfirm<T extends {
  status: string;
  materialIssuedBy: string[];
}>(plan: T): T {
  if (plan.status.toLowerCase() !== 'confirmed') return plan;
  const username = getSession()?.user?.username?.trim();
  if (!username) return plan;
  const list = [...plan.materialIssuedBy];
  const lower = username.toLowerCase();
  if (list.some((x) => x.trim().toLowerCase() === lower)) return plan;
  return { ...plan, materialIssuedBy: [...list, username] };
}

/** แสดงเฉพาะเมื่อสถานะยืนยันแล้ว — ใช้ชื่อจาก session ถ้า API ยังไม่มีรายชื่อ */
export function formatMaterialIssuedByDisplay(
  plan: { status: string; materialIssuedBy: string[] },
  sessionUser?: SessionUser | null,
): string | null {
  if (plan.status.toLowerCase() !== 'confirmed') return null;
  const u = sessionUser ?? getSession()?.user;
  if (plan.materialIssuedBy.length > 0) {
    return resolveStoredUserLabels(plan.materialIssuedBy, u) || '—';
  }
  const name = sessionDisplayName(u);
  return name || '—';
}
