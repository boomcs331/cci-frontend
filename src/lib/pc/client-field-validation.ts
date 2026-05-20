import { PcErrorCode } from './error-catalog';
import { PO_NO_MAX_LENGTH, PO_NO_PATTERN, PO_NO_THAI_PATTERN } from './constants';

/** Returns error code only — messages via getPcFieldErrorMessage(). */
export function getPoNoErrorCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return PcErrorCode.PC_PO_NO_REQUIRED;
  if (PO_NO_THAI_PATTERN.test(trimmed) || !PO_NO_PATTERN.test(trimmed)) {
    return PcErrorCode.PC_PO_NO_INVALID;
  }
  if (trimmed.length > PO_NO_MAX_LENGTH) return PcErrorCode.PC_PO_NO_TOO_LONG;
  return null;
}

export function getMfgDateErrorCode(value: string): string | null {
  if (!value?.trim()) return PcErrorCode.PC_MFG_DATE_REQUIRED;
  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) return PcErrorCode.PC_MFG_DATE_INVALID;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (selected > today) return PcErrorCode.PC_MFG_DATE_FUTURE;
  return null;
}
