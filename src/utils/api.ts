// API utility functions
import { clearSession, getSession } from '@/utils/session';
import { publishToast } from '@/context/ToastContext';
import {
  extractApiErrorMessage,
  notifyForbiddenApiError,
  translateApiErrorMessage,
} from '@/utils/apiErrorMessages';

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 20_000;

/** Endpoints that must bypass auto-logout on 401 (e.g., login, public auth). */
const AUTH_BYPASS_ENDPOINTS = new Set<string>([
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
]);

/**
 * ดึง API Base URL จาก environment variable
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3006';
}

/**
 * สร้าง full API URL จาก endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/** Extract path part (strip query string) for bypass lookup. */
function getBypassKey(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const qIndex = clean.indexOf('?');
  return qIndex >= 0 ? clean.slice(0, qIndex) : clean;
}

/** Attach x-user-id, x-department-id, and Bearer from getSession() (respects session expiry). */
function applySessionAuthHeaders(headers: Headers): void {
  if (typeof window === 'undefined') {
    return;
  }

  const session = getSession();
  if (!session?.user?.id) {
    return;
  }

  if (!headers.has('x-user-id')) {
    headers.set('x-user-id', String(session.user.id));
  }

  const username = session.user.username?.trim();
  if (username && !headers.has('x-username')) {
    headers.set('x-username', username);
  }

  if (!headers.has('x-department-id')) {
    const departmentId =
      session.activeDepartmentId ??
      session.user.departmentId ??
      session.user.department?.id;
    if (departmentId) {
      headers.set('x-department-id', String(departmentId));
    }
  }

  if (session.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }
}

/**
 * Redirect to /signin with a reason once auth expires.
 * Guards against repeated redirects when several requests fail at once.
 */
let redirectInFlight = false;
function redirectToSignIn(reason: 'expired' | 'forbidden'): void {
  if (typeof window === 'undefined') return;
  if (redirectInFlight) return;
  if (window.location.pathname === '/signin') return;
  redirectInFlight = true;
  clearSession();
  publishToast({
    variant: 'warning',
    title: 'เซสชันหมดอายุ',
    message: 'กำลังพากลับไปหน้าเข้าสู่ระบบ',
    durationMs: 3000,
  });
  const params = new URLSearchParams({ reason });
  window.location.replace(`/signin?${params.toString()}`);
}

export interface ApiFetchOptions extends RequestInit {
  /** Override request timeout (ms). Set to 0 to disable. */
  timeoutMs?: number;
  /** Skip auto-logout on 401/403 for this call. */
  skipAuthRedirect?: boolean;
}

/**
 * Fetch wrapper ที่ใช้ API Base URL อัตโนมัติ พร้อม:
 *  - แนบ auth headers จาก session
 *  - auto logout เมื่อ 401 (และไม่ใช่ endpoint ระบบ auth เอง)
 *  - request timeout กันค้าง
 */
export async function apiFetch(
  endpoint: string,
  options?: ApiFetchOptions,
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuthRedirect, ...init } = options ?? {};
  const url = getApiUrl(endpoint);
  const headers = new Headers(init.headers);
  applySessionAuthHeaders(headers);

  const shouldBypassAuth =
    skipAuthRedirect || AUTH_BYPASS_ENDPOINTS.has(getBypassKey(endpoint));

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (controller && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal ?? controller?.signal ?? null,
    });

    if (!shouldBypassAuth && response.status === 401) {
      redirectToSignIn('expired');
    }

    if (!shouldBypassAuth && response.status === 403) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const body = await response.clone().json();
          notifyForbiddenApiError(body);
        } catch {
          notifyForbiddenApiError(null);
        }
      } else {
        notifyForbiddenApiError({
          message: 'ไม่มีสิทธิ์ดำเนินการนี้',
        });
      }
    }

    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && timeoutId) {
      publishToast({
        variant: 'warning',
        title: 'คำขอนานเกินไป',
        message: 'เซิร์ฟเวอร์ตอบกลับช้า กรุณาลองใหม่อีกครั้ง',
      });
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Fetch และ parse JSON response โดยโยน ApiError เมื่อไม่ใช่ 2xx
 */
export async function apiFetchJson<T = unknown>(
  endpoint: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  const contentType = response.headers.get('content-type') || '';
  const body: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const raw =
      extractApiErrorMessage(body) ?? `Request failed (${response.status})`;
    throw new ApiError(translateApiErrorMessage(raw), response.status, body);
  }

  return body as T;
}
