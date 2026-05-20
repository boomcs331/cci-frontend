import {
  PC_ERROR_FALLBACK_MESSAGES,
  PcErrorCode,
  type PcErrorCodeType,
} from './error-catalog';
import { translateInsufficientStockMessage } from './translate-stock-message';

export interface ApiErrorBody {
  success?: boolean;
  code?: string;
  message?: string | string[];
  errors?: Array<{ field?: string; code?: string; message?: string }>;
}

export interface ResolvedPcError {
  title: string;
  message?: string;
  code?: string;
  field?: string;
}

function isPcErrorCode(code: string): code is PcErrorCodeType {
  return code in PC_ERROR_FALLBACK_MESSAGES;
}

export function resolvePcApiError(body: unknown): ResolvedPcError {
  const data = (body ?? {}) as ApiErrorBody;

  const nestedMessage = data.errors?.[0]?.message;
  const nestedCode = data.errors?.[0]?.code;
  const nestedField = data.errors?.[0]?.field;

  const rawMessage = data.message;
  const primaryMessage = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : nestedMessage;

  const code = data.code ?? nestedCode;
  const fallbackTitle =
    code && isPcErrorCode(code)
      ? PC_ERROR_FALLBACK_MESSAGES[code]
      : PcErrorCode.VALIDATION_FAILED in PC_ERROR_FALLBACK_MESSAGES
        ? PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.VALIDATION_FAILED]
        : 'เกิดข้อผิดพลาด';

  const translatedStock =
    typeof primaryMessage === 'string'
      ? translateInsufficientStockMessage(primaryMessage)
      : undefined;

  const title =
    translatedStock ??
    (code === PcErrorCode.PC_INSUFFICIENT_STOCK && !primaryMessage
      ? PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_INSUFFICIENT_STOCK]
      : undefined) ??
    primaryMessage ??
    fallbackTitle;

  return {
    title,
    message:
      primaryMessage && code && isPcErrorCode(code) && primaryMessage !== fallbackTitle
        ? undefined
        : undefined,
    code,
    field: nestedField,
  };
}
