import { getApiBaseUrl } from '@/utils/api';

export function resolveProductImagePath(
  product:
    | {
        productImagePath?: string | null;
        product_image_path?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!product) return null;
  const path = product.productImagePath ?? product.product_image_path;
  return path?.trim() || null;
}

/** Path from API e.g. uploads/product-images/xxx.jpg */
export function productImageUrl(path: string | null | undefined): string | null {
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

export async function uploadProductImageFile(
  file: File,
): Promise<{ filePath: string }> {
  const { apiFetch } = await import('@/utils/api');
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFetch('/products/upload/product-image', {
    method: 'POST',
    body: fd,
  });
  const json = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: { filePath?: string };
  };
  if (!res.ok || json.success === false) {
    throw new Error(
      typeof json.message === 'string' ? json.message : 'อัปโหลดรูปภาพไม่สำเร็จ',
    );
  }
  const filePath = json.data?.filePath?.trim();
  if (!filePath) {
    throw new Error('อัปโหลดรูปภาพไม่สำเร็จ');
  }
  return { filePath };
}
