/**
 * @deprecated Use `@/lib/pc` instead.
 */
import {
  getPoNoErrorCode,
  getPcFieldErrorMessage,
  sanitizePoNoInput,
} from '@/lib/pc';

export { sanitizePoNoInput };

export function validatePoNo(value: string): string | null {
  const code = getPoNoErrorCode(value);
  return code ? getPcFieldErrorMessage('poNo', code) : null;
}
