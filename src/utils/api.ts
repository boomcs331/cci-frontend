// API utility functions
import { getSession } from '@/utils/session';

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
  // ลบ slash ซ้ำถ้ามี
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
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

  if (!headers.has('x-department-id')) {
    const departmentId = session.user.departmentId ?? session.user.department?.id;
    if (departmentId) {
      headers.set('x-department-id', String(departmentId));
    }
  }

  if (session.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }
}

/**
 * Fetch wrapper ที่ใช้ API Base URL อัตโนมัติ
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  const headers = new Headers(options?.headers);

  applySessionAuthHeaders(headers);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Fetch และ parse JSON response
 */
export async function apiFetchJson<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return response.json();
}
