// API utility functions

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

/**
 * Fetch wrapper ที่ใช้ API Base URL อัตโนมัติ
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}

/**
 * Fetch และ parse JSON response
 */
export async function apiFetchJson<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return response.json();
}
