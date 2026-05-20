import type { ToastVariant } from '@/context/ToastContext';
import { resolvePcApiError } from './resolve-api-error';

export interface PcAlertPayload {
  variant: ToastVariant;
  title: string;
  message?: string;
}

export function pcErrorFromApiBody(body: unknown): PcAlertPayload {
  const resolved = resolvePcApiError(body);
  return {
    variant: 'error',
    title: resolved.title,
    message: resolved.message,
  };
}

export function pcConnectionError(): PcAlertPayload {
  return {
    variant: 'error',
    title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
  };
}

export function pcSuccess(title: string, message?: string): PcAlertPayload {
  return { variant: 'success', title, message };
}
