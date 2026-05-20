import { PcErrorCode, PC_ERROR_FALLBACK_MESSAGES } from './error-catalog';

/** Map field + code to message for inline form hints (single catalog). */
export function getPcFieldErrorMessage(
  field: string,
  code?: string,
): string | null {
  if (code && code in PC_ERROR_FALLBACK_MESSAGES) {
    return PC_ERROR_FALLBACK_MESSAGES[code as keyof typeof PC_ERROR_FALLBACK_MESSAGES];
  }

  if (field === 'poNo') {
    return PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_PO_NO_REQUIRED];
  }
  if (field === 'mfgDate') {
    return PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_MFG_DATE_REQUIRED];
  }
  if (field === 'materialId') {
    return PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_MATERIAL_REQUIRED];
  }
  if (field === 'totalQuantity') {
    return PC_ERROR_FALLBACK_MESSAGES[PcErrorCode.PC_QUANTITY_INVALID];
  }

  return null;
}
