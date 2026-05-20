import { getApiBaseUrl } from '@/utils/api';

/** Path from API e.g. uploads/material-workpieces/xxx.jpg */
export function resolveWorkpieceImagePath(
  material: { workpieceImagePath?: string | null; workpiece_image_path?: string | null } | null | undefined,
): string | null {
  if (!material) return null;
  const path = material.workpieceImagePath ?? material.workpiece_image_path;
  return path?.trim() || null;
}

/**
 * Build URL for workpiece images.
 * Browser: same-origin /uploads/... (Next.js rewrite → backend static).
 * SSR/fallback: API base URL.
 */
export function workpieceImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;

  let normalized = path.trim().replace(/^\//, '');
  if (normalized.startsWith('uploads/')) {
    normalized = normalized.slice('uploads/'.length);
  }

  if (typeof window !== 'undefined') {
    return `/uploads/${normalized}`;
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/uploads/${normalized}`;
}
