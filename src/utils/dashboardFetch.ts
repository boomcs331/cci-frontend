import { apiFetch, type ApiFetchOptions } from "@/utils/api";
import { userSatisfiesPermission } from "@/utils/permissionExpand";
import { getUserPermissions } from "@/utils/session";

function emptyJsonResponse(payload: unknown = {}): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** เรียก API บน Dashboard เฉพาะเมื่อมีสิทธิ์ — ไม่ขึ้น toast 403 */
export function dashboardFetch(
  endpoint: string,
  requiredPermission: string,
  emptyPayload: unknown = {},
  init?: ApiFetchOptions,
): Promise<Response> {
  const permissions = getUserPermissions();
  if (!userSatisfiesPermission(permissions, requiredPermission)) {
    return Promise.resolve(emptyJsonResponse(emptyPayload));
  }
  return apiFetch(endpoint, { ...init, skipForbiddenToast: true });
}
