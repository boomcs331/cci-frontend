import { PO_NO_MAX_LENGTH } from './constants';
import { getPoNoErrorCode } from './client-field-validation';
import { getPcFieldErrorMessage } from './field-errors';
import { sanitizePoNoInput } from './input-sanitizers';

export function getPoNoErrorMessage(value: string): string | null {
  const code = getPoNoErrorCode(value);
  return code ? getPcFieldErrorMessage('poNo', code) : null;
}

export function isPoNoValid(value: string): boolean {
  return getPoNoErrorCode(value) === null;
}

export function applyPoNoInput(raw: string): string {
  return sanitizePoNoInput(raw).slice(0, PO_NO_MAX_LENGTH);
}

export function mergePoNoPaste(current: string, clipboard: string): string {
  return applyPoNoInput(current + clipboard);
}
